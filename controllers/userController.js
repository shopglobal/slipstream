var User = require('../models/userModel.js'),
	secret = require('../config/secretConfig'),
	jwt = require('jsonwebtoken'),
	tokenManager = require('../config/tokenManager')

// 
// check the username and password and returns token if verified
// 
exports.login = function ( req, res ) {
	User.findOne( { username: req.body.username }, function ( err, user ) {
		if (err)
			return res.json( { message: "Something went wrong " } )

		user.verifyPassword( req.body.password, function( err, isMatch ) {
			if (err)
				return res.json( { message: err } )

			if ( !isMatch )
				return res.json( { message: "Your password wasn't authenticated." } )

			else {
				if (user) {
					res.json({
						 token: user.token
					})
				} else {
					return res.json( { message: "Something went wrong." } )
				}
			}

		} )
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
// get a user
// 
exports.getUser = function( req, res ) {
	User.findOne( { token: req.token }, function( err, user ) {
		if (err)
			res.send(err)

		res.json(user)
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

exports.checkAuthorization = function( req, res, callback ) {
	var bearerToken,
		bearerHeader = req.headers['authorization']

	if (typeof bearerHeader !== 'undefined') {
		var bearer = bearerHeader.split(' ')
		bearerToken = bearer[1]
		req.token = bearerToken
		callback();
	} else {
		res.sendStatus(403)
	}
}