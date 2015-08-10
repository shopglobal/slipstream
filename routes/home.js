var express = require('express'),
	router = express.Router(),
	path = require('path'),
	fs = require( 'fs' ),
	Content = require( '../models/contentModel' ),
	mongoose = require( 'mongoose' ),
	Q = require( 'q' ),
	User = require( '../models/userModel' ),
	contentController = require( '../controllers/contentController' )

var indexPath = path.resolve( __dirname, '../', process.env.PUBLIC_FOLDER + '/index.html')

// 
// serves he index file when accessing root URL
//
function createOpenGraph ( result ) {
	return Q.Promise( function ( resolve, reject, modify ) {
		
		var openGraphHtml = "<html><head><title>" + result.title + "</title>" +
							"<meta property='og:site_name' content='Slipstream' />" +
							"<meta property='og:image' content='" + result.images[ result.thumbnail ? result.thumbnail : 0 ].thumb + "' />" +
							"<meta property='og:title' content='" + result.title.replace(/\"/g,'&quot;') + "' />" +
							"<meta property='og:description' content='" + result.description.replace(/\"/g,'&quot;') + "' />" +
							"<meta property='og:type' content='article' /></head></html>"
	
		return resolve( openGraphHtml )
		
	})
}

router.get( '/:user/:stream/:slug', function( req, res, next ) {
	
	if ( req.headers['user-agent'].indexOf( 'facebook' ) != -1 ) {
		/*var userToken = req.headers['authorization'] ? req.headers['authorization'].split( ' ' )[1] : 'null'*/
		
		if ( !req.params.user && !req.params.stream && !req.params.slug ) return next()

		contentController.findUserId( req.params.user )
		.then( function ( userId ) {
			if ( !userId ) return next()
			
			contentController.projectContent( req.params.slug )
			.then( function ( item ) {
				if ( !item ) return next()
				
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

router.get( '/*', function( req, res ) {
	res.status( 200 )
		.set( { 'content-type': 'text/html; charset=utf-8' } )
		.sendFile( indexPath )
})

module.exports = router