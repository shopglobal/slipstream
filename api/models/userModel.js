'use strict';

var mongoose = require( 'mongoose' ),
	bcrypt = require('bcrypt-nodejs'),
	Q = require( 'q' )

var Follows = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	added: Number
})

var UserSchema = new mongoose.Schema({
	username: {
		type: String,
		sparse: true,
		unique: true
	},
	password: String,
	tempPassword: String,
	email: {
		type: String,
		required: true,
		unique: true
	},
	joined: {
		type: Number,
		default: ( new Date() / 1000 ).toFixed()
	},
	token: String,
	role: String,
	permissions: Array,
	waiting: Boolean,
	following: [ Follows ]
})

UserSchema.index( { username: 'text', sparse: true } )

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
	
	var origPassword = this.password ? this.password : ''
	
	var tempPassword = this.tempPassword ? this.tempPassword : ''
	
	bcrypt.compare( password, origPassword, function( err, isMatch ) {
		if ( err || !isMatch ) {
			bcrypt.compare( password, tempPassword, function ( err, isMatch ) {
				if ( err ) return callback( err )
				
				return callback( null, isMatch )
			})
		} else if ( isMatch ) {
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
	var follow = this.following.push( { 
		user: id,
		added: ( new Date() / 1 ).toFixed()
	})
		
	return this.save()
}

/*
Unfollow a user.
*/
UserSchema.methods.unfollow = function( id ) {
	this.following.pull( id )

	return this.save()
}

module.exports = mongoose.model( 'User', UserSchema )