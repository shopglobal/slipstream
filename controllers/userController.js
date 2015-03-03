var User = require( '../models/userModel' ),
	secret = require('../config/secretConfig'),
	jwt = require('jsonwebtoken'),
	tokenManager = require('../config/tokenManager'),
	bodyParser = require('body-parser'),
	crypto = require( 'crypto' ),
	bcrypt = require( 'bcrypt-nodejs' ),
	log = require( '../helpers/logger.js' ),
	Q = require( 'q' )

var mailgunApiKey = "key-fe1e0965d13a84409a40129ca218d5e0",
	mailgunDomiain = "sandboxe7a1a487792a445785ebe90604e4b5cb.mailgun.org",
	mailgun = require( 'mailgun-js' )( { apiKey: mailgunApiKey, domain: mailgunDomiain })

//
// check the username and password and returns token if verified
//
exports.login = function ( req, res ) {
	User.findOne( { username: req.body.username } )
	.exec()
	.then( function ( user ) {
		if ( !user ) {
			log.error( { username: req.body.username }, "Error logging in." )
			return log.error( { user: req.body.user }, "User not found at login" )
		}

		user.verifyPassword( req.body.password, function( err, isMatch ) {
			if (err)
				return res.status( 500 ).send( { error: error.message } )

			if ( !isMatch )
				return res.status( 403 ).send( { message: "Your password wasn't authenticated." } )

			else {
				if (user) {
					res.json({
						 token: user.token
					})
				} else {
					return res.status( 500 ).send( { error: "Something went wrong." } )
				}
			}

		} )
		
	}, function ( error ) {
		log.error( error )
		return res.status( 500 ).send( { error: error.message } )
	})
}

//
// new user sign up
//
exports.signUp = function ( req, res ) {
	var user = new User({
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		joined: ( new Date() / 1000 ).toFixed()
	})

	user.save(function( err, user ) {
		if (err)
			return res.send( err )

		user.token = jwt.sign(user , secret.secretToken )
		user.save( function ( err, user ) {
			res.json( user )
		} )
	})
}

//
// return all of a users information, except password, etc
//
exports.getUser = function( req, res ) {
	User.findOne( { token: req.token }, function( err, user ) {
		if (err)
			res.send(err)

		res.json({
			id: user._id,
			username: user.username,
			email: user.email,
			joined: user.joined
		})
	})
}

//
// delete a user
//
exports.deleteUser = function( req, res ) {
	User.remove( { token: req.token }, function( err, user) {
		if (err)
			res.send(err)

		res.json("User removed.")
	})
}

//
// check that the request has an authorization header and attach it to
// the req as req.token
//
exports.checkAuthorization = function( req, res, callback ) {
	var bearerToken,
		bearerHeader = req.headers['authorization']

	if (typeof bearerHeader !== 'undefined') {
		var bearer = bearerHeader.split(' ')
		bearerToken = bearer[1]
		req.token = bearerToken
		return callback()
	} else {
		log.error( { headers: req.headers }, "Token authorization failed." )
		return res.status( 500 ).send( "Token authorization failed." )
	}
}

/*
This function updates a users password and emails it to them.

TODO: Makes this send a password update link with temporary password as it's own field in the user model. Also, it generates the password before even checking if the email matches a user, which is not efficient. Add a check first.
*/
exports.sendPasswordReset = function ( req, res ) {
	
	function updateUser ( password ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			User.findOneAndUpdate( 
				{ email: req.query.email },
				{ password: password.encryptedPassword } 
			).exec()
			.then( function ( user ) {
				if ( !user )
					reject( new Error( "We couldn't find a user for that email address: " + req.query.email ) )

				var updatedUser = {
					email: user.email,
					username: user.username,
					temporaryPassword: password.temporaryPassword
				}

				resolve( updatedUser )
			}, function ( error ) {
				reject( new Error( "Error looking up user for password reest" ) )
			})
		})
	}
	
	function emailTemporaryPassword ( user ) {
		Q.Promise( function ( resolve, reject, notify ) {	
			var email = {
				from: 'SlipStream <noahgray@me.com>',
				to: user.email,
				subject: 'Your temporary SlipStream password',
				text: "We've received a request to reset your password. Here is your new temporary password: " + user.temporaryPassword + "<br /><br /> Your username is: " + user.username
			}

			mailgun.messages().send( email, function ( err, body ) {
				if ( err )
					reject( new Error( "There was a problem sending the password reset email: " + err ) )
					
				resolve( body )
			})
		})
	}
	
	function createPassword () {	
		return Q.Promise( function ( resolve, reject, notify ) {
			
			var password = {}
			
			password.temporaryPassword = crypto.randomBytes(8).toString( 'hex' )
			
			bcrypt.genSalt( 5, function( err, salt ) {
				if (err)
					reject( new Error( "Could not generate temporary password salt." ) )

				bcrypt.hash( password.temporaryPassword, salt, null, function( err, hash ) {
					if (err)
						reject( new Error( "Could not hash new temporary password." ) )

					password.encryptedPassword = hash
						
					resolve( password )
				})
			})
		})
	}
	
	createPassword()
	.then( updateUser )
	.then( emailTemporaryPassword )
	.then( function ( body ) {
		return res.status( 200 ).send( "A reset email was sent." )
	}, function ( error ) {
		log.error( error, "Password reset error" )
		return res.status( 500 ).send( { error: error.message } )
	})
	
}

exports.changePassword = function ( req, res ) {
	
	function generatePassword ( user ) {
		var userObj = {
			id: user
		}
		
		return Q.Promise( function ( resolve, reject, notify ) {	
			bcrypt.genSalt( 5, function( err, salt ) {
				if (err)
					reject( new Error( "Could not generate temporary password salt." ) )

				bcrypt.hash( req.body.newPassword, salt, null, function( err, hash ) {
					if (err)
						reject( new Error( "Could not hash new temporary password." ) )

					userObj.password = hash

					resolve( userObj )
				})
			})
		})
	}
	
	function savePassword ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {	
			User.findOneAndUpdate( 
				{ _id: user.id },
				{ password: user.password } 
			).exec()
			.then( function ( user ) {
				if ( !user )
					reject( new Error( "Could not save the new password." ) )
				
				resolve ( user )
			}, function ( error ) {
				reject( new Error( "Could not save the new password." ) )	
			})
		})
	}	
	
	getUser( req.token )
	.then( generatePassword )
	.then( savePassword )
	.then( function ( user ) {
		return res.json( "The password was changed for user." )
	}, function ( error ) {
		log.error( error )
		return res.status( 500 ).send( { error: error.message } )
	})
}