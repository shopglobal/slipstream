var fs = require( 'fs' ),
	crypto = require( 'crypto' ),
	path = require( 'path' ),
	easyimg = require( 'easyimage' ),
	request = require( 'request' ),
	async = require( 'async' ),
	Q = require( 'q' )

// this module does it all. it creates an MD5 hash for a name, 
// saves it to disk, creates and saves a thumbnail, etc
// USAGE: saveImage( TYPE[STRING], IMAGE-URL[STIRNG] )
// returns promise with array of [ HASH, ORIGINALPATH, THUMBNAILPATH ]


module.exports = function ( type, imageUrl ) {
	
	var deferred = Q.defer()
	
	var imageExtension = path.extname( imageUrl )

	function hashImage ( image ) {
		var deferred = Q.defer()
		
		var imageHash = crypto.createHash( 'md5' ).update( image ).digest( 'hex' )
		var returnArray = [ imageHash, image ]
		
		deferred.resolve( returnArray )
		
		return deferred.promise
	}
	
	function getImage ( imageUrl ) {
		var deferred = Q.defer()
		
		request.get( { url: imageUrl, encoding: 'binary'}, function ( err, response, body ) {
			if ( err ) 
				console.log( err )
			
			deferred.resolve( body )
		})
					
		return deferred.promise
	}
	
	function makeFilePaths ( imageHash, imageBuffer ) {
		var deferred = Q.defer()
		
		var imageRootDir = path.join( __dirname, "../public/images/" + type + "/" ) // path to photo dir, with trailing slash
		var imageFileOriginal = imageHash + "-orig" + imageExtension
		var imageFileThumb = imageHash + "-thumb" + imageExtension
		var returnArray = [ imageRootDir, imageFileOriginal, imageFileThumb, imageBuffer, imageHash ]
		deferred.resolve( returnArray )
		
		return deferred.promise
	}
	
	function writeImage ( imageRootDir, imageFileOriginal, imageFileThumb, imageBuffer, imageHash ) {
		var deferred = Q.defer()
		
		fs.writeFile( imageRootDir + imageFileOriginal, imageBuffer, 'binary', function ( err ) {
			var paths = [ imageRootDir, imageFileOriginal, imageFileThumb, imageHash ]
			deferred.resolve( paths )
		})
		
		return deferred.promise
	}
	
	function writeThumbnail ( imageRootDir, imageFileOriginal, imageFileThumb, imageHash ) {
		var deferred = Q.defer()

		easyimg.rescrop({
			src: imageRootDir + imageFileOriginal,
			dst: imageRootDir + imageFileThumb,
			width: 250, height: 140,
			cropwidth: 250, cropheight: 140,
			x: 0, y: 0,
			fill: true			
		}).then( function ( file ) {
			var originalFinalPath = "images/" + type + "/" + imageFileOriginal
			var thumbFinalPath = "images/" + type + "/" + imageFileThumb
			var paths = [ imageHash, originalFinalPath, thumbFinalPath ]

			deferred.resolve( paths )	
		})		
		
		return deferred.promise
	}
	
	getImage( imageUrl )
	.then( hashImage )
	.spread( makeFilePaths )
	.spread( writeImage )
	.spread( writeThumbnail )
	.spread( function( imageHash, originalFinalPath, thumbFinalPath ) {
		var returnArray = [ imageHash, originalFinalPath, thumbFinalPath ]
		deferred.resolve( returnArray )
	})
	
	return deferred.promise	
}