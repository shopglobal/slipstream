var Betakey = require( '../models/betakey-model' ),
	randomKey = require( 'random-key' ),
	getUser = require( '../helpers/get-user' ),
	Q = require( 'q' )

exports.add = function ( req, res ) {
	
	function makeKeys ( user ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			var betakeys = []
			
			if ( user.role != 'admin' || !user.role ) return reject( new Error( "You don't have permission for that." ) )

			for ( i = 0; i < req.query.amount; i ++ ) {
				var betakey = new Betakey( {
					key: randomKey.generateBase30( 12 ),
					added: ( new Date() / 1 ).toFixed(),
					creator: user.email
				} )

				.save( function ( err, result, row ) {
					console.log( i + " " + result.key )
					
					betakeys.push( result.key )
					
					if ( betakeys.length == req.query.amount ) {
						resolve( betakeys )
					}
				})
			}
		})
	}
	
	getUser( req.token )
	.then( makeKeys )
	.then( function ( betakeys ) {
		console.log( "Created " + req.query.amount + " beta keys." )
		
		return res.status( 200 ).json( betakeys )
	})
	.catch( function( error ) {
		console.error( error )
		
		return res.status( 403 ).json( error.message )
	})
}