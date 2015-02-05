var Song = require( '../models/songModel' ),
	User = require( '../models/userModel' ),
	mongoose = require( 'mongoose' ),
	URL = require( 'url' ),
	Q = require( 'q' ),
	getUser = require( '../helpers/get-user' ),
//	SoundCloud = require( '../helpers/soundcloud-node' )
	SC = require( 'soundclouder' ),
	request = require( 'request' )

exports.add = function ( req, res ) {

	function authSoundCloud () {
		var deferred = Q.defer()
		SC.init( 'ae378f9568d2b1efddccdec0eb61000c', '11d8389c2f9ac7cb9ba09b300cb40a97', 'http://104.131.133.86/#/home' )
		
//		var oauthHandleToken = function ( req, res ) {
//			deferred = Q.defer()
//			soundCloud.getToken( req.query.code, function ( err, tokens ) {
//				deffered.resolve( tokens )
//			})
//			return deferred.promise
//		}
		deferred.resolve( SC )
		return deferred.promise
	}
	
	function getSoundCloud ( SC ) {
		var deferred = Q.defer()
		SC.get( '/resolve?url=' + req.body.url, '', function ( err, url ) {
			request( url.location, function ( err, response, body ) {
				deferred.resolve( JSON.parse(body) )
			})
		})
		return deferred.promise
	}
	
	function makeSong ( data ) {
		var deferred = Q.defer()
		var userId = getUser( req.token )
		var song = new Song ({
			artist: data.user.username,
			album: data.release,
			title: data.title,
			songId: data.id,
			url: data.permalink_url,
			length: data.duration / 1000,
			rating: data.favourites_count,
			views: data.playback_count,
			image: data.artwork_url,
			service: "soundcloud",
			added: ( new Date() / 1000 ).toFixed(),
			date: ( new Date("2014/10/22 13:32:53 +0000") / 1000 ),
			tags: data.genre,
			userTags: [],			
		})
		Q.all( [ userId ] ).then( function ( result ) {
			song.user = result
			song.save()
			deferred.resolve( song )
		})
		
		return deferred.promise
	}
	
	authSoundCloud()
	.then( getSoundCloud )
	.then( makeSong )
	.then( function ( song ) {
		return res.json( song )
	}, function ( err ) {
		return res.json ( err )
	})
		
}

exports.stream = function ( req, res ) {
	
	function findSongs () {
		var deferred = Q.defer()
		var userId = getUser( req.token )
		Q.all( [ userId ], function ( result ) {
			Song.find( { $query: { user: user }, $oderby: { added: -1 } }, function ( err, data ) {
				if ( err )
					return res.json( err )
				
				deferred.resolve( data )
			})
		})
		return deferred.promise
	}
	
	findSongs()
	.then( function ( data ) {
		return res.json( data )
	}, function ( err ) {
		return res.json ( err ) 
	})
}
