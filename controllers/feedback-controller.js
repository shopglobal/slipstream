var builder = require( 'xmlbuilder' ),
	Feedback = require( '../models/feedback-model' ),
	_ = require( 'underscore' ),
	fs = require( 'fs' ),
	getUser = require( '../helpers/get-user' ),
	User = require( '../models/userModel' ),
	Q = require( 'q' ),
	path = require( 'path' ),
	knox = require( 'knox' )	
	
var s3Client = knox.createClient( {
	key: process.env.PLANTER_S3_ACCESS_KEY_ID,
	secret: process.env.PLANTER_S3_SECRET_ACCESS_KEY,
	bucket: process.env.PLANTER_BUCKET_NAME
} )

exports.add = function ( req, res ) {
	
	var xmlOutput = path.join( __dirname, '../build/feedback.xml' )

	function makeFeedback( user ) {
		return Q.Promise( function( resolve, reject, notify ) {
			
			User.findOne( { _id: user._id } ).exec()
			.then( function ( result ) {
				var username = result.email
				
				console.log( req.body )
				
				var feedback = new Feedback({
					name: req.body.feedback.comment.substring( 0, 50 ),
					description: req.body.feedback.comment,
					requested_by: username,
					created_at: ( new Date() / 1 ).toFixed(),
					story_type: 'bug',
					estimate: 1
				})

				feedback.save( function ( error, result ) {
					resolve( result )
				})

			})
			
		})
	}
	
	function createXml( result ) {
		return Q.Promise( function ( resolve, reject, notify ) {
			
			Feedback.find( {} ).exec()
			.then( function ( results ) {
			
				var xml = builder.create( "external_stories", { encoding: 'UTF-8' } )
				
				results.forEach( function( each ) {
					xml.ele( 'external_story' )
						.ele( 'external_id', each._id.toString() )
						.insertAfter( 'name', each.name )
						.insertAfter( 'description', each.description )
						.insertAfter( 'requested_by', each.requested_by )
						.insertAfter( 'created_at', each.created_at )
						.insertAfter( 'story_type', each.story_type )
						.insertAfter( 'estimate', { type: 'intiger' }, each.estimate )
				})
				
				xmlString = xml.end( { pretty: true, indent: '	', offset: 0, newline: '\n' } )
				resolve( xmlString )
								
			})
		})
	}
	
	getUser( req.token )
	.then( makeFeedback )
	.then( createXml )
	.then( function( xml ) {
		var xmlParts = xml.split( 'external_stories', 2 )
		
		var xmlFinal = xmlParts[0] + 'external_stories type="array"' + xmlParts[1] + 'external_stories >'
		
		fs.writeFile( xmlOutput, xmlFinal, function( err ) {
			if ( err ) return res.status( 500 ).json( "Could not save feedback." )
			
			var uploader = s3Client.putFile( xmlOutput, '/feedback.xml', function ( err, result ) {
				if ( err ) console.log( err )
				
				console.log( uploader.url )
				
				return res.status( 200 ).json( "Feedback sent. Thank you." )
			})
			
		})
	})
	.catch( function ( error ) {
		console.log( error )
		
		return res.status( 500 ).json( "Could not save feedback" )
	})
	
}