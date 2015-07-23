var User = require( '../models/userModel' ),
	Content = require( '../models/contentModel' ),
	secret = require('../config/secretConfig'),
	jwt = require('jsonwebtoken'),
	tokenManager = require('../config/tokenManager'),
	bodyParser = require('body-parser'),
	crypto = require( 'crypto' ),
	bcrypt = require( 'bcrypt-nodejs' ),
	log = require( '../helpers/logger.js' ),
	Q = require( 'q' ),
	getUser = require( '../helpers/get-user' ),
	fs = require( 'fs' ),
	path = require( 'path' ),
	mongoose = require( 'mongoose' ),
	randomKey = require( 'random-key' )

var mailgunApiKey = "key-fe1e0965d13a84409a40129ca218d5e0",
	mailgunDomain = "slipstreamapp.com",
	mailgun = require( 'mailgun-js' )( { apiKey: mailgunApiKey, domain: mailgunDomain })

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
			if ( err || !isMatch ) return res.status( 403 ).json( "Trouble signing in." )

			else 
				return res.status( 200 ).json( { token: user.token, username: user.username, role: user.role } )

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
		email: req.body.email
	})
	
	function postSignup ( object ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			var user = object.user
			
			/*
			Adds the welcome post to the user's read stream.
			*/
			var welcomePostId = mongoose.Types.ObjectId( process.env.WELCOME_POST )
			
			Content.findOne( { _id: welcomePostId } ).exec()
			.then( function ( result ) {
				var newUser = result.users.create({
					user: user._id,
					added: ( new Date() / 1).toFixed(),
					stream: 'read',
					private: true
				})

				result.users.push( newUser )

				result.save()
			})

			user.token = jwt.sign( user, secret.secretToken )
			user.save( function ( err, user ) {
				var welcomeHtml = fs.readFileSync( path.join( __dirname, '../lib/emails/welcome.html' ) )

				var email = {
					from: 'Slipstream <welcome@slipstreamapp.com>',
					to: user.email,
					subject: 'Welcome to Slipstream, ' + user.username,
					html: welcomeHtml.toString()
				}

				mailgun.messages().send( email, function ( err, body ) {
					if ( err ) console.log( err )
				})

				return resolve( user )
			} )
		})
	}
	
	/*
	Check if the username or email has already been used before. 
	*/
	User.findOne( { $or: [ { username: user.username }, { email: user.email } ] } )
	.then( function ( result ) {
		if ( !result ) {
			user.save()
			.then( function () {
				postSignup( { user: user } )
				.then( function ( user ) {
					return res.status( 200 ).json( { token: user.token, username: user.username, role: user.role } )
				})
			} )
			.catch ( function ( error ) {
				console.log( error )
				return res.status( 500 ).json( error.message )
			})
		} else if ( ( !result.username || result.username == null || typeof result.username == undefined) && result ) {
			result.username = user.username,
			result.email = user.email,
			result.joined = ( new Date() / 1000 ).toFixed()

			result.save()
			.then( function ( result ) {
				postSignup( { user: result } )
				.then( function ( user ) {
					return res.status( 200 ).json( { token: user.token, username: user.username, role: user.role } )
				})
			} )
			.catch ( function ( error ) {
				console.log( error )
				return res.status( 500 ).json( error.message )
			})
		} else {
			console.log( "User signed up with that info:" + user.username + " or " + user.email )
			
			if ( result.username === user.username ) return res.status( 500 ).json( "That username is already taken." )
			else return res.status( 500 ).json( "That email has already been used." )
		}
	}, function ( error ) {
		console.error( error )
		
		return res.status( 500 ).json( error.message )
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

/*
Follow a user
*/
exports.follow = function( req, res ) {
	
	getUser( req.token )
	.then( function ( user ) {
		User.findOne( { username: req.body.username } )
		.then( function ( result ) {
			user.follow( result.id )
			.then( function ( result ) {
				if ( !result ) return res.status( 500 ).json( "User could not be followed." )

				return res.status( 200 ).json( "User followed." )
			})
		})
	})
}

/*
Unfollow user.
*/
exports.unFollow = function ( req, res ) {
	
	User.findOne( { token: req.token } )
	.populate( 'following.user' )
	.then( function ( user ) {

		var unfollow = user.following.filter( function ( each ) {
			return each.user.username === req.body.username
		})

		user.unfollow( mongoose.Types.ObjectId( unfollow[0]._id  ) )
		.then( function ( result ) {
			if ( !result || result.length == 0 ) return res.status( 500 ).json( "User could not be unfollowed." )

			return res.status( 200 ).json( "User unfollowed" )
		})
	})
}

/*
Accepts: _id of user.

Returns: username of that user.
*/
exports.getName = function ( req, res ) {
	User.findOne( { _id: req.query.id }, function ( error, user ) {
		if ( error || !user ) return res.status( 500 ).json( error )
		
		return res.status( 200 ).send( user.username )
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
		return Q.Promise( function ( resolve, reject, notify ) {	
			
			var passwordHtml = fs.readFileSync( path.join( __dirname, "../lib/emails/password-reset.html" ) ).toString().split( '<!-- Breakpoint -->' )
			
			var email = {
				from: 'Slipstream <hello@slipstreamapp.com>',
				to: user.email,
				subject: 'Your temporary Slipstream password',
				html: passwordHtml[0] + user.temporaryPassword + passwordHtml[1]
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

exports.isfollowing = function ( req, res ) {
	
	User.findOne( { token: req.token } )
	.populate( 'following.user' )
	.then( function ( result ) {
		var user = result.following.filter( function ( each ) {
			return each.user.username === req.query.username
		})
		
		if ( user.length > 0 ) {
			return res.status( 200 ).json( { isfollowing: true } )
		} else if ( !user || user.length == 0 ) {
			return res.status( 200 ).json( { isfollowing: false } )
		}
		
	})
	.catch( function ( error ) {
		console.log( error )
		res.status( 500 ).json( error.message )
	})
	
}

exports.search = function ( req, res ) {

	User.aggregate([ 
		{ $match: 
			{ $text: { $search: req.query.search } }
		},
		{ $project: {
			username: '$username'
		} }
	]).exec()
	.then( function ( result ) {
		return res.status( 200 ).json( result )
	}, function ( error ) {
		console.error( error )
		return res.status( 500 ).json( "Couldn't search for users." )
	})
}

/*
Adds a user the the waiting list for beta invites.
*/
exports.waitlist = function ( req, res ) {
	var user = new User ({
		email: req.body.email,
		joined: ( new Date() / 1),
		waiting: true
	})
	
	user.save()
	.then( function ( result ) {
		if ( result )
			return res.status( 200 ).json( "We'll get in touch soon. Thanks." )
	}, function ( error ) {
		console.log( error )
		
		return res.status( 500 ).json( "Sorry, maybe that email was used before?" )
	})
}

function checkAdmin ( object ) {
	return Q.Promise( function ( resolve, reject, notify ) {
		User.findOne( { token: object.token, role: 'admin' } )
		.then( function ( user ) {
			if ( !user ) return reject( new Error ( { message: "Permissions don't appear to allow that." } ) )
			
			resolve( user )
		})
		.catch( function ( error ) {
			return reject( error )
		})
	})
}

exports.getwaitlist = function ( req, res ) {
	
	checkAdmin( { token: req.token } )
	.then( function ( user ) {
		User.find()
		.select( 'joined waiting email username' )
		.sort( { waiting: -1 } )
		.sort( { joined: -1 } )
		.exec()
		.then( function ( results ) {
			return res.status( 200 ).json( results )
		}, function ( error ) {
			console.log( error )
			
			return res.status( 500 ).json( error.message )
		})
	})
	.catch( function ( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
}

exports.exportEmails = function ( req, res ) {
	
	checkAdmin( { token: req.token } )
	.then( function ( admin ) {
		
		/*Find the type of email list to get based on the optional query parameter 'type'.*/
		
		if ( !req.query.type ) {
			var query = { username: { $exists: true } }
		} else if ( req.query.type == 'unregistered' ) {
			var query = { username: { $exists: false }, waiting: false }
		} else {
			throw new Error( "That is not a valid type of list to send." )
		}		
		
		User.find( query )
		.select( 'email' )
		.exec()
		.then( function ( results ) {
			var emails = ""
			
			var map = results.map( function ( user ) {
				return emails += user.email + ", " 
			})
			
			return 	res.status( 200)
					.set({"Content-Disposition":'attachment; filename="user-emails-' + new Date() + '.txt"'})
					.send( emails )
			
		}, function ( error ) {
			console.log( error )
			return res.status( 500 ).json( error.message )
		})
	})
	.catch( function( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
}