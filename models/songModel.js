var mongoose = require( 'mongoose' )

var MusicSchema = new mongoose.Schema({
	user: String,
	artist: String,
	album: String,
	title: String,
	songId: String,
	url: String,
	length: Number,
	rating: Number,
	views: Number,
	image: String,
	service: String,
	added: String,
	date: String,
	tags: Array,
	userTags: Array
})

module.exports = mongoose.model( 'Song', MusicSchema )