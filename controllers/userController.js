var User = require('../models/userModel.js')

// 
// create a new user with POST
// 
exports.postUsers = function ( req, res ) {
	var user = new User({
		username: req.body.username,
		password: req.body.password,
		email: req.body.email,
		joined: ( new Date() / 1000 ).toFixed()
	})

	user.save(function( err ) {
		if (err)
			return res.send( err )

		res.json( { message: "New user added!" } )
	})
}

// 
// get a user
// 
exports.getUser = function( req, res ) {
	User.findOne( { _id: req.user._id }, function( err, user) {
		if (err)
			res.send(err)

		res.json(user)
	})
}

// 
// delete a user
// 
exports.deleteUser = function( req, res ) {
	User.remove( { _id: req.user._id }, function( err, user) {
		if (err)
			res.send(err)

		res.json("User removed.")
	})
}