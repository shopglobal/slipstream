'use strict'

var mongoose = require('mongoose'),
	 UserSchema = require('./userModel')

//
// schema for the blog object in database
//
var BlogSchema = new mongoose.Schema ( {
	user: String,
	title: String,
	text: String,
	image: String,
	imageThumb: String,
	imageHash: String,
	added: Number
} )

// 
// get the user who is saving the article
//
//BlogSchema.pre( 'save', function ( req, callback ) {
//	var blog = this
//
//	UserSchema.findOne( { token: req.body.token }, function ( err, user ) {
//		blog.user = user._id
//		callback()
//	})
//})

module.exports = mongoose.model( 'Blog', BlogSchema )