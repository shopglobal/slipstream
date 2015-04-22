'use strict';

var mongoose = require( 'mongoose-q' )( require( 'mongoose' ) ),
	bcrypt = require('bcrypt-nodejs'),
	Q = require( 'q' ),
	textSearch = require( 'mongoose-text-search' )

var Follows = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	added: Number
})

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
	tempPassword: String,
	email: {
		type: String,
		required: true,
		unique: true
	},
	joined: Number,
	token: String,
	role: String,
	permissions: Array,
	following: [ Follows ]
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

/* 
 adds verifyPassword method to user schema
*/
UserSchema.methods.verifyPassword = function( password, callback ) {
	
	var tempPassword = this.tempPassword
	
	bcrypt.compare(password, this.password, function( err, isMatch ) {
		if (err) return callback(err)
			
		if ( !isMatch ) {
			bcrypt.compare( password, tempPassword, function ( err, isMatch ) {
				if ( err ) return callback( err )
				
				return callback( null, isMatch )
			})
		} else {
			return callback( null, isMatch )
		}
	})
}

UserSchema.methods.validPassword = function( password ) {
	return bcrypt.compare( password, this.password )
}

/*
Follow a user.
*/
UserSchema.methods.follow = function( id ) {
	var user = this
	
	return Q.Promise( function ( resolve, reject, notify ) {
		var follow = user.following.push( { 
			user: id,
			added: ( new Date() / 1 ).toFixed()
		})
		
		user.save()
		
		resolve( follow )
	})
}

/*
Unfollow a user.
*/
UserSchema.method( 'unfollow', function unfollow ( id ) {
	this.following.remove( id )

	return this.save()
})

module.exports = mongoose.model( 'User', UserSchema )