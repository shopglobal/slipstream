var fs = require('fs'),
	path = require('path'),
	User = require('../models/userModel.js'),
	Content = require('../models/contentModel.js'),
	tokenManager = require('../config/tokenManager'),
	article = require('article'),
	mongoose = require( 'mongoose-q' )( require( 'mongoose' ) ),
	async = require('async'),
	request = require( 'request' ),
	Q = require( 'q' ),
	_ = require( 'underscore' ),
	saveImage = require( '../helpers/save-image' ),
	getUser = require( '../helpers/get-user' ),
	read = require( 'node-readability' ),
	jsdom = require( 'jsdom' ),
	crypto = require( 'crypto' ),
	ImageResolver = require( 'image-resolver' ),
	htmlStripper = require( 'htmlstrip-native' ),
	needle = require( 'needle' ),
	readability = require( 'node-readability' ),
	urlExpand = require( 'url-expand' ),
	Algolia = require( 'algoliasearch' ),
	algolia = new Algolia( process.env.ALGOLIASEARCH_APPLICATION_ID, process.env.ALGOLIASEARCH_API_KEY ),
	index = algolia.initIndex( 'Contents' ),
	slug = require( 'slug' )
//	readability = require( 'readable-proxy' ).scrape

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	function getArticle () {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			/*
			If the article already exists, save the user to it and return the article, minus the `users` sub-document
			*/			
			urlExpand( req.body.url, function( error, url ) {
	
			Content.findOne( { url: url } )
			.then( function ( result ) {
				if ( result ) return resolve( result )	
				else {
					var imageResolver = new ImageResolver()

					imageResolver.register(new ImageResolver.FileExtension())
					imageResolver.register(new ImageResolver.MimeType())
					imageResolver.register(new ImageResolver.Opengraph())
					imageResolver.register(new ImageResolver.Webpage())

					var newArticle = new Content({
						images: [],
						processing: true,
						url: req.body.url,
						private: true
					})

					needle.get( req.body.url, {
						compressed: true,
						follow_max: 3
					}, function( error, response ) {
						if ( error ) return reject( error )

						readability( response.body, function ( error, article, meta ) {
							if ( error ) {
								article.close()

								return reject( new Error( { error: error, message: "We couldn't get that page right now." } ) )
							}

							var description = htmlStripper.html_strip( article.content, {
								include_script : false,
								include_style : false,
								compact_whitespace : true } ).substring( 0, 400 )

							var a = _.extend( newArticle, {
								title: article.title,
								description: description,
								content: article.content,
								slug: slug( article.title, { lower: true } )
							} )

							var b = new Content( newArticle )

							imageResolver.resolve( req.body.url, function ( result ) {
								saveImage( req.body.type, result.image )
								.spread( function ( hash, orig, thumb ) {
									newArticle.images.push({
										orig: orig,
										hash: hash,
										thumb: thumb
									})
									
									article.close()

									resolve( newArticle )
								}, function ( error ) {
									console.log( error )
									reject( error )
								})
							})
						})
					})
				}		
			}, function ( error ) {
				console.log( error )
				reject( error )
			})
		})
	})}
	
	/*
	Replaces external images in the body of the readbale HTML with locally-hosted images. 
	
	Accepts: article object
	
	Returns: article object with images array and replaced URLs in article.content
	*/
	function replaceImages ( article ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
		/*
		Try detect if the article has no images, quit if it does not.
		*/
		if ( article.content.indexOf( 'img' ) <= -1 ) {
			return resolve( article )
		}
		
		/*
		Load a fake browser environtment to find image elements and replace them.
		*/
		jsdom.env( article.content, {
			features: {
				ProcessExternalResources: false
			}
		}, function ( error, window ) {
			
			var images = window.document.getElementsByTagName( 'img' )			
			
			imageMapFunction = Array.prototype.map.call( images, function ( each, index ) {
				return Q.Promise( function ( resolve, reject, notify ) {
					
					saveImage( req.body.type, each.src )
					.spread( function ( imageHash, imageOriginalPath, imageThumbPath ) {
						article.images.push({
							orig: imageOriginalPath,
							hash: imageHash,
							thumb: imageThumbPath
						})

						each.src = imageOriginalPath

						resolve()
					})
					.catch( function ( error ) {
						console.log( error )
						resolve()
					})
				
				})
			})
			
			Q.all( imageMapFunction )
			.then( function () {
			
				article.content = window.document.body.innerHTML

				window.close()
				resolve( article )

			})
			.catch( function ( error ) {
				reject( new Error( error ) )
			})
		})
			
		}) // end of jsdom
	}// end of replaceImages()
	
	function saveArticle ( article ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var blog = {
				processing: false,
				images: article.images,
				text: article.content
			}

			article.update( { $set: blog } ).exec()
			.then( function ( blog ) {
				
				resolve( blog )	
			}, function ( error ) {
				reject( new Error( error ) )
			})
		})
	}
	
	getUser( req.token )
	.then( function ( user ) {
		getArticle()
		.then( function ( article ) {
			var users = article.users.create({
				user: user._id,
				added: ( new Date() / 1).toFixed(),
				stream: 'read',
				private: true
			})

			var push = article.users.push( users )
			
			/*
			Save the item to Algolia
			*/
			index.addObject( { 
				title: article.title,
				url: article.url,
				description: article.description,
				text: article.text,
				date: article.date,
				images: article.images,
				user: users.user,
				added: users.added,
				stream: users.stream
			}, function ( err, data ) {
				if ( err ) console.log( err )
			}, users._id )

			if( article.alreadySaved ) {	
				return res.status( 200 ).json( {
					title: article.title,
					url: article.url,
					_id: users._id,
					description: article.description,
					images: article.images
				})
			} else {
				article.save( function ( err, article ) {
					res.status( 200 ).json( {
						title: article.title,
						url: article.url,
						_id: users._id,
						description: article.description,
						images: article.images
					})
					replaceImages( article )
					.then( saveArticle )
					.then( function ( article ) {

						index.partialUpdateObject({
							objectID: users._id,
							images: article.images,
							text: article.text
						}, function ( error, content ) {
							if ( error ) console.log( error )
						})

						console.info( { title: article.title, url: article.url }, "Article saved" )
						return
					})
					.catch( function ( error ) {
						console.log( error )
					})
				})
			}
		})
		.catch( function ( error ) {
			console.error( error )
			return res.status( 500 ).json( error.message )
		})
	})	
	.catch( function ( error ) {
		console.error( error )
		return res.status( 500 ).json( error.message )
	})
	
}