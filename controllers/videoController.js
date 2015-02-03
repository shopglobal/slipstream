var User = require( '../models/userModel' ),
	Video = require( '../models/videoModel' ),
	mongoose = require( 'mongoose' ),
	Youtube = require( 'youtube-api' ),
	URL = require( 'url' ),
    async = require( 'async' ),
	Q = require( 'q' )

exports.add = function ( req, res ) {
	var defer = Q.defer()
	
    // check sign in and get user information as 'user' 

    function getUser () {
		var defer = Q.defer()
        User.findOne( { token: req.token }, function ( err, user ) {
			defer.resolve( user )
		})
		
		return defer.promise
    }

    // split the youtbe videoID from the full URL

    function getVideoId () {
		var defer = Q.defer()
		var id = URL.parse( req.body.url ).query.slice(-11)
		
		defer.resolve( id )
		return defer.promise	
    }

    // create the video object to be saved in the databse model

    function makeVideoObject ( user, video ) {
        var vData = video.items[0]
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
		video.save()
		return res.json( video )
    }
	
	// authenticate youtube api
	
	function authYoutube () {
		Youtube.authenticate({
			type: "key",
			key: "AIzaSyD79gA6KcMnG0vyRgNyfxDpq8ok_Aj6LrE"
		})
	}   

    // search for new video based on it's ID

    function youtubeFind ( videoId ) {
		defer = Q.defer()
		
		authYoutube()

		video = Youtube.videos.list({
			part: "statistics,snippet,contentDetails",
			id: videoId
		}, function (err, data ) {
			defer.resolve( data )
		})
		
		return defer.promise
	}
	
	var user = getUser()
	var videoId = getVideoId()
	var video = videoId.then( youtubeFind )
	
	Q.all( [ user, video ] ).then( function ( result ) {
		return makeVideoObject( result[0], result[1] )
	})
	
}
	
exports.stream = function( req, res ) {
	User.findOne( { token: req.token }, function ( err, user ) {
		if( err )
			return res.sendStatus(403)
			
		Video.find( { $query: { user: user.id }, $orderby: { added: -1 } },
		function ( err, videos ) {
			if( err )
				return res.json( "No article content found, or something went wrong." )
			
			return res.json( videos )
		})
	})	
}