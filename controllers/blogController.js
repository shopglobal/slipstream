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
	imageResolver = new ImageResolver(),
	articleTitle = require( 'article-title' ),
	s3sig = require( 'amazon-s3-url-signer' ),
	htmlStripper = require( 'htmlstrip-native' )

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
/*	function getPreview () {
		return Q.Promise( function ( resolve, reject, notify ) {
		
			reuest( req.body.url ).pipe( article( req.body.url, fun
			
		})
	}*/
	
	function getArticle ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
		
			imageResolver.register(new ImageResolver.FileExtension())
			imageResolver.register(new ImageResolver.MimeType())
			imageResolver.register(new ImageResolver.Opengraph())
			imageResolver.register(new ImageResolver.Webpage())
			
			var newArticle = new Content({
				user: user,
				images: [],
				processing: true,
				stream: 'read',
				url: req.body.url,
				added: ( new Date() / 1).toFixed()
			})
			
			imageResolver.resolve( req.body.url, function ( result ) {
				if ( !result.image ) return resolve( article )

				saveImage( req.body.type, result.image )
				.spread( function ( hash, orig, thumb ) {
					newArticle.images.push({
						image: orig,
						imageHash: hash,
						imageThumb: thumb
					})
				})
				.then( function () {

					read( req.body.url, function( err, data, meta ) {
						if ( err || !data )
							reject( new Error( "Problem reading article." ) )
							
						var description = htmlStripper.html_strip( data.content, {
							include_script : false,
    						include_style : false,
    						compact_whitespace : true } ).substring( 0, 400 )

						_.extend( newArticle, {
							title: data.title,
							description: description,
							content: data.content } )
						
						console.log( data.content )

						data.close()

						resolve( newArticle )
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
		return
	})
	
}