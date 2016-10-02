var User = require( '../models/userModel' ),
	Q = require( 'q' )

module.exports = function getUser ( token ) {
	return Q.Promise( function ( resolve, reject, notify ) {
		if ( !token ) return reject( new Error( "No user token given." ) )

		User.findOne( { token: token } ).exec()
		.then( function ( data ) {
			if ( !data )
				reject( new Error( "There was a problem getting the user. No user with that token." ) )
			
			resolve( data )
		}, function ( error ) {
			reject( new Error( error ) )
		})
	})
}