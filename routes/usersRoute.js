var express = require('express'),
	http = require('http'),
	router = express.Router(),
	jwt = require('express-jwt'),
	userController = require('../controllers/userController.js'),
	blogController = require('../controllers/blogController.js'),
	videoController = require('../controllers/videoController.js'),
	songController = require('../controllers/songController.js'),
	secret = require('../config/secretConfig'),
	bodyParser = require('body-parser')

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route('/add')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.body.type === "watch" )
			videoController.add( req, res )
		if ( req.body.type === "read" )
			blogController.add( req, res )
		if ( req.body.type === "listen" )
			songController.add( req, res )
	})

router.route('/stream/read')
	.get( userController.checkAuthorization, function ( req, res ) {
		blogController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		blogController.delete( req, res )
	})

router.route('/stream/watch')
	.get( userController.checkAuthorization, function ( req, res ) {
		videoController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		videoController.delete( req, res )
	})

router.route('/authenticate')
	.post( userController.login )

module.exports = router
