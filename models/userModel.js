'use strict';

var mongoose = require( 'mongoose-q' )( require( 'mongoose' ) ),
	bcrypt = require('bcrypt-nodejs')

var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	joined: Number,
	token: String
})

// 
// hashes the password so it's not plain text
// 
UserSchema.pre( 'save', function(callback) {
	var user = this

	if (!user.isModified('password'))
		return callback()

	bcrypt.genSalt(5, function( err, salt ) {
		if (err)
			return callback(err)

		bcrypt.hash( user.password, salt, null, function( err, hash ) {
			if (err)
				return callback(err)

			user.password = hash
			callback()
		})
	})
})

// 
// adds verifyPassword method to user schema
// 
UserSchema.methods.verifyPassword = function( password, callback ) {
	bcrypt.compare(password, this.password, function(err, isMatch) {
		if (err)
			return callback(err)

		callback( null, isMatch )
	})
}

UserSchema.methods.validPassword = function( password ) {
	return bcrypt.compare( password, this.password )
}

module.exports = mongoose.model( 'User', UserSchema )