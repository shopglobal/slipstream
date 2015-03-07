var fs = require('fs'),
	path = require('path'),
	User = require('../models/userModel.js'),
	Content = require('../models/contentModel.js'),
	tokenManager = require('../config/tokenManager'),
//	article = require('article'),
	mongoose = require( 'mongoose-q' )( require( 'mongoose' ) )
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
	imageResolver = new ImageResolver(),
	s3sig = require( 'amazon-s3-url-signer' ),
	BlitLine = require( 'simple_blitline_node' ),
	blitline = new BlitLine()

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	function getArticle () {
		return Q.Promise( function ( resolve, reject, notify ) {
		
			read( req.body.url, function( err, article, meta ) {
				if ( err || !article )
					reject( new Error( "Problem reading article." ) )
					
				var newArticle = {
					title: article.title,
					description: "",
					images: [],
					content: article.content
				}
				
				article.close()

				resolve( newArticle )
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
				paragprahs = window.document.body.getElementsByTagName( 'p' )
			
			article.content = window.document.body.innerHTML

			for ( i = 0; i <= 3; i++ ) {
				if ( paragprahs[i] ) {
					article.description += " " + paragprahs[i].innerHTML
				}
			}
			
			Array.prototype.forEach.call( images, function ( each, index ) {
				saveImage( req.body.type, each.src )
				.spread( function ( imageHash, imageOriginalPath, imageThumbPath ) {
					article.images.push({
						image: imageOriginalPath,
						imageHash: imageHash,
						imageThumb: imageThumbPath
					})
					
					each.src = imageOriginalPath
				})
				if ( index + 1 == images.length ) {
					window.close()
					resolve( article )
				}		
			})

		})
			
		}) // end of jsdom
	}// end of replaceImages()
	
	function saveArticle ( article ) {
		var deferred = Q.defer()
		
		getUser( req.token )
		.then( function ( user ) {
			
			var blog = new Content( _.extend({
				user: user,
				stream: 'read',
				text: article.content,
				url: req.body.url,
				added: ( new Date() / 1).toFixed()
			}, article ) )
			
			blog.save()
			
			deferred.resolve( blog )	
		})
		
		return deferred.promise	
	}
	
	function resolveImage ( article ) {
		return Q.Promise( function ( resolve, reject, notify ) {			
			if ( article.images.length > 0 )
				return resolve( article )
			
			imageResolver.register(new ImageResolver.FileExtension())
			imageResolver.register(new ImageResolver.MimeType())
			imageResolver.register(new ImageResolver.Opengraph())
			imageResolver.register(new ImageResolver.Webpage())
				
			imageResolver.resolve( req.body.url, function ( result ) {
				saveImage( req.body.type, result.image )
				.spread( function ( hash, orig, thumb ) {
					article.images.push({
						image: orig,
						imageHash: hash,
						imageThumb: thumb
					})
					
					resolve( article )
				})
				.catch( function ( error ) {
					reject( new Error( error ) )
				})
			})
		})
	}
	
	getArticle()
	.then( replaceImages )
	.then( resolveImage )
	.then( saveArticle )
	.then( function ( article ) {
		log.info( { title: article.title, url: article.url }, "Article saved" )
		return res.status( 200 ).json( article )
	})
	.catch( function ( error ) {
		log.error( error )
		return res.status( 500 ).send( error.message )
	})
	
}