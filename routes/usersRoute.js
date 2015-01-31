var express = require('express'),
	http = require('http'),
	router = express.Router(),
	jwt = require('express-jwt'),
	userController = require('../controllers/userController.js'),
	blogController = require('../controllers/blogController.js'),
	videoController = require('../controllers/videoController.js'),
	youtubeController = require('../controllers/youtubeController.js'),
	secret = require('../config/secretConfig'),
	bodyParser = require('body-parser')

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route('/add')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.query.type === "video" )
			youtubeController.add( req, res )
		else if ( req.query.type === "blog" )
			blogController.add( req, res )		
	})

router.route('/stream/articles')
	.get( userController.checkAuthorization, function ( req, res ) {
		blogController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		blogController.delete( req, res )
	})

router.route('/stream/videos')
	.get( userController.checkAuthorization, function ( req, res ) {
		videoController.stream( req, res )
	})

router.route('/authenticate')
	.post( userController.login )

module.exports = router
