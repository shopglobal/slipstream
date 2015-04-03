var Content = require( '../models/contentModel' ),
	User = require( '../models/userModel' ),
	getUser = require( '../helpers/get-user' ),
	saveImage = require( '../helpers/save-image' ),
	request = require( 'request' ),
	Q = require( 'q' ),
	_ = require( 'underscore' ),
	log = require( '../helpers/logger.js' ),
	bodyParser = require( 'body-parser' ),
	mongoose = require( 'mongoose-q' )( require( 'mongoose' ) ),
	Algolia = require( 'algolia-search' ),
	algolia = new Algolia( process.env.ALGOLIASEARCH_APPLICATION_ID, process.env.ALGOLIASEARCH_API_KEY ),
	index = algolia.initIndex('Contents')

// adds content to users stream.

exports.add = function ( req, res ) {
	
	function getContent ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
					
		/*
		If the article already exists, save the user to it and return the article, minus the `users` sub-document
		*/
		Content.findOne( { url: req.body.url } ).exec()
		.then( function ( result ) {
			if ( result ) {
				console.log( "Article already exists: " + result.title )
				var users = result.users.push({
					user: user._id,
					added: ( new Date() / 1).toFixed(),
					stream: req.body.type
				})
				result.save()
				return res.status( 200 ).json({
					title: result.title,
					description: result. description,
					images: result.images
				})
			} else {
				request( {
					url: process.env.IFRAMELY_URL + "/iframely?url=" + req.body.url
					}, function ( err, response, body ) {
					if ( err || response.statusCode !== 200 )
						reject( new Error( "Error from embed server: " + body + " --> " + req.body.url ) )

					if ( !body )
						reject( new Error( "Error from embed server. No body returned." ) )

					resolve( JSON.parse( body ) )
				})
			}
		})
				
		})
	}
	
	function makeContent( contentInfo ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
			var content = new Content( _.extend({
				url: req.body.url
			}, contentInfo.meta ))
			
			getUser( req.token )
			.then( function ( user ) {
				var users = content.users.push({
					user: user._id,
					added: ( new Date() / 1).toFixed(),
					stream: req.body.type
				})
			})

			if ( contentInfo.links[2].href ) {
				saveImage( req.body.type, contentInfo.links[2].href )
				.spread( function( imageHash, imageOriginalPath, imageThumbPath) {
					content.images.push( {
						orig: imageOriginalPath,
						thumb: imageThumbPath,
						hash: imageHash		
					})
					saveContent()
				})
			} else { saveContent() }
			
			function saveContent () {
				content.save( function ( err, result ) {
					resolve( result )
				})
			}
		
		})
	}
	
	getUser( req.token )
	.then( getContent )
	.then( makeContent )
	.then( function ( content ) {
		return res.json( content )	
	}).catch( function ( error ) {
		log.error( error )
		return res.status(500).send( error.message )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status(500).send( { error: error.message } )
	})
}

exports.stream = function ( req, res ) {

	var show = req.query.show,	// the number of items to show per page
		page = req.query.page,	// the current page being asked for
		stream = req.params.stream,	// the type of content to get
		skip = ( page > 0 ? (( page - 1 ) * show ) : 0 ) // amount to skip
	
	function getStream ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
//			Content.find( { users: { $elemMatch: {
//				'user': user._id,
//				'stream': stream
//			} } } )
			
			console.log( show )
				
			Content.aggregate( [
				{ $unwind: '$users' },
				{ $match: { 
					'users.user': user.id, 
					'users.stream': stream
				} },
				{ $project: { 
					_id: '$users._id',
					title: '$title', 
					url: '$url', 
					images: '$images',
					description: '$description',
					added: '$users.added',
					user: '$users.user',
					stream: '$users.stream',
					text: '$text',
					processing: '$processing',
				} },
				{ $sort: { added: -1 } },
				{ $skip: skip },
				{ $limit: 3 }
			] )
//			.skip( page > 0 ? (( page - 1 ) * show ) : 0 ).limit( show )
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
			
			Content.findOne( { 'users._id': req.query.id } ).exec()
			.then( function ( result ) {
				console.log( result )
				
				var remove = result.users.id( contentId ).remove()
				
				result.save()
				
				resolve( result )
			})
		})
	}
	
	getUser( req.token )
	.then( deleteItem )
	.then( function ( content ) {
		return res.status( 200 ).json( "Item temoved: " + content.title )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).json( error.message )
	})
	
}

exports.addTags = function ( req, res ) {

	function addTag ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var tags = req.body.tags,
				contentId = mongoose.Types.ObjectId( req.body.id )
			
			Content.findOne( 
				{ 'users.user': user.id, 'users._id': contentId }
			).exec()
			.then( function ( result ) {
				
				var result_tags = result.users.update(
					{ 'users.user': user.id, 'users._id': contentId },
					{ $push: { '$users.tags': { $each: [ 'hi', 'what-up' ] } } } )
				
				result.save( function ( error, data ) {
					if ( error ) return reject( error )
					
					resolve( "Tag added to: " + result.title )
				})
			}, function ( error ) {
				if ( error ) return reject( error )
			})
//				tags.forEach( function ( each ) {
//					index.partialUpdateObject( { '_tags': { 'value': each.text, '_operation': 'AddUnique' }, 'objectID': result._id } )
//				})
				
		})
	}
	
	getUser( req.token )
	.then( addTag )
	.then( function ( result ) {
		return res.status( 200 ).send( "Added: " + result.tags )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).send( error.message )
	})
	
}

exports.deleteTag = function ( req, res ) {
	
	function deleteTag ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var contentId = mongoose.Types.ObjectId( req.query.id ),
				tag = JSON.parse( req.query.tag )
			
			Content.findOneAndUpdate( 
				{ user: user._id, _id: contentId, "tags": tag },
				{ $pull: { "tags": tag } } )
			.exec()
			.then( function ( result ) {
				index.partialUpdateObject( { '_tags': { 'value': tag.text, '_operation': 'Remove' }, 'objectID': result._id } )
				
				resolve( result )
			}, function ( error ) {
				reject( new Error( "Could not remove that tag." ) )
			})
			
		})
	}
	
	getUser( req.token )
	.then( deleteTag )
	.then( function ( result ) {
		if ( result == 0 )
			return res.status( 500 ).send( "Could not remove tag, it wasn't found." )
		
		return res.status( 200 ).send( "Tag removed." )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).send( error.message )
	})
}

exports.search = function ( req, res ) {
	
	getUser( req.token )
	.then( function ( user ) {
	
		index.search( req.query.terms, function( error, result ) {
			if ( error ) return res.status( 500 ).json( result )

			return res.status( 200 ).json( result.hits )
		}, { facets: '*', facetFilters: [ 'user:' + user._id, 'stream:' + req.query.stream ], page: req.query.page, hitsPerPage: req.query.show } )
	
	})
	.catch( function ( error ) {
		return res.status( 500 ).json( error.message )
	})
	
}