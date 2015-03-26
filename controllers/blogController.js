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
	readability = require( 'readable-proxy' ).scrape

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	function getArticle ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var imageResolver = new ImageResolver()
		
			imageResolver.register(new ImageResolver.FileExtension())
			imageResolver.register(new ImageResolver.MimeType())
			imageResolver.register(new ImageResolver.Opengraph())
			imageResolver.register(new ImageResolver.Webpage())
			
			var newArticle = new Content({
				user: user._id,
				images: [],
				processing: true,
				stream: 'read',
				url: req.body.url,
				added: ( new Date() / 1).toFixed()
			})
			
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
					readability( req.body.url, { sanitize: true, userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/600.4.10 (KHTML, like Gecko) Version/8.0.4 Safari/600.4.10" })
					.then( function ( article ) {
						var description = htmlStripper.html_strip( article.content, {
							include_script : false,
    						include_style : false,
    						compact_whitespace : true } ).substring( 0, 400 )

						_.extend( newArticle, {
							title: article.title,
							description: description,
							content: article.content } )
						
						resolve( newArticle )						
					})
					.catch( function ( error ) {
						reject( new Error( { error: error, message: "We couldn't get that page right now." } ) )
					})
				})
				.catch( function ( error ) {
					reject( new Error( error ) )
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
		
		jsdom.env( article.content, function ( error, window ) {
			
			var images = window.document.getElementsByTagName( 'img' ),
				paragraphs = window.document.body.getElementsByTagName( 'p' )
			
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
				text: article.content,
				description: article.description,
				images: article.images
			}

			Content.findOneAndUpdate( 
				{ _id: article._id }, 
				{ $set: blog } )
			.exec()
			.then( function ( blog ) {
				resolve( blog )	
			}, function ( error ) {
				reject( new Error( error ) )
			})
		})
	}
	
	getUser( req.token )
	.then( getArticle )
	.then( function ( article ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			article.save( function ( err, article ) {
				console.log( article._id )
				res.status( 200 ).json( article )
				resolve( article )
			})
		})		
	})
	.then( replaceImages )
	.then( saveArticle )
	.then( function ( article ) {
		log.info( { title: article.title, url: article.url }, "Article saved" )
		return
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).json( error.message )
	})
	
}