var mongoose = require( 'mongoose' )

var BetakeySchema = new mongoose.Schema( {
	key: String,
	added: Number,
	creator: String,
	used: Number,
	user: String,
	sent: Boolean
})

BetakeySchema.method( 'toggleSent', function () {
	this.sent = !this.sent 
	
	return this.save()
})

module.exports = mongoose.model( 'Betakey', BetakeySchema )