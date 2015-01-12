var express = require('express'),
	router = express.Router(),
	authController = require('controllers/authController')

var userController = require('../controllers/userController.js')

router.route('/users')
	.post(authController.isAuthenticated, userController.postUsers)
	.get(authController.isAuthenticated, userController.getUsers)

module.exports = router