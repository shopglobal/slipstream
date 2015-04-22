/*This updates all the `users` sub-documents in the `Content` collection to be Mongo ObjectIDs instead of just strings.*/

var mongoose = require( 'mongoose' )

mongoose.connect( process.env.MONGOLAB_URI )

var Content = require( './models/contentModel' )

mongoose.connection.once( 'open', function () {

	Content.find()
	.then( function ( results ) {
		results.forEach( function ( eachParent ) {
			eachParent.users.forEach( function ( each, index ) {
				var userid = mongoose.Types.ObjectId( each.user ),
					oldUserid = mongoose.Types.ObjectId( each.id )
				
				Content.update( 
					{ 'users._id': each.id },
					{ $set: { 'users.$.user': userid } },
				function ( error, result ) {
					console.log( result )
				})
			})
		})
	})
	.then( function ( result ) {
		console.log( "Appears done." )
	})
	.catch( function ( error ) {
		console.error( error )
	})
})