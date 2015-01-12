var User = require('../models/userModel.js')

// 
// create a new user with POST
// 
exports.postUsers = function ( req, res ) {
	var user = new User({
		username: req.body.username,
		password: req.body.password
	})

	user.save(function( err ) {
		if (err)
			res.send( err )

		res.json({ message: "New user added!" })
	})
}

// 
// GET endpoint for /api/users
// 
exports.getUsers = function( req, res ) {
	User.find( function( err, users) {
		if (err)
			res.send(err)

		res.json(users)
	})
}