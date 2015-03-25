var User = require( '../models/userModel' ),
	secret = require('../config/secretConfig'),
	jwt = require('jsonwebtoken'),
	tokenManager = require('../config/tokenManager'),
	bodyParser = require('body-parser'),
	crypto = require( 'crypto' ),
	bcrypt = require( 'bcrypt-nodejs' ),
	log = require( '../helpers/logger.js' ),
	Q = require( 'q' ),
	Betakey = require( '../models/betakey-model' ),
	getUser = require( '../helpers/get-user' )

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
			return res.status( 403 ).json( "Error logging in with those credentials." )
		}

		user.verifyPassword( req.body.password, function( err, isMatch ) {
			if (err)
				return res.status( 500 ).json( err )

			if ( !isMatch )
				return res.status( 403 ).send( "Your password wasn't authenticated." )

			else 
				return res.status( 200 ).json( { token: user.token, id: user._id } )

		} )
		
	}, function ( error ) {
		log.error( error )
		return res.status( 500 ).send( error.message )
	})
}

/*
ENDPOINT: /api/signup

METHOD: POST

DESCRIPTION: Accepts email, password, username and beta-key
*/
exports.signUp = function ( req, res ) {
	var user = new User({
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		joined: ( new Date() / 1000 ).toFixed()
	})
	
	function betakeyCheck () {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			Betakey.findOne( { key: req.body.betakey }, function ( err, betakey ) {
				if ( err || !betakey ) return reject( new Error( "Could not find that key" ) )
				
				if ( betakey.used ) return reject( new Error( "Sorry, beta key aleady used." ) )
				
				betakey.update(
					{ used: ( new Date() / 1 ).toFixed(), user: req.body.email } )
				.exec()
				.then( function ( result ) {
					resolve( result )
				}, function ( error ) {
					reject( new Error( "Error using beta key. Try again." ) )
				})
			})
		})
	}
	
	betakeyCheck()
	.then( function ( betakey ) {
		user.save(function( err, user ) {
			if (err)
				return res.status( 500 ).json( err )

			user.token = jwt.sign(user , secret.secretToken )
			user.save( function ( err, user ) {
				return res.status( 200 ).json( user )
			} )
		})		
	})
	.catch( function ( error ) {
		console.error( error )
		
		res.status( 500 ).json( error.message )
	})
}

//
// return all of a users information, except password, etc
//
exports.getUser = function( req, res ) {
	User.findOne( { token: req.token }, function( err, user ) {
		if ( err || !user )
			return res.status( 500 ).json( "Error getting that user info." )

		return res.status( 200 ).json({
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
	User.findOneAndRemove( { token: req.token } ).exec()
	.then( function ( data ) {
		return res.status( 200 ).json( "User removed. Bye." )		
	}, function ( error ) {
		console.log( error )		
		return res.status( 500 ).json( error )		
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
				{ tempPassword: password.encryptedPassword } 
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
		return res.status( 500 ).send( error.message )
	})
	
}

/*
ENDPOINT: /api/user/password/change

ACCEPTS: oldPassword and newPassword

DESCRIPTION: Confirms a users old password and sets a new password.
*/
exports.changePassword = function ( req, res ) {
	
	function verifyOldPassword ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			user.verifyPassword( req.body.oldPassword, function( err, isMatch ) {
				if ( err || !isMatch )
					return res.status( 403 ).send( { message: "Please verify your old password." } )

				else 
					resolve( user )
			} )
		})
	}
	
	function generatePassword ( user ) {
		var userObj = {
			id: user._id
		}
		
		return Q.Promise( function ( resolve, reject, notify ) {	
			bcrypt.genSalt( 5, function( err, salt ) {
				if (err)
					reject( new Error( "Could not generate temporary password salt." ) )

				bcrypt.hash( req.body.newPassword, salt, null, function( err, hash ) {
					if (err)
						return reject( new Error( "Could not hash new temporary password." ) )

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
	.then( verifyOldPassword )
	.then( generatePassword )
	.then( savePassword )
	.then( function ( user ) {
		return res.json( "Your password was changed." )
	}, function ( error ) {
		log.error( error )
		return res.status( 500 ).json( error.message )
	})
}