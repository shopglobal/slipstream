var Content = require( '../models/contentModel' ),
	Q = require( 'q' ),
	User = require( '../models/userModel' )

exports.popular = function( req, res) {
	
	function getContent () {
		return Q.Promise( function ( resolve, reject, notify ) {
		
		var show = parseInt( req.query.show ),	// the number of items to show per page
			page = req.query.page,	// the current page being asked for
			stream = req.params.stream,	// the type of content to get
			skip = ( page > 0 ? (( page - 1 ) * show ) : 0 ) // amount to skip
		
		console.log( "Discover: " + show + " " + skip + " " + page )
			
		Content.aggregate( [
			{ $unwind: '$users' },
			{ $match: { 'users.stream': stream } },
			{ $match: { $or: [ { 'users.private': false }, { 'users.private': { $exists: false } } ] } },
			{ $match: { $or: [ { 'flags.hidden': false }, { 'flags.hidden': { $exists: false } } ] } },
			{ $match: { $or: [ { 'flags.adult': false }, { 'flags.adult': { $exists: false } } ] } },
			{ $sort: { 'users.added': 1 } },
			{ $group: { 
				_id: '$_id',
				title: { $first: '$title' },
				description: { $first: '$description' },
				images: { $first: '$images' },
				thumbnail: { $first: '$thumbnail' },
				user: { $first: '$users.user' },
				stream: { $first: '$users.stream' },
				text: { $first: '$text' },
				added: { $first: '$users.added' },
				url: { $first: '$url' },
				slug: { $first: '$slug' },
				saveCount: { $sum: 1 }
			} },
			{ $sort: { saveCount: -1, added: -1 } },
			{ $skip: skip },
			{ $limit: show }
		] )
		.exec()
		.then( function ( results ) {
			User.populate( results, { path: 'user', select: 'username' }, function ( error, results ) {
				resolve( results )
			})
		}, function ( error ) {
			reject( error )
		})
		
		})
	}
	
	getContent()
	.then( function( results ) {
		return res.status( 200 ).json( results )
	})
	.catch( function( error ) {
		console.log( error )
		return res.status( 500 ).json( error.message )
	})
	
}