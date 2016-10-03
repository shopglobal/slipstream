import Content from '../models/contentModel.js'
import Q from 'q'
import _ from 'underscore'
import saveImage from '../helpers/save-image'
import ImageResolver from 'image-resolver'
import htmlStripper from 'htmlstrip-native'
import needle from 'needle'
import readability from 'node-readability'
import urlExpand from 'url-expand'

import replaceImages from '../helpers/article-helpers'

var imageResolver = new ImageResolver()

imageResolver.register(new ImageResolver.FileExtension())
imageResolver.register(new ImageResolver.MimeType())
imageResolver.register(new ImageResolver.Opengraph())
imageResolver.register(new ImageResolver.Webpage())

// adds and item to the articles database with the user's id.

export default function add ( req, res ) {
  function getArticle () {
    return new Promise( function ( resolve, reject ) {
      /*
      If the article already exists, save the user to it and return the article, minus the `users` sub-document
      */      
      urlExpand( req.body.url, function( error, url ) {
        var newArticle = new Content({
          images: [],
          processing: true,
          url: req.body.url,
          private: true,
          user: req.user._id
        })

        needle.get( req.body.url, {
          compressed: true,
          follow_max: 3
        }, function( error, response ) {
          if ( error ) return reject( error )

          readability( response.body, function ( error, article, meta ) {
            if ( error ) {
              article.close()

              return reject( new Error( { error: error, message: "We couldn't get that page right now." } ) )
            }

            var description = htmlStripper.html_strip( article.content, {
              include_script : false,
              include_style : false,
              compact_whitespace : true } ).substring( 0, 400 )

            var a = _.extend( newArticle, {
              title: article.title,
              description: description,
              content: article.content
            } )

            var b = new Content( newArticle )

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
              .spread( function ( hash, orig, thumb ) {
                newArticle.images.push({
                  orig: orig,
                  hash: hash,
                  thumb: thumb
                })
                
                article.close()

                resolve( newArticle )
              })
              .catch( function ( error ) {
                console.log( error )
                reject( error )
              })
            })
          })
        })
      })
    })
  }
  
  function saveArticle ( article ) {
    return Q.Promise( function ( resolve, reject, notify ) {
      
      var blog = {
        processing: false,
        images: article.images,
        text: article.content
      }

      article.update( { $set: blog } ).exec()
      .then( function ( blog ) {
        
        resolve( blog ) 
      }, function ( error ) {
        reject( new Error( error ) )
      })
    })
  }
  
  getArticle()
  .then(( article ) => {
    // var users = article.users.create({
    //   user: user._id,
    //   added: ( new Date() / 1).toFixed(),
    //   stream: 'read',
    //   private: true
    // })

    if( article.alreadySaved ) {  
      return res.status( 200 ).json( {
        title: article.title,
        url: article.url,
        _id: users._id,
        description: article.description,
        images: article.images
      })
    } else {
      article.save( function ( err, article ) {
        res.status( 200 ).json( {
          title: article.title,
          url: article.url,
          _id: users._id,
          description: article.description,
          images: article.images
        })
        replaceImages( article )
        .then( saveArticle )
        .then( function ( article ) {

          index.partialUpdateObject({
            objectID: users._id,
            images: article.images,
            text: article.text
          }, function ( error, content ) {
            if ( error ) console.log( error )
          })

          console.info( { title: article.title, url: article.url }, "Article saved" )
          return
        })
        .catch( function ( error ) {
          console.log( error )
        })
      })
    }
  })
  .catch( function ( error ) {
    console.error( error )
    return res.status( 500 ).json( error.message )
  })
}
