var User = require( '../models/userModel' ),
	Video = require( '../models/videoModel' ),
	mongoose = require( 'mongoose' ),
	Youtube = require( 'youtube-api' ),
	Date = require( 'datejs' ),
	URL = require( 'url' ),
    async = require( 'async' ),
	q = require( 'q' )

exports.add = function ( req, res ) {
	var defer = q.defer()
	
    // check sign in and get user information as 'user' 

    function getUser () {
        User.findOne( { token: req.token }, function ( err, user ) {
			return user
        })
    }

    // split the youtbe videoID from the full URL

    function getVideoId () {
        return URL.parse( req.query.url ).query.slice(-11)
    }

    // create the video object to be saved in the databse model

    function makeVideoObject ( user, vData ) {
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
        return res.json( video )
    }

    // search for new video based on it's ID

    function youtubeFind ( videoId ) {

        function authYoutube ( callback ) {
            var authObj = Youtube.authenticate({
                type: "key",
                key: "AIzaSyD79gA6KcMnG0vyRgNyfxDpq8ok_Aj6LrE"
            })
            callback()
        }            
            
        function getYoutube () {
            Youtube.videos.list({
                part: "statistics,snippet,contentDetails",
                id: videoId
            }, function ( err, data ) {
                if (err)
                    return console.log( "youtubeFind error: " + err )

				return data.items[0]
            })        
        }
        
        authYoutube( getYoutube )
    } 
	
//	var user = getUser()
	var videoId = getVideoId()
//	var video = q(videoId).then( youtubeFind )
	
	q.all( [ getUser(), youtubeFind(videoId) ] ).spread( function( user, video ) {
		if ( !user )
			return res.json( "Not authenticated." )
		
		makeVideoObject( user, video )
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