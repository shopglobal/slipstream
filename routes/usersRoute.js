var express = require('express'),
	router = express.Router(),
	authController = require('controllers/authController')

var userController = require('../controllers/userController.js')

router.route('/users')
	.post( userController.postUsers )
	.get( authController.isAuthenticated, userController.getUser )

module.exports = router