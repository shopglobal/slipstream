var fs = require( 'fs' ),
	crypto = require( 'crypto' ),
	path = require( 'path' ),
	request = require( 'request' ),
	Q = require( 'q' ),
	s3 = require( 's3' ),
	knox = require( 'knox' ),
	mime = require( 'mime' ),
	http = require( 'http' ),
	https = require( 'https' ),
	gm = require( 'gm' )

var s3Client = knox.createClient( {
	key: process.env.PLANTER_S3_ACCESS_KEY_ID,
	secret: process.env.PLANTER_S3_SECRET_ACCESS_KEY,
	bucket: process.env.PLANTER_BUCKET_NAME
} )

 /* 
 this module does it all. it creates an MD5 hash for an image, 
 saves it to disk, creates and saves a thumbnail, etc
 
 Usage: saveImage( TYPE[STRING], IMAGE-URL[STIRNG] )
 
 Returns: promise with array of [ HASH, ORIGINALPATH, THUMBNAILPATH ]
 
 TODO: return a promise with an object of image.hash, image.originalPath, image.thumbnailPath
 */

module.exports = function ( type, imageUrl ) {
	
	return Q.Promise( function ( resolve, reject, notify ) {
	
		
	function saveOrig ( imageUrl ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var image = {}
			
			gm( request( imageUrl ) )
				.format( function( err, value ) {
					if ( err ) return reject ( new Error ( err ) )

					image.extension = mime.extension( mime.lookup( value ) )
					image.type = value
				})
				.stream( image.type, function ( err, stdout, stderr ) {
					if ( err ) return reject( new Error( err ) )

					var bufs = []

					stdout.on( 'data', function ( d ) {
						bufs.push( d )
					})

					stdout.on( 'end', function () {
						var buf = Buffer.concat( bufs )

						image.hash = crypto.createHash( 'md5' ).update( buf ).digest( 'hex' )
						
						console.error( image )

						var uploader = s3Client.putBuffer( buf, type + "/" + image.hash + "-orig." + image.extension, {
							'Content-Length': buf.length,
							'Content-Type': image.type
						}, function ( err, result ) {
							if ( err ) return reject( new Error( err ) )

							if ( result.statusCode == 200 ) {
								image.orig = uploader.url

								resolve( image )
							}
						})
					})
				})
		})
	}
		
	function saveThumb ( image ) {
		return Q.promise( function ( resolve, reject, notify ) {
								
			gm( request( image.orig ) )
				.resize( 400 )
				.crop( 400, 224 )
				.stream( image.type, function ( err, stdout, stderr ) {
					if ( err ) return reject( new Error( err ) )

					var bufs = []

					stdout.on( 'data', function ( d ) {
						bufs.push( d )
					})

					stdout.on( 'end', function () {
						var buf = Buffer.concat( bufs )

						var uploader = s3Client.putBuffer( buf, type + "/" + image.hash + "-thumb." + image.extension, {
							'Content-Length': buf.length,
							'Content-Type': image.type
						}, function ( err, result ) {
							if ( err ) return reject( new Error( err ) )

							if ( result.statusCode == 200 ) {
								image.thumb = uploader.url

								resolve( image )
							}
						})					
					})
				})
		})
	}
	
	saveOrig( imageUrl )
	.then( saveThumb )
	.then( function( image ) {
		var returnArray = [ image.hash, image.orig, image.thumb ]
		resolve( returnArray )
	})
	.catch( function( error ) {
		reject( new Error( error.message ) )
	})
	
	})
}