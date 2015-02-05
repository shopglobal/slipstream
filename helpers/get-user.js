var User = require( '../models/userModel' ),
	Q = require( 'q' )

module.exports = function getUser ( token ) {
	var deferred = Q.defer()
	
	User.findOne( { token: token }, function ( err, data ) {
		deferred.resolve( data._id )
	})
	
	return deferred.promise
}