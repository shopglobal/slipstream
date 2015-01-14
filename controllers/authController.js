// var passport = require('passport'),
// 	LocalStrategy = require('passport-local').Strategy,
// 	User = require('../models/userModel.js')


// passport.use( new LocalStrategy(
// 	function( username, password, callback ) {
// 		User.findOne( { username: username }, function( err, user ) {
// 			if (err)
// 				return callback(err)

// 			if (!user) 
// 				return callback( null, false, { message: "Unkown user, " + username } )

// 			user.verifyPassword( password, function ( err, isMatch ) {
// 				if (err)
// 					return callback(err)

// 				// if the passwords don't match
// 				if (isMatch) 
// 					return callback( null, user )

// 				else 
// 					return callback( null, false, { message: "Sign in  unsuccessful" } )
// 			})
// 		})
// 	}
// ))


// // 
// // passport.use( new BasicStrategy(
// // 	function( username, password, callback ) {
// // 		User.findOne( { username: username }, function( err, user ) {
// // 			if (err)
// // 				return callback(err)

// // 			if (!user) 
// // 				return callback( null, false )

// // 			user.verifyPassword( password, function ( err, isMatch ) {
// // 				if (err)
// // 					return callback(err)

// // 				// if the passwords don't match
// // 				if (!isMatch) 
// // 					return callback( null, false )

// // 				return callback( null, user )
// // 			})
// // 		})
// // }))

// exports.isAuthenticated = passport.authenticate( 'local' )