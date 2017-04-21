import Content from '../models/contentModel'
import User from '../models/userModel'
import Subscription from '../models/subscriptionModel'
import getUser from '../helpers/get-user'
import saveImage from '../helpers/save-image'
import fs from 'fs'
import path from 'path'
import request from 'request'
import mongoose from 'mongoose'
import apn from 'apn'

const isProduction = (process.env.NODE_ENV === 'production')
const appleCert = fs.readFileSync(path.resolve(process.env.APPLE_CERT_PATH))

const {MAILGUN_KEY, MAILGUN_DOMAIN} = process.env
const mailgun = require( 'mailgun-js' )({
  apiKey: MAILGUN_KEY,
  domain: MAILGUN_DOMAIN
})

const isoPush = new apn.Provider({
  token: {
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
    key: appleCert
  },
  production: isProduction
})

export const findUserId = ( username ) => {
  return new Promise((resolve, reject) => {
    var query = username.match( /^[a-fA-F0-9]{24}$/ ) ? { _id: username } : { username: username }

    User.findOne( query )
    .then( function( result ) {
      if ( !result ) return reject( new Error( { message: "No user found" } ) )
      resolve( result.id )
    })
    .catch( function ( error ) {
      reject( error )
    })
  })
}

export const projectContent = ( slug ) => {
  return new Promise( function ( resolve, reject ) {
    let match

    if ( mongoose.Types.ObjectId.isValid( slug ) ) {
      const objectid = new mongoose.Types.ObjectId( slug )
      match = { $match: { $or: [ { 'users._id': objectid }, { _id: objectid } ] } }
    } else {
      match = { $match: { slug: slug } }
    }

    Content.aggregate( [
      { $unwind: '$users' },
      match,
      { $project: {
        _id: '$users._id',
        title: '$title',
        slug: '$slug',
        url: '$url',
        images: '$images',
        description: '$description',
        added: '$users.added',
        user: '$users.user',
        stream: '$users.stream',
        text: '$text',
        processing: '$processing',
        tags: '$users.tags',
        private: '$users.private',
        thumbnail: '$thumbnail'
      } }
    ] ).exec()
    .then( function ( result ) {
      if ( !result ) throw new Error( "No result. " )

      resolve( result )
    }, function ( error ) {
      reject( error )
    })
  })
}

// adds content to users stream.

export function postContent ( req, res ) {
  const {stream} = req.params
  const {format, url} = req.body

  function getContent () {
    return new Promise( function ( resolve, reject ) {
      request({
        url: process.env.IFRAMELY_URL + "/iframely?url=" + url
      }, function ( err, response, body ) {
        if ( err || response.statusCode !== 200 ) {
          reject( new Error( "Error from embed server: " + body + " --> " + req.body.url ) )
        }

        if ( !body ) {
          reject( new Error( "Error from embed server. No body returned." ) )
        }

        const parsedBody = JSON.parse( body )
        parsedBody.url = url
        resolve( parsedBody )
      })
    })
  }

  function makeContent( contentInfo ) {
    return new Promise( function ( resolve ) {
      var content = new Content({
        url: contentInfo.meta.canonical,
        format,
        ...contentInfo.meta
      })

      getUser( req.token )
      .then( function ( user ) {
        var users = content.users.create({
          user: user._id,
          added: ( new Date() / 1).toFixed(),
          private: true,
          stream,
        })

        content.users.push( users )

        function saveContent () {
          content.save( function () {
            content._id = users._id
            resolve( content )
          })
        }

        /*
        If there is a picture, save and record it. Then save.
        */
        if ( contentInfo.links[2].href ) {
          saveImage(contentInfo.links[2].href)
          .then(({ hash, orig, thumb }) => {
            content.images.push({
              orig,
              thumb,
              hash
            })
            saveContent()
          })
        } else { saveContent() }
      })
    })
  }

  getContent()
  .then( makeContent )
  .then( function ( content ) {
    return res.json( content )
  }).catch( function ( error ) {
    console.log( error )
    return res.status(500).send( error.message )
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status(500).send( { error: error.message } )
  })
}

