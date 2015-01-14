var express = require('express'),
	http = require('http'),
	router = express.Router(),
	jwt = require('express-jwt'),
	secret = require('../config/secretConfig')

var userController = require('../controllers/userController.js')

router.route('/users')
	.post( userController.login )
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route('/authenticate')
	.post( userController.login )

module.exports = router