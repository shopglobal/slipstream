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
	index = algolia.initIndex( 'Contents' ),
	urlExpand = require( 'url-expand' )

// adds content to users stream.

exports.add = function ( req, res ) {
	
	function getContent ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
					
		/*
		If the article already exists, save the user to it and return the article, minus the `users` sub-document
		*/
		urlExpand( req.body.url, function ( error, url ) {
			
			Content.findOne( { url: url } ).exec()
			.then( function ( result ) {
				if ( result ) {
					var newUser = result.users.create({
						user: user._id,
						added: ( new Date() / 1).toFixed(),
						stream: req.body.type
					})
					
					result.users.push( newUser )
					
					result.save( function () {
						index.addObject( { 
							title: result.title,
							url: result.url,
							description: result.description,
							text: result.text,
							date: result.date,
							images: result.images,
							user: newUser.user,
							added: newUser.added,
							stream: newUser.stream
						}, function ( err, data ) {
							if ( err ) console.log( err )
						}, newUser._id )
					})
										
					return res.status( 200 ).json({
						title: result.title,
						description: result. description,
						images: result.images,
						_id: newUser._id
					})
				} else {
					request( {
						url: process.env.IFRAMELY_URL + "/iframely?url=" + url
						}, function ( err, response, body ) {
						if ( err || response.statusCode !== 200 )
							reject( new Error( "Error from embed server: " + body + " --> " + req.body.url ) )

						if ( !body )
							reject( new Error( "Error from embed server. No body returned." ) )
							
						var parsedBody = JSON.parse( body )
						
						parsedBody.url = url

						resolve( parsedBody )
					})
				}
			})
		
		})
				
		})
	}
	
	function makeContent( contentInfo ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var content = new Content( _.extend({
				url: contentInfo.url
			}, contentInfo.meta ))
			
			getUser( req.token )
			.then( function ( user ) {
				var users = content.users.create({
					user: user._id,
					added: ( new Date() / 1).toFixed(),
					stream: req.body.type
				})
				
				content.users.push( users )
				
				var searchIndex = {
					user: users.user,
					added: users.added,
					stream: users.stream,
					text: content.text,
					description: content.description,
					title: content.title,
					images: content.images
				}
				
				index.addObject( searchIndex, function ( err, data ) {
					if ( err ) console.log( err )
				}, users._id )
				
				/*
				If there is a picture, save and record it. Then save.
				*/
				if ( contentInfo.links[2].href ) {
					saveImage( req.body.type, contentInfo.links[2].href )
					.spread( function( imageHash, imageOriginalPath, imageThumbPath) {
						content.images.push( {
							orig: imageOriginalPath,
							thumb: imageThumbPath,
							hash: imageHash		
						})
						saveContent( users )
					})
				} else { saveContent( users ) }
			})
			
			function saveContent ( users ) {
				content.save( function ( err, result ) {
					content._id = users._id
					
					resolve( content )
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

	var show = parseInt( req.query.show ),	// the number of items to show per page
		page = req.query.page,	// the current page being asked for
		stream = req.params.stream,	// the type of content to get
		skip = ( page > 0 ? (( page - 1 ) * show ) : 0 ) // amount to skip
	

	function getStream ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var userid = mongoose.Types.ObjectId( user )
		
			Content.aggregate( [
				{ $unwind: '$users' },
				{ $match: { 
					'users.user': userid, 
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
					tags: '$users.tags'
				} },
				{ $sort: { added: -1 } },
				{ $skip: skip },
				{ $limit: show }
			] )
			.exec()
			.then( function( results ) { 
				
				resolve( results )

			})
			
		})
	}
	
	function findUserid ( username ) {
		return Q.promise( function ( resolve, reject, notify ) {
			User.findOne( { username: req.params.username } )
			.then( function( result ) {
				resolve( result.id )
			})
			.catch( function ( error ) {
				reject( error )
			})
		})		
	}
	
	findUserid( req.params.username )
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
				if ( !result ) return reject( new Error( "No item found when trying to dleete." ) )
				
				var remove = result.users.id( contentId ).remove()
				
				result.save( function ( error, output ) {
					index.deleteObject( contentId )
					
					resolve( result )
				})
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
			
			Content.update( 
				{ 'users._id': contentId },
				{ $pushAll: { 'users.$.tags': tags } }
			).exec()
			.then( function ( result ) {
				
				tags.forEach( function ( each ) {
					index.partialUpdateObject( { '_tags': { 'value': each.text, '_operation': 'AddUnique' }, 'objectID': contentId } )
				})
				
				resolve( result )
			}, function ( error ) {
				if ( error ) return reject( error )
			})
				
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
			
			Content.update( 
				{ 'users._id': contentId },
				{ $pull: { 'users.$.tags': tag } } )
			.exec()
			.then( function ( result ) {
				index.partialUpdateObject( { '_tags': { 'value': tag.text, '_operation': 'Remove' }, 'objectID': contentId } )
				
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
	
	/*
	Some search code for if we use our local server for it later.
	*/
	/*	
	getUser( req.token )
	.then( function ( user ) {
		
		Content.textSearch( req.query.terms, {
//			filter: { 'users.user': user.id }
		}, function ( error, results ) {
			if ( error ) return res.status( 500 ).json( error )
			
			return res.status( 200 ).json( results.results )
		})
	})
	*/
	
	getUser( req.token )
	.then( function ( user ) {
	
		index.search( req.query.terms, function( error, result ) {
			if ( error ) return res.status( 500 ).json( result )

			return res.status( 200 ).json( result.hits )
		}, { facetFilters: [ 'user:' + user.id, 'stream:' + req.query.stream ], page: req.query.page, hitsPerPage: req.query.show } )
	
	})
	.catch( function ( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
	
}

exports.following = function ( req, res ) {
	
	getUser( req.token )
	.then( function ( user ) {
		
		var following = []
		var page = req.query.page
		var skip = ( page > 0 ? (( page - 1 ) * show ) : 0 )
		
		var array = user.following.forEach( function ( each ) {
			following.push( each.user )
		})
		
		Content.aggregate( [
			{ $unwind: '$users' },
			{ $match: { 
				'users.user': { $in: following }, 
				'users.stream': req.params.stream } },
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
				tags: '$users.tags'
			} },
			{ $sort: { added: -1 } },
			{ $skip: skip },
			{ $limit: show }
		] ).exec()
		.then( function ( results ) {
			return res.status( 200 ).json( results )
		}, function ( error ) {
			console.log( error )

			return res.status( 500 ).json( error )
		})
	})
}

exports.private = function ( req, res ) {
	
	getUser( req.token )
	.then( function ( user ) {
		Content.findOne( { 'users.user': user._id, 'users._id': req.body.id } )
		.then( function ( result ) {
			result.id( req.body.id ).togglePrivate()
			.then( function ( result ) {
				return res.status( 200 ).json( result.private ? "Set to public" : "Set to private" )
			})
		})
	})
}