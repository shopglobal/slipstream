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
	log = require( '../helpers/logger.js' ),
	jsdom = require( 'jsdom' ),
	crypto = require( 'crypto' ),
	ImageResolver = require( 'image-resolver' ),
	articleTitle = require( 'article-title' ),
	s3sig = require( 'amazon-s3-url-signer' ),
	htmlStripper = require( 'htmlstrip-native' ),
	needle = require( 'needle' ),
	readability = require( 'node-readability' ),
	urlExpand = require( 'url-expand' ),
	Algolia = require( 'algolia-search' ),
	algolia = new Algolia( process.env.ALGOLIASEARCH_APPLICATION_ID, process.env.ALGOLIASEARCH_API_KEY ),
	index = algolia.initIndex( 'Contents' )
//	readability = require( 'readable-proxy' ).scrape

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	function getArticle ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			/*
			If the article already exists, save the user to it and return the article, minus the `users` sub-document
			*/			
			urlExpand( req.body.url, function( error, url ) {
	
			Content.findOne( { url: url } ).exec()
			.then( function ( result ) {
				if ( result ) {
					var users = result.users.create({
						user: user._id,
						added: ( new Date() / 1).toFixed(),
						stream: 'read'
					})
					
					var push = result.users.push( users )
					
					result.save( function( error, result ) {
						
						/*
						Save the item to Algolia
						*/
						index.addObject( { 
							title: result.title,
							url: result.url,
							description: result.description,
							text: result.text,
							date: result.date,
							images: result.images,
							user: users.user,
							added: users.added,
							stream: users.stream
						}, function ( err, data ) {
							if ( err ) console.log( err )
						}, users._id )
						
						return resolve([{
							'_id': users._id,
							title: result.title,
							description: result.description,
							images: result.images,
							alreadySaved: true
						}, null ])
					})
				} else {
					var imageResolver = new ImageResolver()

					imageResolver.register(new ImageResolver.FileExtension())
					imageResolver.register(new ImageResolver.MimeType())
					imageResolver.register(new ImageResolver.Opengraph())
					imageResolver.register(new ImageResolver.Webpage())

					var newArticle = new Content({
						images: [],
						processing: true,
						url: req.body.url
					})
					
					var newUser = newArticle.users.create( {
						stream: 'read',
						user: user._id,
						added: ( new Date() / 1 ).toFixed()
					} )
					
					newArticle.users.push( newUser )

					imageResolver.resolve( req.body.url, function ( result ) {
						if ( !result ) return resolve( article )

						saveImage( req.body.type, result.image )
						.spread( function ( hash, orig, thumb ) {
							newArticle.images.push({
								orig: orig,
								hash: hash,
								thumb: thumb
							})
						})
						.then( function () {
							needle.get( req.body.url, {
								compressed: true,
								follow_max: 5
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
										content: article.content } )

									var b = new Content( newArticle )
									
									/*
									Save to Alglia search.
									*/
									index.addObject( { 
										title: newArticle.title,
										url: newArticle.url,
										description: newArticle.description,
										text: newArticle.content,
										date: newArticle.date,
										user: newUser.user,
										added: newUser.added,
										stream: newUser.stream
									}, function ( err, data ) {
										if ( err ) console.log( err )
									}, newUser._id )

									res.status( 200 ).json( newArticle )

									article.close()

									resolve( [ newArticle, newUser ] )
								})
							})
							.catch( function ( error ) {
								reject( new Error( error ) )
							})
						})
					})		
				}	
			})
			
			})
		})
	}
	
	/*
	Replaces external images in the body of the readbale HTML with locally-hosted images. 
	
	Accepts: article object
	
	Returns: article object with images array and replaced URLs in article.content
	*/
	function replaceImages ( article ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
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
							image: imageOriginalPath,
							imageHash: imageHash,
							imageThumb: imageThumbPath
						})

						each.src = imageOriginalPath

						resolve()
					})
					.catch( function ( error ) {
						reject( error )
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
	.then( getArticle )
	.spread( function ( article, user ) {
		if( article.alreadySaved ) {
			return res.status( 200 ).json( article )
		} else {
			article.save( function ( err, article ) {
				replaceImages( article )
				.then( saveArticle )
				.then( function ( article ) {
					
					index.partialUpdateObject({
						objectID: user._id,
						images: article.images,
						text: article.text
					}, function ( error, content ) {
						if ( error ) console.log( error )
					})
					
					log.info( { title: article.title, url: article.url }, "Article saved" )
					return
				})
				.catch( function ( error ) {
					console.log( error )
				})
			})
		}
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).json( error.message )
	})
	
}