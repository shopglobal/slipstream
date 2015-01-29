var User = require( '../models/userModel' ),
	Video = require( '../models/videoModel' ),
	mongoose = require( 'mongoose' ),
	bodyParser = require( 'body-parser' ),
	Youtube = require( 'youtube-api' ),
	Q = require( 'q' ),
	Data = require( 'datejs' ),
	url = require( 'url' )

// method for adding a video

exports.add = function ( req, res ) {
	
	// check sign in and get user information as 'user' 
	
	User.findOne( { token: req.token }, function ( err, user ) {
		if ( err )
			return res.json( {
				status: "error",
				message: "Error looking up user to add video. Are you signed in? Err: " + err
			})
		
		// asynchronously, set authentication then get youutbe video info.	
			
		Q.fcall(function () {
			Youtube.authenticate({
				type: "key",
				key: "AIzaSyD79gA6KcMnG0vyRgNyfxDpq8ok_Aj6LrE"
			})
		})
		
		// search for new video based on it's ID
		.then( function() {
			Youtube.videos.list({
				part: "statistics,snippet,contentDetails",
				id: req.query.url
			}, function ( err, data ) {

				// check for problems

				if (err)
					return console.log( err )

				if ( !data )
					return res.json( "There was no data" )

//				 create new video object to be put into database

				function getData ( data, callback ) { 
					var vData = data.items[0]
					callback( vData )
				}

				
				function makeVideoObject ( vData, callback ) {
					var video = new Video({
						user: user._id,
						title: vData.snippet.title,
						videoId: vData.id,
						service: "youtube",
						image: vData.snippet.thumbnails.high.url,
						imageHash: "12345",
						added: ( new Date() / 1000 ).toFixed(),
						date: ( new Date( vData.snippet.publishedAt ) / 1000 ),
						author: vData.channelId,
						views: vData.viewCount,
						duration: vData.contentDetails.duration,
						rating: ( ( 1 - ( vData.statistics.dislikeCount / vData.statistics.likeCount ) ) / Math.pow(10, -2) ).toFixed()
				 	})
					callback( video )
				}
				
				getData( data, function ( vData ) {
					makeVideoObject( vData, function ( video ) {
						video.save()
						return res.json( video )
					})
				})

			})
		})		
	})
}
	