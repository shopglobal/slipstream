var fs = require('fs'),
	path = require('path'),
	User = require('../models/userModel.js'),
	Blog = require('../models/blogModel.js'),
	tokenManager = require('../config/tokenManager'),
//	article = require('article'),
	mongoose = require( 'mongoose-q' )( require( 'mongoose' ) )
	async = require('async'),
	request = require( 'request' ),
	Q = require( 'q' ),
	saveImage = require( '../helpers/save-image' ),
	getUser = require( '../helpers/get-user' ),
	read = require( 'node-readability' ),
	log = require( '../helpers/logger.js' ),
	jsdom = require( 'jsdom' )

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	function getArticle () {
		var deferred = Q.defer()
		
		read( req.body.url, function( err, article, meta ) {
			if ( err )
				return log.error( err )
			
			var newArticle = {
				title: article.title,
				description: "",
				images: [],
				content: article.content
			}
			
			article.close()
			
			deferred.resolve( newArticle )
		})
		
		return deferred.promise
	}
	
	/*
	Replaces external images in the body of the readbale HTML with locally-hosted images. 
	
	Accepts: article object
	
	Returns: article object with images array and replaced URLs in article.content
	*/
	function replaceImages ( article ) {
		var deferred = Q.defer()
		
		jsdom.env( article.content, function ( error, window ) {
			
			images = window.document.getElementsByTagName( 'img' )
			
			imageMapFunction = Array.prototype.map.call( images, function ( each, index ) {
				var deferred = Q.defer()
				
				saveImage( req.body.type, each.src )
				.spread( function ( imageHash, imageOriginalPath, imageThumbPath ) {
					article.images.push({
						image: imageOriginalPath,
						imageHash: imageHash,
						imageThumb: imageThumbPath
					})
					
					each.src = imageOriginalPath
					
					deferred.resolve()
				})
				
				return deferred.promise
			})
			
			Q.all( imageMapFunction )
			.then( function () {
			
				article.content = window.document.body.innerHTML
					
				var paragprahs = window.document.body.getElementsByTagName( 'p' )
				
				for ( i = 0; i <= 3; i++ ) {
					if ( paragprahs[i] ) {
						article.description += " " + paragprahs[i].innerHTML
						
						if ( i == 3 ) {
							deferred.resolve( article )
						}
					}
				}
			})
			
		}) // end of jsdom
		
		return deferred.promise
	} // end of replaceImages()
	
	function saveArticle ( article ) {
		var deferred = Q.defer()
		
		getUser( req.token )
		.then( function ( user ) {
			
			var blog = new Blog({
				user: user,
				title: article.title,
				description: article.description,
				content: article.content,
				url: req.body.url,
				added: ( new Date() / 1).toFixed()
			})
			
			if ( article.images[0] ) {
				blog.image = article.images[0].image
				blog.imageThumb = article.images[0].imageThumb
				blog.imageHash = article.images[0].imageHash
				blog.images = article.images
			}
			
			blog.save()
			
			deferred.resolve( blog )	
		})
		
		return deferred.promise	
	}
	
	
	getArticle()
	.then( replaceImages )
	.then( saveArticle )
	.then( function ( article ) {
		log.info( { title: article.title, url: article.url }, "Article saved" )
		return res.json( article )
	})
	
}


exports.stream = function ( req, res ) {
	var show = req.query.show
	var page = req.query.page
	
	getUser( req.token )
	.then( function ( user ) {
			
		Blog.find( { $query: { user: user }, $orderby: { added: -1 } } )
		.skip( page > 0 ? (( page - 1) * show) : 0).limit( show ).exec()
		.then( function ( result ) {
			return res.json( result )
		})
		
	})
	.catch( function ( error ) {
		return res.status( 500 ).send( { "Error": error.message } )
	})
}

// lets a user delete an article from her stream

exports.delete = function ( req, res ) {
	getUser( req.token )
	.then( function ( user ) {
			
 		var contentId = mongoose.Types.ObjectId(req.query.id)
			
		Blog.findOneAndRemove( { user: user, _id: contentId } ).exec()
		.then( function ( result ) {
			return res.json( result )
		})
					
	})
	.catch( function ( error ) {
			return res.status( 500 ).send( { Error: error.message } )
	})
}


