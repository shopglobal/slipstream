var fs = require( 'fs' ),
	crypto = require( 'crypto' ),
	path = require( 'path' ),
	easyimg = require( 'easyimage' ),
	request = require( 'request' ),
	async = require( 'async' )

// this module does it all. it creates an MD5 has for a name, 
// saves it to disk, creates and saves a thumbnail, etc


module.exports = function ( data, callback ) {
	
	// makes sure there's an image in the result, then begin the process
	// or just set the image to null in the DB

	if ( data.image ) {
		var imageExtension = path.extname( data.image )

		request.get( { url: data.image, encoding: 'binary'}, function ( err, response, body ) {

			async.series([
				
				// encryption
				
				function ( callback ) {
					imageHash = crypto.createHash( 'md5' ).update( body ).digest( 'hex' )
					callback ( null, imageHash )
				},
				
				// make the image file paths
				
				function ( callback ) {
					imageRootDir = path.join( __dirname, "../public/images/blogs/") // path to photo dir, with trailing slash
					imageFileOriginal = imageHash + "-orig" + imageExtension
					console.log( imageFileThumb = imageHash + "-thumb" + imageExtension )
					callback ( null, imageFileOriginal )
				},
				
				// write the file
				
				function ( callback ) {
					fs.writeFile( imageRootDir + imageFileOriginal, body, 'binary', function ( err ) {
						if ( err )
							return console.log( "error saving image: " + err )
						callback ( null, null )
					})
				},
				
				// save the thumbnail
				
				function ( callback ) {
					easyimg.thumbnail({
						src: imageRootDir + imageFileOriginal,
						dst: imageRootDir + imageFileThumb,
						width: 250
					}).then (
					function ( image ) {
						callback( null, image)
					},
					function ( err ) {
						console.log( err )
					})
					
				}],
					
				//the callback
					
				function ( err, results ) {
					callback ( imageHash, "images/blogs/" + imageFileOriginal, "images/blogs/" + imageFileThumb )
				}
			)
		})
		} else {
			var imageFileOriginal = null, 
				imageHash = null
			
			console.log( "There was no image file returned" )
		}
}