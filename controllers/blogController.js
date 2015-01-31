var fs = require('fs'),
	path = require('path'),
	User = require('../models/userModel.js'),
	Blog = require('../models/blogModel.js'),
	tokenManager = require('../config/tokenManager'),
	article = require('article'),
	async = require('async'),
	request = require('request'),
	mongoose = require('mongoose'),
	saveImage = require( '../helpers/save-image' )

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	
	User.findOne( { token: req.token }, function ( err, user ) {
		blogUrl = req.query.url

		request( blogUrl ).pipe( article( blogUrl, function ( err, data ) {
			if (err)
				return res.json( err )

			if ( !data )
				return res.json( "There's no data for some reason. Sorry." ) 
         
			// runs function and save info to database
			
			saveImage( data, function ( imageHash, imageFileOriginal, imageFileThumb ) {
				var blog = new Blog({
					user: user._id,
					title: data.title,
					text: data.text,
					image: imageFileOriginal,
					imageThumb: imageFileThumb,
					imageHash: imageHash,
					url: blogUrl,
					added: ( new Date() / 1000 ).toFixed()
				})

				blog.save( function ( err, blog ) {
					return res.json( blog )
				})	
			})
		}))
	})
}

// gets items form the articles database based on the user asking

exports.stream = function ( req, res ) {
	User.findOne( { token: req.token }, function ( err, user ) {
		if( err )
			return res.sendStatus(403)
			
		Blog.find( { $query: { user: user.id }, $orderby: { added: -1 } },
		function ( err, blogs ) {
			if( err )
				return res.json( "No article content found, or something went wrong." )
			
			return res.json( blogs )
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


