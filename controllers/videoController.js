// controller for the "watch" stream

var User = require( '../models/userModel' ),
	Video = require( '../models/videoModel' ),
	mongoose = require( 'mongoose' ),
	Youtube = require( 'youtube-api' ),
	URL = require( 'url' ),
	getYoutubeId = require( 'get-youtube-id' ),
	getUser = require( '../helpers/get-user' ),
	saveImage = require( '../helpers/save-image' ),
	request = require( 'request' ),
	Q = require( 'q' )

exports.add = function ( req, res ) {
	
	var defer = Q.defer()

    // create the video object to be saved in the databse model

    function makeVideoObject ( user, videoInfo ) {
		var deferred = Q.defer()		
		
		saveImage( req.body.type, videoInfo.links[2].href )
		.spread( function( imageHash, imageOriginalPath, imageThumbPath ) {
		
			var video = new Video({
				user: user,
				title: videoInfo.meta.title,
				service: videoInfo.meta.site,
				url: req.body.url,
				image: imageOriginalPath,
				imageThumb: imageThumbPath,
				imageHash: imageHash,
				text: videoInfo.meta.description,
				added: ( new Date() / 1000 ).toFixed(),
				author: videoInfo.meta.author,
				views: videoInfo.meta.views,
				duration: videoInfo.meta.duration,
			})
			if ( videoInfo.meta.site == "YoutTube" ) {
				video.date = ( new Date( videoInfo.meta.date ) / 1000 )
				video.rating = ( ( 1 - ( videoInfo.meta.likes / videoInfo.meta.dislikes ) ) / Math.pow(10, -2) ).toFixed()
			}
			video.save()
			deferred.resolve( video )
		})
		
		return deferred.promise
    }

    // search for new video based on it's ID

	function getVideo () {
		var deferred = Q.defer()
		
		request( "http://localhost:8061/iframely?url=" + req.body.url, function ( err, response, body ) {
			deferred.resolve( JSON.parse( body ) )
		})
				
		return deferred.promise
	}
	
	Q.all( [ getUser( req.token ), getVideo() ] )
	.spread( function ( user, videoInfo ) {
		makeVideoObject( user, videoInfo )
		.then( function ( video ) {
			return res.json( video )
		})
	})
	
	
}

// show items from database

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