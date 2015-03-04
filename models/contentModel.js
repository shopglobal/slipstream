'use strict'

var mongoose = require( 'mongoose-q' )( require( 'mongoose' ) )

var ContentSchema = new mongoose.Schema( {
	user: String,		// ther user._id that this item belongs to
	stream: String,		// the stream it will apppear in for that user
	title: String,		// title of the item
	url: String,		// direc link the non-embed browser version of
	service: String,	// such as youtube
	author: String,		// who made it on the parent site (eg youtube)
	tags: Array,
	image: String, 		// full-size image derived from content, if any
	imageThumb: String,	// path to thumbnail version
	imageHash: String,	// md5 hash of the image
	description: String,	// description of content
	text: String, 		// full text of content
	snippet: String,	// text to be used in preview
	added: Number, 		// date content was added in JS time
	date: String,		// date of post on parent site (youtube, etc)
	views: Number,		// number of views on the parent site
	duration: Number,	// how long it is
	rating: Number,		// the rating of the item if applicable
	likes: Number, 		// number of lives on parent site
	dislikes: Number, 	// number of dislikes on parent site
	shares: Number		// number of times share on social media/email
})

module.exports = mongoose.model( 'Content', ContentSchema )