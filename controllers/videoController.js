var User = require( '../models/userModel' ),
	mongoose = require( 'mongoose' ),
	bodyParser = require( 'body-parser' ),
	youtube = require( 'youtube-api' )

// method for adding a video

exports.add = function ( req, res ) {
	
	// check sign in and get user information as 'user' 
	
	User.findOne( { token: req.token }, function ( err, user ) {
		if ( err )
			return res.json( {
				status: "error",
				message: "Error looking up user to add video. Are you signed in? Err: " + err
			})
		
		videoUrl = req.body.url
		
		
	}
}