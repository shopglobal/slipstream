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
	validator = require( 'validator' ),
	Algolia = require( 'algoliasearch' ),
	algolia = new Algolia( process.env.ALGOLIASEARCH_APPLICATION_ID, process.env.ALGOLIASEARCH_API_KEY ),
	index = algolia.initIndex( 'Contents' ),
	urlExpand = require( 'url-expand' ),
	BitlyApi = require( 'node-bitlyapi' ),
	Bitly = new BitlyApi( {
		client_id: process.env.BITLY_CLIENT_ID,
		client_secret: process.env.BITLY_CLIENT_SECRET
	})

Bitly.setAccessToken( process.env.BITLY_ACCESS_TOKEN )

function findUserid ( username ) {
	return Q.promise( function ( resolve, reject, notify ) {
		var query = mongoose.Types.ObjectId.isValid( username ) ? { _id: username } : { username: username }
		
		User.findOne( query )
		.then( function( result ) {
			if ( !result ) return reject( new Error( { message: "No user found" } ) )
			
			resolve( result.id )
		})
		.catch( function ( error ) {
			reject( error )
		})
	})		
}

function projectContent ( slug ) {
	return Q.Promise( function ( resolve, reject, notify ) {
		
		if ( mongoose.Types.ObjectId.isValid( slug ) ) {
			var objectid = mongoose.Types.ObjectId( slug )
			var match = { $match: { $or: [ { 'users._id': objectid }, { _id: objectid } ] } }
		} else  {
			var match = { $match: { slug: slug } }
		}
		
		Content.aggregate( [
			{ $unwind: '$users' },
			match, 
			{ $project: { 
				_id: '$users._id',
				title: '$title',
				slug: '$slug',
				url: '$url', 
				images: '$images',
				description: '$description',
				added: '$users.added',
				user: '$users.user',
				stream: '$users.stream',
				text: '$text',
				processing: '$processing',
				tags: '$users.tags',
				private: '$users.private',
				thumbnail: '$thumbnail'
			} }
		] ).exec()
		.then( function ( result ) {
			resolve( result )
		}, function ( error ) {
			reject( error )
		})
	})
}

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
						stream: req.body.type,
						private: true
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
				url: contentInfo.meta.canonical
			}, contentInfo.meta ))
			
			getUser( req.token )
			.then( function ( user ) {
				var users = content.users.create({
					user: user._id,
					added: ( new Date() / 1).toFixed(),
					stream: req.body.type,
					private: true
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

/*
Allows admins to edit posts. 

INPUT: Edited text and valid user token.
*/
exports.edit = function ( req, res ) {
	
	User.findOne( { token: req.token, role: 'admin' } )
	.then( function ( user ) {
		if ( !user ) throw new Error( "Permissions don't appear to allow that." )
		
		var contentid = mongoose.Types.ObjectId( req.body.id )
		
		Content.findOne( { $or: [ 
			{ 'users._id': req.body.id }, 
			{ _id: req.body.id }
		] } )
		.then( function ( parent ) {
			if ( !parent ) throw new Error( "Couldn't find that article to edit." )
			
			var parent = _.extend( parent, req.body.changes )
			
			parent.save()
			.then( function ( result ) {
				console.log( "Admin edit: Post: " + parent._id )
				return res.status( 200 ).json( "The post was saved." )
			}, function ( error ) {
				console.log( error )
				return res.status( 500 ).json( error.message )
			})
		})
		.catch( function ( error ) {
			console.log( error )
			return res.status( 500 ).json( error.message )
		})
	})
	.catch( function ( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
}

/*
INPUT: User token at req.token and username of stream being viewed at req.params.username

OUTPUT: The stream of the user being viewed.

Tries to determine if the stream is the logged-in user's stream, and includes or excluded private posts based on that.
*/
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
					tags: '$users.tags',
					private: '$users.private',
					thumbnail: '$thumbnail'
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
	
	findUserid( req.params.username )
	.then( function ( user ) {
		User.findOne( { token: req.token } )
		.then( function ( result ) {
			if ( user == result._id ) {
				getStream( user )
				.then( function ( results ) {
					return res.status( 200 ).json( results )
				})
			} else {
				var userid = mongoose.Types.ObjectId( user )
				Content.aggregate( [
					{ $unwind: '$users' },
					{ $match: { 
						'users.user': userid, 
						'users.stream': stream,
						$or: [ { 'users.private': false }, { 'users.private': { $exists: false } } ]
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
						tags: '$users.tags',
						private: '$users.private',
						slug: '$slug'
					} },
					{ $sort: { added: -1 } },
					{ $skip: skip },
					{ $limit: show }
				] ).exec()
				.then( function ( results ) {
					return res.status( 200 ).json( results )
				})
			}
		})
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).send( { error: error.message } )
	})
}

/*
Gets a single post. Used to dynamically get content a user just added to their stream, or get an item's content after it's been updated.
*/
exports.single = function ( req, res ) {
	
	var userToken = req.headers['authorization'] ? req.headers['authorization'].split( ' ' )[1] : 'null'
	
	findUserid( req.params.username )
	.then( function ( userid ) {
		User.findOne( { token: userToken } )
		.then( function ( result ) {
			var option = req.query.id ? req.query.id : req.query.slug
			
			if ( !result || result._id != userid ) {
				projectContent( option )
				.then( function ( result ) {
					if ( result.private == true ) return res.status( 500 ).json( "Can't find that content." )
										
					return res.status( 200 ).json( result )
				})
			} else {
				projectContent( option )
				.then( function ( result ) {
					return res.status( 200 ).json( result )
				})
				.catch( function ( error ) {
					console.log( error )
					
					return res.status( 500 ).json( error.message )
				})
			}
		})
		.catch( function ( error ) {
			console.log( error )
			
			return res.status( 200 ).json( error.message )
		})
	})
	.catch( function ( error ) {
		console.log( error ) 
		
		return res.status( 500 ).json( error.message )
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
	
		index.search( req.query.terms, { facetFilters: [ 'user:' + user.id, 'stream:' + req.query.stream ], page: req.query.page, hitsPerPage: req.query.show } )
		.then( function( result ) {
			return res.status( 200 ).json( result.hits )
		})
		.catch( function ( error ) {
			return res.status( 500 ).json( error )			
		})
	
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
		var page = parseInt( req.query.page )
		var show = parseInt( req.query.show )
		var skip = ( page > 0 ? (( page - 1 ) * show ) : 0 )
		
		var array = user.following.forEach( function ( each ) {
			following.push( each.user )
		})
		
		Content.aggregate( [
			{ $unwind: '$users' },
			{ $match: { 
				'users.user': { $in: following }, 
				'users.stream': req.params.stream,
			 	$or: [ { 'users.private': false }, { 'users.private': { '$exists': false } } ]
			} },
			{ $project: { 
				_id: '$users._id',
				title: '$title', 
				url: '$url',
				slug: '$slug',
				images: '$images',
				thumbnail: '$thumbnail', 
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
			User.populate( results, { path: 'user', select: 'username' } )
			.then( function ( results ) {
				return res.status( 200 ).json( results )	
			})			
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
		.then( function ( parent ) {
			parent.users.id( req.body.id ).private = !parent.users.id( req.body.id ).private
			
			parent.save()
			.then( function ( result ) {
				result.users.id( req.body.id )
				return res.status( 200 ).json( "Post privacy changed." )
			})
		})
		.catch( function ( error ) {
			console.log( error )
			return res.status( 500 ).json( error.message )
		})
	})
	.catch( function ( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
}

exports.flag = function ( req, res ) {
	User.findOne( { token: req.token, role: 'admin' } )
	.then( function ( user ) {
		if ( !user ) return reject( new Error( { message: "Permissions don't appear to allow that." } ) )
		
		Content.findOne( { $or: [ { 'users._id': req.body.id }, { _id: req.body.id } ] } )
		.then( function ( parent ) {
			if ( !parent ) return res.status( 500 ).json( "Couldn't find that item" )
			
			if ( req.body.flag == 'adult' ) {
				parent.flagAdult()
				.then( function( result ) {
					return res.status( 200 ).json( "That post was flagged." )
				}, function ( error ) {
					console.log( error )
					return res.status( 500 ).json( error.message )
				})	
			} else if ( req.body.flag == 'hidden' ) {
				parent.flagHidden()
				.then( function( result ) {
					return res.status( 200 ).json( "That post was flagged." )
				}, function ( error ) {
					console.log( error )
					return res.status( 500 ).json( error.message )
				})	
			}
			
		}, function ( error ) {
			console.log( error )
			return res.status( 500 ).json( error.message )
		})
	}, function ( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
}

exports.shortenUrl = function ( req, res ) {
	
	Q.try( function () {
		if ( validator.isURL( req.query.url ) ) {
			return req.query.url
		} else {
			throw new Error( "That doesn't look like a valid URL." )
		}
	})
	.then( function ( url ) {
		Bitly.shorten( { longUrl: url }, function( err, result ) {
			if ( err ) throw new Error( err )
			
			jsonResult = JSON.parse( result )
			
			return res.status( 200 ).json( jsonResult.data.url )
		})
	})
	.catch( function ( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
}