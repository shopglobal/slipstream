var fs = require( 'fs' ),
	crypto = require( 'crypto' ),
	path = require( 'path' ),
	easyimg = require( 'easyimage' ),
	request = require( 'request' ),
	Q = require( 'q' ),
	s3 = require( 's3' )

s3Client = s3.createClient( {
	s3Options: {
		accessKeyId: process.env.PLANTER_S3_ACCESS_KEY_ID,
		secretAccessKey: process.env.PLANTER_S3_SECRET_ACCESS_KEY
	}
})

 /* 
 this module does it all. it creates an MD5 hash for an image, 
 saves it to disk, creates and saves a thumbnail, etc
 
 Usage: saveImage( TYPE[STRING], IMAGE-URL[STIRNG] )
 
 Returns: promise with array of [ HASH, ORIGINALPATH, THUMBNAILPATH ]
 
 TODO: return a promise with an object of image.hash, image.originalPath, image.thumbnailPath
 */

module.exports = function ( type, imageUrl ) {
	
	return Q.Promise( function ( resolve, reject, notify ) {
	
	var imageExtension = path.extname( imageUrl )
	
	var image = {
		extension: path.extname( imageUrl )
	}
	
	function getImage ( imageUrl ) {
		return Q.promise( function ( resolve, reject, notify ) {
		
			if ( imageUrl.indexOf( "/") == 0 ) {
				imageUrl = "https:" + imageUrl
			}

			request.get( { url: imageUrl, encoding: 'binary'}, function ( err, response, body ) {
				if ( err ) 
					reject( new Error( err ) )
					
				image.buffer = body

				resolve( image )
			})
		})
	}

	function hashImage ( image ) {
		return Q.promise( function ( resolve, reject, notify ) {
			
			image.hash = crypto.createHash( 'md5' ).update( image.buffer ).digest( 'hex' )
			
			resolve( image )
		})
	}
	
	function makeFilePaths ( image ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
			image.rootDir = path.join( __dirname, "../public/images/" ) // path to photo dir, with trailing slash
			image.originalPath = type + "/" + image.hash + "-orig" + image.extension
			image.thumbPath = type + "/" + image.hash + "-thumb" + image.extension
//			image.returnArray = [ imageRootDir, imageFileOriginal, imageFileThumb, imageBuffer, imageHash ]
			resolve( image )

		})
	}
	
	function writeImage ( image ) {
		return Q.promise( function( resolve, reject, notify ) {
			
			fs.writeFile( image.rootDir + image.originalPath, image.buffer, 'binary', function ( err ) {
				if ( err )
					reject( new Error( err.message) )

				uploader = s3Client.uploadFile({
					localFile: image.rootDir + image.originalPath,
					s3Params: {
						Bucket: process.env.PLANTER_BUCKET_NAME,
						Key: image.originalPath
					}
				})

				uploader.on( 'end', function ( data ) {
					image.awsOriginal = s3.getPublicUrl( process.env.PLANTER_BUCKET_NAME, image.originalPath)

					resolve( image )
				})

			})
		
		})
	}
	
	function writeThumbnail ( image ) {
		return Q.Promise( function ( resolve, reject, notify ) {

			easyimg.rescrop({
				src: image.rootDir + image.originalPath,
				dst: image.rootDir + image.thumbPath,
				width: 250, height: 140,
				cropwidth: 250, cropheight: 140,
				x: 0, y: 0,
				fill: true			
			}).then( function ( file ) {
				uploader = s3Client.uploadFile({
					localFile: image.rootDir + image.thumbPath,
					s3Params: {
						Bucket: process.env.PLANTER_BUCKET_NAME,
						Key: image.thumbPath
					}
				})

				uploader.on( 'end', function ( data ) {
					image.awsThumb = s3.getPublicUrl( process.env.PLANTER_BUCKET_NAME, image.thumbPath)

					resolve( image )
				})
			})
		})
	}
	
	getImage( imageUrl )
	.then( hashImage )
	.then( makeFilePaths )
	.then( writeImage )
	.then( writeThumbnail )
	.then( function( image ) {
		var returnArray = [ image.hash, image.awsOriginal, image.awsThumb ]
		resolve( returnArray )
	})
	.catch( function( error ) {
		reject( new Error( error.message ) )
	})
	
	})
}