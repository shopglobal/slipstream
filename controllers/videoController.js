var User = require( '../models/userModel' ),
	express = require( 'express' ),
	Video = require( '../models/videoModel' ),
	mongoose = require( 'mongoose' ),
	bodyParser = require( 'body-parser' ),
	Youtube = require( 'youtube-api' ),
	Q = require( 'q' ),
	Data = require( 'datejs' ),
	URL = require( 'url' )

// methods for adding a video

exports.add = function ( req, res ) {

	function getVideoId ( req, callback ) {
		videoId = URL.parse( req.query.url ).query.slice(-11)
		callback( videoId )
	}

	function getData ( data, callback ) { 
		vData = data.items[0]
		callback( vData )
	}


	function makeVideoObject ( user, vData, callback ) {
		video = new Video({
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


	// check sign in and get user information as 'user' 

	function getUser ( token, callback ) {
		User.findOne( { token: token }, function ( err, user ) {
			if ( err )
				return res.json( {
					status: "error",
					message: "Error authenticating: " + err
				})

			callback( user )
		})
	}

	// asynchronously, set authentication then get youutbe video info.	

	function youtubeAuthenticate ( callback ) {
		Youtube.authenticate({
			type: "key",
			key: "AIzaSyD79gA6KcMnG0vyRgNyfxDpq8ok_Aj6LrE"
		})
		callback()
	}

	// search for new video based on it's ID

	function youtubeFind ( videoId, callback ) {
		getVideoId( videoId, function ( videoId ) {
			Youtube.videos.list({
				part: "statistics,snippet,contentDetails",
				id: videoId
			}, function ( err, data ) {

				if (err)
					return console.log( err )

				if ( !data )
					return res.json( "There was no data" )

				callback( data ) 
			})
		})
	}


	getVideoId( req, function() {
		getUser( req.token, function ( req, res ) {	
			youtubeAuthenticate( function () {
				youtubeFind( videoId, function() {
					getData( data, function ( vData ) {
						makeVideoObject( user, vData, function ( video ) {
							video.save()
							return res.json( video )
						})
					})
				})
			})
		})
	})
}