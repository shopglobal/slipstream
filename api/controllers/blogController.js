import Content from '../models/contentModel.js'
import saveImage from '../helpers/save-image'
import ImageResolver from 'image-resolver'
import htmlStripper from 'htmlstrip-native'
import needle from 'needle'
import readability from 'node-readability'

import replaceImages from '../helpers/article-helpers'

var imageResolver = new ImageResolver()

imageResolver.register(new ImageResolver.Opengraph())
imageResolver.register(new ImageResolver.FileExtension())
imageResolver.register(new ImageResolver.MimeType())
imageResolver.register(new ImageResolver.Webpage())

// adds and item to the articles database with the user's id.

export async function postArticle ( req, res ) {
  const {stream} = req.params

  function getArticle () {
    return new Promise( function ( resolve, reject ) {
      var newArticle = new Content({
        images: [],
        format: 'read',
        processing: true,
        url: req.body.url,
        user: req.user._id,
        stream
      })

      needle.get( req.body.url, {
        compressed: true,
        follow_max: 3
      }, function( err, response ) {
        if ( err ) return reject( err )

        readability( response.body, function ( e, article ) {
          if ( e ) {
            if (article) {
              article.close()
            }

            return reject(new Error({ error: e, message: "We couldn't get that page right now." }))
          }

          const description = htmlStripper.html_strip( article.content, {
            include_script: false,
            include_style: false,
            compact_whitespace: true
          }).substring(0, 400)

          newArticle.title = article.title
          newArticle.description = description
          newArticle.content = article.content

          imageResolver.resolve( req.body.url, function ( result ) {
            if ( !result ) {
              newArticle.images.push({
                orig: null,
                hash: null,
                thumb: null
              })

              return resolve( newArticle )
            }

            saveImage(result.image)
            .then( function ({ hash, orig, thumb }) {
              newArticle.images.push({
                orig: orig,
                hash: hash,
                thumb: thumb
              })

              article.close()

              resolve( newArticle )
            })
            .catch( function ( error ) {
              console.log('Error saving image.', error)
              reject( error )
            })
          })
        })
      })
    })
  }

  function saveArticle ( article ) {
    return new Promise( function ( resolve, reject ) {
      const blog = {
        processing: false,
        images: article.images,
        text: article.content
      }

      article.update( { $set: blog } ).exec()
      .then( function ( piece ) {
        resolve( piece )
      }, function ( error ) {
        reject( new Error( error ) )
      })
    })
  }

  const article = await getArticle()

  article.user = req.user._id
  article.save( ( err, data ) => {
    res.status( 200 ).json({ data })
    replaceImages( data )
    .then( saveArticle )
    .then(() => {
      console.info('READ_CONTENT_SAVED', data.slug)
    })
  })
  .catch( function ( error ) {
    console.error('Error getting article.')
    return res.status( 500 ).json( error.message )
  })
}
