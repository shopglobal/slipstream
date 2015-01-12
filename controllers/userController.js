var User = require('../models/userModel.js')

// 
// create a new user with POST
// 
exports.postUsers = function ( req, res ) {
	var user = new User({
		username: req.body.username,
		password: req.body.password,
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
	User.findOne( { _id: req.user._id }, function( err, users) {
		if (err)
			res.send(err)

		res.json(users)
	})
}