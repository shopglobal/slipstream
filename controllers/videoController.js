// controller for the "watch" stream

var User = require( '../models/userModel' ),
	Video = require( '../models/videoModel' ),
	mongoose = require( 'mongoose' ),
	Youtube = require( 'youtube-api' ),
	URL = require( 'url' ),
	getYoutubeId = require( 'get-youtube-id' ),
	getUser = require( '../helpers/get-user' ),
	saveImage = require( '../helpers/save-image' ),
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
		var id = getYoutubeId( req.body.url )
		
		defer.resolve( id )
		return defer.promise	
    }

    // create the video object to be saved in the databse model

    function makeVideoObject ( data ) {
		var deferred = Q.defer()
		var user = data[0]
		var vData = data[1].items[0]
		
		
		saveImage( req.body.type, vData.snippet.thumbnails.high.url )
		.spread( function( imageHash, imageOriginalPath, imageThumbPath ) {
		
			video = new Video({
				user: user._id,
				title: vData.snippet.title,
				videoId: vData.id,
				service: "youtube",
				image: imageOriginalPath,
				imageThumb: imageThumbPath,
				imageHash: imageHash,
				description: vData.snippet.description,
				added: ( new Date() / 1000 ).toFixed(),
				date: ( new Date( vData.snippet.publishedAt ) / 1000 ),
				author: vData.channelId,
				views: vData.viewCount,
				duration: vData.contentDetails.duration,
				rating: ( ( 1 - ( vData.statistics.dislikeCount / vData.statistics.likeCount ) ) / Math.pow(10, -2) ).toFixed()
			})
			deferred.resolve( video )
		})
		
		return deferred.promise
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
	
	Q.all( [ getUser(), video ] )
	.then( makeVideoObject )
	.then( function ( video ) {
		video.save()
		return res.json( video )
	})
	
}
	
exports.stream = function( req, res ) {
	var show = req.query.show,
		page = req.query.page	
	
	function getWatchStream ( user ) {
		var deferred = Q.defer()
		
		Video.find( { $query: { user: user }, $orderby: { added: -1 } } )
		.skip( page > 0 ? (( page - 1 ) * show ) : 0 ).limit( show ).exec()
		.then( function ( result ) {
			deferred.resolve( result )	
		})
		return deferred.promise
	}
	
	getUser( req.token )
	.then( getWatchStream )
	.then( function ( videos ) {
		return res.json( videos )	
	})

}

// delete a video
// TODO: make the error reporting actually work

exports.delete = function( req, res ) {
	var contentId = mongoose.Types.ObjectId( req.query.id )
	
	function deleteVideo ( user ) {
		var deferred = Q.defer()
		
		Video.remove( { user: user, _id: contentId }, function ( err, video ) {
			deferred.resolve( video )
		})
		
		return deferred.promise
	} 
	
	getUser( req.token ).then(deleteVideo).then( function ( video ) {
		return res.json( { status: 200, Message: "Deleted: " + video.title } )
	}, function ( err ) {
		return res.json( { status: 500, Message: err } )	
	})
		
}