var express = require('express'),
	http = require('http'),
	router = express.Router(),
	jwt = require('express-jwt'),
	userController = require( '../controllers/userController' ),
	blogController = require( '../controllers/blogController' ),
	contentController = require( '../controllers/contentController' ),
	secret = require( '../config/secretConfig' ),
	bodyParser = require('body-parser')

router.route('/authenticate')
	.post( userController.login )

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route( '/reset' )
	.get( userController.sendPasswordReset )

router.route('/add')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.body.type == "read" ) {
			blogController.add( req, res )
		}
		else { contentController.add( req, res ) }
	})

router.route('/stream/read')
	.get( userController.checkAuthorization, function ( req, res ) {
		blogController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		blogController.delete( req, res )
	})

router.route('/stream/:stream')
	.get( userController.checkAuthorization, function ( req, res ) {
		contentController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		contentController.delete( req, res )
	})

module.exports = router
