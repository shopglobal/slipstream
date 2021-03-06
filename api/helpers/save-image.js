import crypto from 'crypto'
import superagent from 'superagent'
import aws from 'aws-sdk'
import mime from 'mime'
import gm from 'gm'

var s3Client = new aws.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION
})

const makeFullUrl = (key) => (
  `https://s3.${process.env.S3_REGION}.amazonaws.com/${process.env.S3_BUCKET_NAME}/${key}`
)

const checkImageSize = (data) => new Promise((resolve) => {
  gm(data).size((err, value) => {
    if (value.height < 10 || value.width < 10 || err) {
      return resolve(false)
    }

    return resolve(true)
  })
})

const saveOrig = (imageUrl ) => new Promise(async function (resolve, reject) {
  let url = imageUrl
  var imgType = mime.lookup( imageUrl )

  var image = {
    type: imgType,
    extension: mime.extension( imgType )
  }

  if ( imageUrl.indexOf( "/" ) === 0 ) {
    url = "https:" + imageUrl
  }

  try {
    const imageData = await superagent.get(url)
    const isRightSize = await checkImageSize(imageData.body)

    if (!isRightSize) {
      throw new Error("Image too small.")
    }

    gm(imageData.body)
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

          const key = image.hash + "-orig." + image.extension

          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: buf,
            // ContentLength: buf.length,
            ContentType: mime.lookup( image.extension )
          }

          s3Client.putObject(params, (e) => {
            if ( err ) return reject( new Error( e ) )

            buf = null
            bufs = []
            image.orig = makeFullUrl(key)

            return resolve( image )
          })
        })
      })
  } catch (error) {
    console.log('Error getting image', error.status || error)
    return resolve({
      ...image,
      orig: makeFullUrl(process.env.PLACEHOLDER_FILENAME),
    })
  }
})

/* Saves a thumbnail

TODO: Limit animated GIFS and request full image from external http again
*/
async function saveThumb ( image ) {
  const imageData = await superagent.get( image.orig )
  return new Promise(( resolve, reject ) => {
    gm(imageData.body)
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
          const key = image.hash + "-thumb.JPEG"
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: buf,
            // ContentLength: buf.length,
            ContentType: 'image/jpeg'
          }

          s3Client.putObject(params, ( e ) => {
            if ( e ) return reject( new Error( e ) )

            image.thumb = makeFullUrl(key)
            return resolve(image)
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
