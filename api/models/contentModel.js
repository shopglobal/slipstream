'use strict'

var mongoose = require( 'mongoose' ),
	Q = require( 'q' ),
	URLSlugs = require( 'mongoose-url-slugs' )

/*
This first model is for the subdocuments. These record the instances that a user saves the article. It lacks the article text and is inserted in the main article object within an array.article
*/
var UsersSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	stream: String,
	author: String,
	tags: Array,
	thumb: Number,
	added: Number,
	private: Boolean
})

UsersSchema.methods.togglePrivate = function () {
	return Q.Promise( function ( resolve, reject, notify ) {
		this.private = !this.private

		resolve( this )
	})
}

var ContentSchema = new mongoose.Schema( {
	title: String,		// title of the item
	url: String,		// direc link the non-embed browser version of
	service: String,	// such as youtube
	author: String,		// who made it on the parent site (eg youtube)
	description: String,	// description of content
	text: String, 		// full text of content
	date: String,		// date of post on parent site (youtube, etc)
	images: Array,
	thumbnail: Number,
	views: Number,		// number of views on the parent site
	duration: Number,	// how long it is
	rating: Number,		// the rating of the item if applicable
	likes: Number, 		// number of lives on parent site
	dislikes: Number, 	// number of dislikes on parent site
	shares: Number,		// number of times share on social media/email
	processing: Boolean, // whether the item is still being loaded in the background
	users: [ UsersSchema ],	// includes users sub-document
	flags: {
		adult: {
			type: Boolean,
			default: false
		},
		hidden: {
			type: Boolean,
			default: false
		}
	}
})

/*
The code below saves, deletes or updates items in our third-party search index. It may not be require later when we have a dedicated MongoDB library that we can connect it to, which requires admin rights.
*/
/*ContentSchema.post( 'save', function( callback ) {
	

	})
})*/

ContentSchema.methods.flagAdult = function () {
	this.flags.adult = true
	
	return this.save()
}

ContentSchema.methods.flagHidden = function () {
	this.flags.hidden = true
	
	return this.save()
}

ContentSchema.index( { 'users.tags': 'text' } )

ContentSchema.plugin( URLSlugs( 'title', { field: 'slug' } ) )

module.exports = mongoose.model( 'Content', ContentSchema )