var fs = require('fs'),
	path = require('path'),
	User = require('../models/userModel.js'),
	Blog = require('../models/blogModel.js'),
	tokenManager = require('../config/tokenManager'),
//	article = require('article'),
	async = require('async'),
	request = require( 'request' ),
	Q = require( 'q' ),
	saveImage = require( '../helpers/save-image' ),
	getUser = require( '../helpers/get-user' ),
	read = require( 'node-readability' ),
	jsdom = require( 'jsdom' )

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	function getArticle () {
		var deferred = Q.defer()
		
		read( req.body.url, function( err, article, meta ) {
			if ( err )
				return console.log( err )
			
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
	
	Returns: DOM of body section of page with replaced <img> URLS
	*/
	function replaceImages ( article ) {
		var deferred = Q.defer()
		
		jsdom.env( article.content, function ( error, window ) {
			
			images = window.document.getElementsByTagName( 'img' )
			
			Array.prototype.forEach.call( images, function ( each ) {
				saveImage( req.body.type, each.src )
				.spread( function ( imageHash, imageOriginalPath, imageThumbPath ) {
					article.images.push({
						image: imageOriginalPath,
						imageHash: imageHash,
						imageThumb: imageThumbPath
					})
					
					each.src = imageOriginalPath
				})
			})
			
			setTimeout( function () {
				
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
			}, 1500 )
			
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
		return res.json( article )
	})
	
}


exports.stream = function ( req, res ) {
	var show = req.query.show
	var page = req.query.page
	
	User.findOne( { token: req.token }, function ( err, user ) {
		if( err )
			return res.sendStatus(403)
			
		Blog.find( { $query: { user: user.id }, $orderby: { added: -1 } } )
		.skip( page > 0 ? (( page - 1) * show) : 0).limit( show ).exec()
		.then( function ( result ) {
			return res.json( result )
		})
	})
}

// lets a user delete an article from her stream

exports.delete = function ( req, res ) {
	User.findOne( { token: req.token }, function ( err, user ) {
		if (err)
			return res.json( "Error detelting content: " + error )
			
		if (!user)
			return res.json( "User not found when looking up post." )
			
 		var contentId = mongoose.Types.ObjectId(req.query.id)
			
		Blog.remove( { user: user._id, _id: contentId }, function ( err, blog ) {
			if (err)
				return res.json( "Article was not delted. Error: " + err)
				
			if (!blog)
				return res.json( {
					message: "Could not find any article",
//					"contentId": contentId,
//					"user": user._id
				})
				
			return res.json( "Article, " + blog.title + " was delted" )
		})
	})
}


