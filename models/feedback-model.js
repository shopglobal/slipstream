var mongoose = require( 'mongoose-q' )( require( 'mongoose') )

var FeedbackSchema = new mongoose.Schema({
	name: String,
	description: String,
	requested_by: String,
	created_at: Number,
	story_type: String,
	estimate: Number
})

module.exports = mongoose.model( 'Feedback', FeedbackSchema )