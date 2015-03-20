var mongoose = require( 'mongoose-q' )( require( 'mongoose' ) )

var BetakeySchema = new mongoose.Schema( {
	key: String,
	added: Number,
	creator: String,
	used: Number,
	user: String
})

module.exports = mongoose.model( 'Betakey', BetakeySchema )