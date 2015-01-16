var User = require('../models/userModel.js'),
	Blog = require('../models/blogModel.js'),
    tokenManager = require('../config/tokenManager'),
	article = require('article'),
	request = require('request'),
    bodyParser = require('body-parser')

// adds and item to the articles database with the user's id.

exports.add = function ( req, res ) {
	console.log( "Token: " + req.token )

	User.findOne( { token: req.token }, function ( err, user ) {
		blogUrl = req.body.url

		request( blogUrl ).pipe( article( blogUrl, function ( err, data ) {
			if (err)
				return res.json( err )

			if ( !data )
				return res.json( "There's no data for some reason. Sorry." )

			var blog = new Blog({
				user: user._id,
				title: data.title,
				text: data.text,
				image: data.image,
				added: ( new Date() / 1000).toFixed()
			})

			blog.save( function ( err, blog ) {
				return res.json( blog )
			})

		}))
	})
}

// gets items form the articles database based on the user asking

exports.stream = function ( req, res ) {
	User.findOne( { token: req.token }, function ( err, user ) {
		if( err )
			return res.sendStatus(403)
			
		Blog.find( { user: user._id }, function ( err, blogs ) {
			if( err )
				return res.json( "No article content found, or something went wrong." )
			
			return res.json( blogs )
		})
	})
}
