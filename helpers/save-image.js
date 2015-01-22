var fs = require( 'fs' ),
	crypto = require( 'crypto' ),
	path = require( 'path' ),
	thumb = require( 'node-thumbnail' ),
	request = require( 'request' ),
	async = require( 'async' )


module.exports = function ( data, callback ) {
	if ( data.image ) {
		var imageExtension = path.extname( data.image )

		request.get( { url: data.image, encoding: 'binary'}, function ( err, response, body ) {

			async.series([
				function ( callback ) {
					imageHash = crypto.createHash( 'md5' ).update( body ).digest( 'hex' )
					callback ( null, imageHash )
				},
				function ( callback ) {
					imageFileOriginal = imageHash + "-orig" + imageExtension
					imageFileThumb = imageHash + "-thumb" + imageExtension
					callback ( null, imageFileOriginal )
				},
				function ( callback ) {
					fs.writeFile( path.join(__dirname, "../public/images/blogs/") + imageFileOriginal, body, 'binary', function ( err ) {
						if ( err )
							return console.log( "error saving image: " + err )
						callback ( null, null )
					})
				}], function ( err, results ) {
					callback ( imageHash, "images/blogs/" + imageFileOriginal )
				}
			)
		})
		} else {
			var imageFileOriginal = null, 
				imageHash = null
		}
}