export function editContent ( req, res ) {
  const {content} = req.params
  const {stream, flags} = req.body

  Content.findOne({ slug: content })
  .then( function (parent) {
    if ( !parent ) throw new Error( "Couldn't find that article to edit." )

    for (const key in req.body) {
      switch (key) {
        case 'description':
        case 'title':
        case 'format':
        case 'stream':
          parent[key] = req.body[key]
          break
        case 'flags':
          for (const flag in req.body.flags) {
            const isChanged = (parent.flags[flag] !== flags[flag])
            parent.flags[flag] = flags[flag]

            const isShare = (stream === 'share-this' || parent.stream === 'share-this')
            const isPublic = (flag === 'hidden' && !flags[flag])

            if (isShare && isPublic && isChanged) {
              Subscription.find()
              .then((subs) => {
                const note = new apn.Notification({
                  expiry: Math.floor(Date.now() / 1000) + 3600,
                  badge: 1,
                  sound: "ping.aiff",
                  alert: `Share this! ${parent.title}`,
                  payload: {'messageFrom': 'BCNDP Connect'},
                  topic: "com.noahGray.NDPConnect"
                })
                const deviceIds = subs.map((sub) => sub.deviceId)

                isoPush.send(note, deviceIds)
                .then((result) => {
                  console.log('isoResult', result)
                  if (result.failed) {
                    console.log('result.failed[0].response', result.failed[0].response)
                  }
                })
              })
            }
          }
          break
        default:
          console.log('UPDATE_KEY_IGNORED', key)
      }
    }

    parent.save()
    .then(data => {
      console.log('CONTENT_UPDATED', data.slug)
      return res.status( 200 ).json({ data })
    }, function ( error ) {
      console.log( error )
      return res.status( 500 ).json( error.message )
    })
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}

/*
INPUT: User token at req.token and username of stream being viewed at req.params.username

OUTPUT: The stream of the user being viewed.

Tries to determine if the stream is the logged-in user's stream, and includes or excluded private posts based on that.
*/
export function getStream ( req, res ) {
  const { stream } = req.params

  const limit = req.query.limit || 10
  const skip = ((req.query.page || 1) - 1) * limit

  Content.find({
    'flags.hidden': false,
    processing: false,
    stream
  }, null, {
    sort: {
      dateAdded: -1
    },
    limit,
    skip
  })
  .then(data => {
    res.status(200).json({ data })
  })
}

/*
Gets a single post. Used to dynamically get content a user just added to their stream, or get an item's content after it's been updated.
*/
export function getContent ( req, res ) {
  Content.findOne({ slug: req.params.slug })
  .then(content => {
    res.status(200).json({data: content})
  })
}

export function deleteContent ( req, res ) {
  const {slug} = req.params

  function deleteItem () {
    return new Promise( function ( resolve, reject ) {
      Content.findOne({ slug }).exec()
      .then( function ( result ) {
        if ( !result ) return reject( new Error( "No item found when trying to delete." ) )

        result.remove()

        result.save( function () {
          resolve( result )
        })
      })
    })
  }

  deleteItem()
  .then( function ( content ) {
    return res.status( 200 ).json({ data: content })
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}

export function addTags ( req, res ) {
  function addTag () {
    return new Promise((resolve, reject) => {
      const tags = req.body.tags
      const contentId = new mongoose.Types.ObjectId( req.body.id )

      Content.update(
        { 'users._id': contentId },
        { $pushAll: { 'users.$.tags': tags } }
      ).exec()
      .then( function ( result ) {
        resolve( result )
      }, function ( error ) {
        if ( error ) return reject( error )
      })
    })
  }

  getUser( req.token )
  .then( addTag )
  .then( function ( result ) {
    return res.status( 200 ).send( "Added: " + result.tags )
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).send( error.message )
  })
}

export function deleteTag ( req, res ) {
  function removeTag () {
    return new Promise( function ( resolve, reject ) {
      var contentId = new mongoose.Types.ObjectId( req.query.id ),
        tag = JSON.parse( req.query.tag )

      Content.update(
        { 'users._id': contentId },
        { $pull: { 'users.$.tags': tag } } )
      .exec()
      .then( function ( result ) {
        resolve( result )
      }, function () {
        reject( new Error( "Could not remove that tag." ) )
      })
    })
  }

  getUser( req.token )
  .then( removeTag )
  .then( function ( result ) {
    if ( result === 0 ) {
      return res.status( 500 ).send( "Could not remove tag, it wasn't found." )
    }

    return res.status( 200 ).send( "Tag removed." )
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).send( error.message )
  })
}

export function makePrivate ( req, res ) {
  getUser( req.token )
  .then( function ( user ) {
    Content.findOne( { 'users.user': user._id, 'users._id': req.body.id } )
    .then( function ( parent ) {
      parent.users.id( req.body.id ).private = !parent.users.id( req.body.id ).private

      parent.save()
      .then( function ( result ) {
        result.users.id( req.body.id )
        return res.status( 200 ).json( "Post privacy changed." )
      })
    })
    .catch( function ( error ) {
      console.log( error )
      return res.status( 500 ).json( error.message )
    })
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}

export function postFlag ( req, res ) {
  User.findOne( { token: req.token, role: 'admin' } )
  .then(( user ) => {
    if ( !user ) return new Error( { message: "Permissions don't appear to allow that." } )

    Content.findOne( { $or: [ { 'users._id': req.body.id }, { _id: req.body.id } ] } )
    .then(( parent ) => {
      if ( !parent ) return res.status( 500 ).json( "Couldn't find that item" )

      if ( req.body.flag === 'adult' ) {
        parent.flagAdult()
        .then(() => {
          return res.status( 200 ).json( "That post was flagged." )
        }, ( error ) => {
          console.log( error )
          return res.status( 500 ).json( error.message )
        })
      } else if ( req.body.flag === 'hidden' ) {
        parent.flagHidden()
        .then(() => {
          return res.status( 200 ).json( "That post was flagged." )
        }, function ( error ) {
          console.log( error )
          return res.status( 500 ).json( error.message )
        })
      }
    }, function ( error ) {
      console.log( error )
      return res.status( 500 ).json( error.message )
    })
  }, function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}

/* INPUTS: req.body.url, req.body.title, req.body.recipeints (array) and authorization token in header */
export function shareByEmail ( req, res ) {
  var shareHtml = fs.readFileSync( path.join( __dirname, '../lib/emails/share-by-email.html' ) ).toString().split( '<!-- Breakpoint -->' )

  User.findOne( { token: req.token } )
  .then(( user ) => {
    req.body.recipients.forEach(( each, index ) => {
      var email = {
        from: 'Slipstream <welcome@slipstreamapp.com>',
        to: each,
        subject: "Someone you know shared this with you on Slipstream!",
        html: shareHtml[0] + user.username + shareHtml[1] + req.body.title + shareHtml[2] + req.body.url + shareHtml[3]
      }

      mailgun.messages().send( email, (err) => {
        if ( err ) throw new Error( err )
      })

      if ( index === req.body.recipients.length - 1 ) {
        return res.status( 200 ).json( "Sending all emails." )
      }
    })
  })
  .catch(( error ) => {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}
