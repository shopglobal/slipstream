'use strict';

var LocalStrategy = require('passport-local').Strategy,
	User = require('../models/userModel')

module.exports = function( passport ) {

	passport
		.use(passport.initialize())
		.use(passport.session( { secret: "3THYez9jftGnkJlslDO4Ig7lKkJH7TSAzFobtSUVhSA="}))

	// 
	// setup for persistent login sessions
	// 
	passport.serializeUser( function ( user, callback ) {
		callback( null, user._id )
	})

	passport.deserializeUser( function ( id, callback ) {
		User.fincallback( { _id: id }, function( err, user ) {
			callback( err, user )
		})
	})

	// passport.use('local-login', new LocalStrategy(
	// 	function( username, password, callback ) {
	// 		User.findOne( { username: username }, function( err, user ) {
	// 			if (err)
	// 				return callback(err)

	// 			if (!user) 
	// 				return callback( null, false, { message: "Unkown user, " + username } )

	// 			user.verifyPassword( password, function ( err, isMatch ) {
	// 				if (err)
	// 					return callback(err)

	// 				// if the passwords match
	// 				if (!isMatch) 
	// 					return callback( null, false )

	// 				else 
	// 					return callback( null, user )
	// 			})
	// 		})
	// 	}
	// ))

	passport.use('local-login', new LocalStrategy(
	    function( username, password, callback ) { // callback with email and password from our form
	        User.findOne( { username : username }, function ( err, user ) {
	            // if there are any errors, return the error before anything else
	            if (err)
	                return callback(err);

	            // if no user is found, return the message
	            if (!user)
	                return callback(null, false)

	            // if the user is found but the password is wrong
	            if (!user.validPassword(password))
	                return callback(null, false)

	            // all is well, return successful user
	            return callback(null, user);
	        });
    	}
    ) )

}
