var Content = require( '../models/contentModel' ),
	User = require( '../models/userModel' ),
	getUser = require( '../helpers/get-user' ),
	saveImage = require( '../helpers/save-image' ),
	request = require( 'request' ),
	Q = require( 'q' ),
	_ = require( 'underscore' )

// adds content to users stream.

exports.add = function ( req, res ) {
	
	function getContent () {
		var deferred = Q.defer()
		
		request( "http://localhost:8061/iframely?url=" + req.body.url,
				function ( err, response, body ) {
			deferred.resolve( JSON.parse( body ) )
		})
				
		return deferred.promise
	}
	
	function makeContent( user, contentInfo ) {
		var deferred = Q.defer()
		
		var content = new Content( _.extend({
			user: user,
			stream: req.body.type,
			added: ( new Date() / 1).toFixed(),
			url: req.body.url
		}, contentInfo.meta ))
		
		if ( contentInfo.links[2].href ) {
			saveImage( req.body.type, contentInfo.links[2].href )
			.spread( function( imageHash, imageOriginalPath, imageThumbPath) {
				content.image = imageOriginalPath
				content.imageThumb = imageThumbPath
				content.imageHash = imageHash
				
				deferred.resolve( content )
			})
		}
		else {
			deferred.resolve( content )
		}
		
		content.save()
		
		return deferred.promise
	}
	
	Q.all( [ getUser( req.token ), getContent() ] )
	.spread( function ( user, contentInfo ) {
		makeContent( user, contentInfo )
		.then( function ( content ) {
			return res.json( content )	
		})
	})
}

exports.stream = function ( req, res, stream ) {

	var show = req.query.show,	// the number of items to show per page
		page = req.query.page,	// the current page being asked for
		stream = req.params.stream	// the type of content to get
	
	function getStream ( user ) {
		var deferred = Q.defer()
		
		Content.find( { $and: [
			{ user: user },
			{ stream: stream }
		] } ).sort( { added: -1 } )
		.skip( page > 0 ? (( page - 1 ) * show ) : 0 ).limit( show )
		.exec()
		.then( function( results ) {
			deferred.resolve( results )
		})
		
		return deferred.promise		
	}
	
	getUser( req.token )
	.then( getStream )
	.then( function ( results ) {
		return res.json( results )
	})	
}
	
	