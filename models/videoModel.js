'use strict'

var mongoose = require( 'mongoose-q' )( require( 'mongoose' ) )

var VideoSchema = new mongoose.Schema ( {
	user: String,
	title: String,
	url: String,
	videoId: String, 	// such as youtube ID
	service: String, 	// such as "youtube"
	image: String,
	imageThumb: String,
	imageHash: String,	// TODO: save image
	description: String,
	text: String,
	added: Number,		// the date the user added it to slipstream
	date: Number, 		// the date the video was published
	author: String,		// the creator of the video
	views: Number,		// the number of views on the video
	duration: String,	// duration of video
	rating: Number		// video rating
} )

module.exports = mongoose.model( 'Video', VideoSchema )