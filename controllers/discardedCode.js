
	
//	getVideoId( req, function() {
//		getUser( req.token, function ( req, res ) {
//			youtubeFind( videoId, function() {
//				makeVideoObject( user, vData, function ( video ) {
//					video.save()
//					return res.json( video )
//				})
//			})
//		})
//	})
//}

	
	
	//	defer.promise
//		.then( function () {
//			getUser().then( function () {
//				getVideoId().then( function() {
//					youtubeFind().then( function () {
//						makeVideoObject( user, vData )
//					})
//				})
//			})
//		})
//	
//	defer.resolve() 
//}
	
//		.then( getVideoId )
//		.then( youtubeFind )
//		.then( function( vData, user ) {
//			console.log( user )
//			console.log( videoId )
//			console.log( vData )
//			makeVideoObject( vData, user )
//		})
//    
//	function getUserData () {
//		user = getUser()
//		videoId = getVideoId()
//		youtubeAuthenticate()
//	}
//	
//	function getVideoData () {
//		vData = youtubeFind()
//	}	
//		
//	defer.promise
//	.then( getUserData )
//	.then( getVideoData )
//	.then( makeVideoObject.bind( user, videoId, vData ))
//	
