var express = require('express'),
	router = express.Router(),
	path = require('path'),
	fs = require( 'fs' ),
	Content = require( '../models/contentModel' ),
	mongoose = require( 'mongoose' ),
	Q = require( 'q' ),
	User = require( '../models/userModel' ),
	contentController = require( '../controllers/contentController' )

var indexPath = path.join( __dirname, '..public/index.html')

// 
// serves he index file when accessing root URL
//
function createOpenGraph ( result ) {
	return Q.Promise( function ( resolve, reject, modify ) {
		
		var openGraphHtml = "<html><head><title>" + encodeURIComponent( result.title ) + "</title>" +
							"<meta property='og:site_name' content='Slipstream' />" +
							"<meta property='og:image' content='" + result.images[ result.thumbnail ? result.thumbnail : 0 ].thumb + "' />" +
							"<meta property='og:title' content='" + encodeURIComponent( result.title ) + "' />" +
							"<meta property='og:description' content='" + encodeURIComponent( result.description ) + "' />" +
							"<meta property='og:type' content='article' />"
	
		return resolve( openGraphHtml )
		
	})
}

router.get( '/:user/:stream/:slug', function( req, res, next ) {
	
	if ( req.headers['user-agent'].indexOf( 'facebook' ) != -1 ) {
		/*var userToken = req.headers['authorization'] ? req.headers['authorization'].split( ' ' )[1] : 'null'*/
		
		if ( !req.params.user && !req.params.stream && !req.params.slug ) return next()

		contentController.findUserId( req.params.user )
		.then( function ( userId ) {
			
			contentController.projectContent( req.params.slug )
			.then( function ( item ) {
				createOpenGraph( item[0] )
				.then( function ( OG ) {
					return res.status( 200 ).send( OG )
				})
				.catch( function ( error ) {
					console.log( error )
					return res.status( 500 ).json( error )
				})
			})
		})
	} else return next()
})

module.exports = router