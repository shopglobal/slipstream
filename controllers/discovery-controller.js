var Content = require( '../models/contentModel' ),
	Q = require( 'q' )

exports.popular = function( req, res) {
	
	function getContent () {
		return Q.Promise( function ( resolve, reject, notify ) {
		
		var show = parseInt( req.query.show ),	// the number of items to show per page
			page = req.query.page,	// the current page being asked for
			stream = req.params.stream,	// the type of content to get
			skip = ( page > 0 ? (( page - 1 ) * show ) : 0 ), // amount to skip
			testNum = 3
		
		console.log( show + " " + skip + " " + page )
			
		Content.aggregate( [
			{ $unwind: '$users' },
			{ $match: { 'users.stream': stream } },
			{ $group: { 
				_id: '$_id',
				title: { $first: '$title' },
				description: { $first: '$description' },
				images: { $first: '$images' },
				stream: { $first: '$users.stream' },
				text: { $first: '$text' },
				url: { $first: '$url' },
				saveCount: { $sum: 1 } } 
			},
			{ $sort: { saveCount: -1 } },
			{ $skip: skip },
			{ $limit: show }
		] )
		.exec()
		.then( function ( results ) {
			resolve( results )
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