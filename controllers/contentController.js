var Content = require( '../models/contentModel' ),
	User = require( '../models/userModel' ),
	getUser = require( '../helpers/get-user' ),
	saveImage = require( '../helpers/save-image' ),
	request = require( 'request' ),
	Q = require( 'q' ),
	_ = require( 'underscore' ),
	log = require( '../helpers/logger.js' ),
	mongoose = require( 'mongoose-q' )( require( 'mongoose' ) )

// adds content to users stream.

exports.add = function ( req, res ) {
	
	function getContent () {
		return Q.Promise( function ( resolve, reject, notify ) {
		
		request( {
			strictSSL: false,
			url: "https://localhost:8061/iframely?url=" + req.body.url
			}, function ( err, response, body ) {
			if ( err || response.statusCode !== 200 )
				reject( new Error( "Error from embed server: " + body + " -> " + req.body.url ) )
				
			if ( !body )
				reject( new Error( "Error from embed server. No body returned." ) )
			
			resolve( JSON.parse( body ) )
		})
				
		})
	}
	
	function makeContent( user, contentInfo ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
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
				
				content.save()
				resolve( content )
			})
		} else {
			content.save()
			resolve( content )
		}
		
		})
	}
	
	Q.all( [ getUser( req.token ), getContent() ] )
	.spread( function ( user, contentInfo ) {
		makeContent( user, contentInfo )
		.then( function ( content ) {
			return res.json( content )	
		}).catch( function ( error ) {
			log.error( error )
			return res.status(500).send( error.message )
		})
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status(500).send( { error: error.message } )
	})
}

exports.stream = function ( req, res ) {

	var show = req.query.show,	// the number of items to show per page
		page = req.query.page,	// the current page being asked for
		stream = req.params.stream	// the type of content to get
	
	function getStream ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
			Content.find( { $and: [
				{ user: user },
				{ stream: stream }
			] } ).sort( { added: -1 } )
			.skip( page > 0 ? (( page - 1 ) * show ) : 0 ).limit( show )
			.exec()
			.then( function( results ) {
				resolve( results )
			})
			
		})
	}
	
	getUser( req.token )
	.then( getStream )
	.then( function ( results ) {
		return res.json( results )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).send( { error: error.message } )
	})
}
	
exports.delete = function ( req, res ) {
	
	/*
	Deletes an item from any "content" stream. 
	
	Accepts: User ID, but requires content id in scope at req.query.bind
	
	Returns: Promise which resolves to the deleted item.
	*/
	function deleteItem ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			if ( !req.query.id )
				reject( new Error( "There doesn't seem to be an id given." ) )
			
			var contentId = mongoose.Types.ObjectId( req.query.id )

			Content.findOneAndRemove( { user: user, _id: contentId } ).exec()
			.then( function ( content ) {
				resolve( content )
			}, function ( error ) {
				reject( new Error( "There was an error deleting that content from the stream." ) )
			})
		})
	}
	
	getUser( req.token )
	.then( deleteItem )
	.then( function ( content ) {
		return res.json( content )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).send( { Error: error.message } )
	})
	
}