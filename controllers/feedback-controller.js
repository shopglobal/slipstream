var builder = require( 'xmlbuilder' ),
	Feedback = require( '../models/feedback-model' ),
	_ = require( 'underscore' ),
	fs = require( 'fs' ),
	getUser = require( '../helpers/get-user' ),
	User = require( '../models/userModel' ),
	Q = require( 'q' ),
	path = require( 'path' ),
	Sftp = require( 'sftp-upload' )

exports.add = function ( req, res ) {
	
	var xmlOutput = path.join( __dirname, '../logs/feedback/feedback.xml' )

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
					story_type: 'feature',
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
			
				var xml = builder.create( "external_stories", { encoding: 'UTF-8' } ).att( 'type', 'array' )
				
				results.forEach( function( each ) {
					var dateObj = new Date( each.created_at )
					
					var dateCreated = dateObj.getFullYear() + "/" + dateObj.getUTCMonth() + "/" + dateObj.getDay() + " " + dateObj.getHours() + ":" + dateObj.getUTCMinutes() + ":" + dateObj.getUTCSeconds() + " UTC"
					
					xml.ele( 'external_story' )
						.ele( 'external_id', each._id.toString() )
						.insertAfter( 'name', each.name )
						.insertAfter( 'description', each.description )
						.insertAfter( 'requested_by', each.requested_by )
						.insertAfter( 'created_at', { type: "datetime" }, dateCreated )
						.insertAfter( 'story_type', each.story_type )
						.insertAfter( 'estimate', { type: 'integer' }, 1)
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
		fs.writeFile( xmlOutput, xml, function( err ) {
			if ( err ) {
				console.log( err )
				return res.status( 500 ).json( "Could not save feedback." )
			}
			
			var sftp = new Sftp( {
				host: '162.243.138.210',
				username: 'root',
				path: path.join( __dirname, '../logs/feedback' ),
				remoteDir: '/slipstream/feedback',
				privateKey: fs.readFileSync( path.join( __dirname, '../digitalocean' ) )
			} )
			.on( 'error', function( error ) {
				console.log( error )
			})
			.on( 'uploading', function( pgs ) {
				console.log( "It's uploading: " + pgs.file )
			})
			.on( 'completed', function() {
				return res.status( 200 ).json( "Feedback sent. Thank you." )
			})
			
			sftp.upload()
		})
	})
	.catch( function ( error ) {
		console.log( error )
		
		return res.status( 500 ).json( "Could not save feedback" )
	})
	
}