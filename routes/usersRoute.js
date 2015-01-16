var express = require('express'),
	http = require('http'),
	router = express.Router(),
	jwt = require('express-jwt'),
	userController = require('../controllers/userController.js'),
	blogController = require('../controllers/blogController.js'),
	secret = require('../config/secretConfig'),
	bodyParser = require('body-parser')

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route('/add')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.body.type = "blog" )
			blogController.add( req, res )
	})

router.route('/authenticate')
	.post( userController.login )

module.exports = router
