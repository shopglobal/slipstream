import crypto from 'crypto'
import request from 'request'
import Q from 'q'
import knox from 'knox'
import mime from 'mime'
import gm from 'gm'

var s3Client = knox.createClient({
  key: process.env.PLANTER_S3_ACCESS_KEY_ID,
  secret: process.env.PLANTER_S3_SECRET_ACCESS_KEY,
  bucket: process.env.PLANTER_BUCKET_NAME
})

function saveOrig ( imageUrl ) {
  return new Promise( function ( resolve, reject ) {
    let url = imageUrl
    var imgType = mime.lookup( imageUrl )

    var image = {
      type: imgType,
      extension: mime.extension( imgType )
    }

    if ( imageUrl.indexOf( "/" ) === 0 ) {
      url = "https:" + imageUrl
    }

    gm( request(url) )
      .resize( '1340>' )
      .format(( err, value ) => {
        if ( err ) return reject( new Error( "Could not determine format for image" ) )

        image.extension = value
        image.type = mime.lookup( image.extension )
      })
      .stream( ( err, stdout ) => {
        var bufs = []

        if ( err ) return reject( new Error( err ) )

        stdout.on( 'data', ( d ) => {
          bufs.push( d )
        })

        stdout.on( 'end', () => {
          let buf = Buffer.concat(bufs)

          image.hash = crypto.createHash( 'md5' ).update( buf ).digest( 'hex' )

          const uploader = s3Client.putBuffer( buf, image.hash + "-orig." + image.extension, {
            'Content-Length': buf.length,
            'Content-Type': mime.lookup( image.extension )
          }, ( e, result ) => {
            if ( err ) return reject( new Error( e ) )

            buf = null
            bufs = []

            if ( result.statusCode === 200 ) {
              image.orig = uploader.url

              resolve( image )
            } if ( result.statusCode !== 200 ) {
              reject(result)
            }
          })
        })
      })
  })
}

/* Saves a thumbnail

TODO: Limit animated GIFS and request full image from external http again
*/
function saveThumb ( image ) {
  return Q.promise(( resolve, reject ) => {
    gm( request( image.orig ) )
      .setFormat("jpg")
      .rawSize( 400, 224 )
      .gravity( 'Center' )
      .resize( 400, '224^' )
      .extent( 400, 224 )
      .noProfile()
      .stream(( err, stdout ) => {
        if ( err ) return reject( new Error( err ) )

        const bufs = []

        stdout.on( 'data', function ( d ) {
          bufs.push( d )
        })

        stdout.on( 'end', function () {
          var buf = Buffer.concat( bufs )

          var uploader = s3Client.putBuffer( buf, image.hash + "-thumb.JPEG", {
            'Content-Length': buf.length,
            'Content-Type': 'image/jpeg'
          }, ( e, result ) => {
            if ( e ) return reject( new Error( e ) )

            if ( result.statusCode === 200 ) {
              image.thumb = uploader.url

              resolve( image )
            } else if ( !result.statusCode === 200 ) {
              reject( new Error( result ) )
            }
          })
        })
      })
  })
}

 /*
 this module does it all. it creates an MD5 hash for an image, saves it to disk, creates and saves a thumbnail, etc

 Usage: saveImage( TYPE[STRING], IMAGE-URL[STIRNG] )

 Returns: promise with array of [ HASH, ORIGINALPATH, THUMBNAILPATH ]

 TODO: return a promise with an object of image.hash, image.originalPath, image.thumbnailPath
 */
export default function saveImage ( imageUrl ) {
  return new Promise((resolve, reject) => {
    saveOrig( imageUrl )
    .then( saveThumb )
    .then(( image ) => {
      resolve({
        hash: image.hash,
        orig: image.orig,
        thumb: image.thumb
      })
    })
    .catch(( error ) => {
      reject(error)
    })
  })
}
