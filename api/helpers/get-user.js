var User = require( '../models/userModel' )

module.exports = function getUser ( token ) {
	return new Promise( function ( resolve, reject ) {
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
