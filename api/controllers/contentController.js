import Content from '../models/contentModel'
import User from '../models/userModel'
import getUser from '../helpers/get-user'
import saveImage from '../helpers/save-image'
import fs from 'fs'
import path from 'path'
import request from 'request'
import Q from 'q'
import _ from 'underscore'
import mongoose from 'mongoose'
import urlExpand from 'url-expand'

const mailgunApiKey = "key-fe1e0965d13a84409a40129ca218d5e0"
const mailgunDomain = "slipstreamapp.com"
const mailgun = require( 'mailgun-js' )( { apiKey: mailgunApiKey, domain: mailgunDomain })

export const findUserId = ( username ) => {
  return Q.promise((resolve, reject) => {
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

export function addContent ( req, res ) {
  function getContent ( user ) {
    return new Promise( function ( resolve, reject ) {
      /*
      If the article already exists, save the user to it and return the article, minus the `users` sub-document
      */
      urlExpand( req.body.url, function ( error, url ) {
        Content.findOne( { url: url } ).exec()
        .then( function ( result ) {
          if ( result ) {
            const newUser = result.users.create({
              user: user._id,
              added: ( new Date() / 1).toFixed(),
              stream: req.body.type,
              private: true
            })

            result.users.push( newUser )
            result.save()

            return res.status( 200 ).json({
              title: result.title,
              description: result. description,
              images: result.images,
              _id: newUser._id
            })
          } else {
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
          }
        })
      })
    })
  }

  function makeContent( contentInfo ) {
    return new Promise( function ( resolve ) {
      var content = new Content( _.extend({
        url: contentInfo.meta.canonical
      }, contentInfo.meta ))

      getUser( req.token )
      .then( function ( user ) {
        var users = content.users.create({
          user: user._id,
          added: ( new Date() / 1).toFixed(),
          stream: req.body.type,
          private: true
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
          .spread( function( imageHash, imageOriginalPath, imageThumbPath) {
            content.images.push( {
              orig: imageOriginalPath,
              thumb: imageThumbPath,
              hash: imageHash
            })
            saveContent()
          })
        } else { saveContent() }
      })
    })
  }

  getUser( req.token )
  .then( getContent )
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

/*
Allows admins to edit posts.

INPUT: An object containing:

  { id: ( _id or users._id of the content to edit. ),
    changes: { an object with any fields and values that should be changed } }
*/
export function editContent ( req, res ) {
  User.findOne( { token: req.token, role: 'admin' } )
  .then( function ( user ) {
    if ( !user ) throw new Error( "Permissions don't appear to allow that." )

    Content.findOne( { $or: [
      { 'users._id': req.body.id },
      { _id: req.body.id }
    ] } )
    .then( function (parentId) {
      if ( !parentId ) throw new Error( "Couldn't find that article to edit." )

      const parent = _.extend( parentId, req.body.changes )

      parent.save()
      .then( function () {
        console.log( "Admin edit: Post: " + parent._id )
        return res.status( 200 ).json( "The post was saved." )
      }, function ( error ) {
        console.log( error )
        return res.status( 500 ).json( error.message )
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

/*
INPUT: User token at req.token and username of stream being viewed at req.params.username

OUTPUT: The stream of the user being viewed.

Tries to determine if the stream is the logged-in user's stream, and includes or excluded private posts based on that.
*/
export function getStream ( req, res ) {
  var show = parseInt( req.query.show, 10 ),  // the number of items to show per page
    page = req.query.page,  // the current page being asked for
    stream = req.params.stream, // the type of content to get
    skip = ( page > 0 ? (( page - 1 ) * show ) : 0 ) // amount to skip

  function findStream ( user ) {
    return new Promise( function ( resolve ) {
      var userid = new mongoose.Types.ObjectId( user )

      Content.aggregate( [
        { $unwind: '$users' },
        { $match: {
          'users.user': userid,
          'users.stream': stream
        } },
        { $project: {
          _id: '$users._id',
          title: '$title',
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
        } },
        { $sort: { added: -1 } },
        { $skip: skip },
        { $limit: show }
      ] )
      .exec()
      .then( function( results ) {
        resolve( results )
      })
    })
  }

  findUserId( req.params.username )
  .then( function ( user ) {
    User.findOne( { token: req.token } )
    .then( function ( result ) {
      if ( user === result._id ) {
        findStream( user )
        .then( function ( results ) {
          return res.status( 200 ).json( results )
        })
      } else {
        const userid = new mongoose.Types.ObjectId( user )
        Content.aggregate( [
          { $unwind: '$users' },
          { $match: {
            'users.user': userid,
            'users.stream': stream,
            $or: [ { 'users.private': false }, { 'users.private': { $exists: false } } ]
          } },
          { $project: {
            _id: '$users._id',
            title: '$title',
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
            slug: '$slug'
          } },
          { $sort: { added: -1 } },
          { $skip: skip },
          { $limit: show }
        ] ).exec()
        .then( function ( results ) {
          return res.status( 200 ).json( results )
        })
      }
    })
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).send( { error: error.message } )
  })
}

/*
Gets a single post. Used to dynamically get content a user just added to their stream, or get an item's content after it's been updated.
*/
export function getContent ( req, res ) {
  var userToken = req.headers.authorization ? req.headers.authorization.split( ' ' )[1] : 'null'

  findUserId( req.params.username )
  .then( function ( userid ) {
    User.findOne( { token: userToken } )
    .then( function ( result ) {
      var option = req.query.id ? req.query.id : req.query.slug

      if ( !result || result._id !== userid ) {
        projectContent( option )
        .then( function () {
          if ( result.private === true ) return res.status( 500 ).json( "Can't find that content." )

          return res.status( 200 ).json( result )
        })
      } else {
        projectContent( option )
        .then( function () {
          return res.status( 200 ).json( result )
        })
        .catch( function ( error ) {
          console.log( error )
          return res.status( 500 ).json( error.message )
        })
      }
    })
    .catch( function ( error ) {
      console.log( error )
      return res.status( 200 ).json( error.message )
    })
  })
  .catch( function ( error ) {
    console.log( error )
    return res.status( 500 ).json( error.message )
  })
}

export function deleteContent ( req, res ) {
  /*
  Deletes an item from any "content" stream.

  Accepts: User ID, but requires content id in scope at req.query.bind

  Returns: Promise which resolves to the deleted item.
  */
  function deleteItem () {
    return new Promise( function ( resolve, reject ) {
      if ( !req.query.id ) {
        reject( new Error( "There doesn't seem to be an id given." ) )
      }

      const contentId = new mongoose.Types.ObjectId( req.query.id )

      Content.findOne( { 'users._id': req.query.id } ).exec()
      .then( function ( result ) {
        if ( !result ) return reject( new Error( "No item found when trying to dleete." ) )

        result.users.id( contentId ).remove()

        result.save( function () {
          resolve( result )
        })
      })
    })
  }

  getUser( req.token )
  .then( deleteItem )
  .then( function ( content ) {
    return res.status( 200 ).json( "Item temoved: " + content.title )
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
