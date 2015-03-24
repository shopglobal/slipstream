var express = require('express'),
	http = require('http'),
	router = express.Router(),
	jwt = require('express-jwt'),
	userController = require( '../controllers/userController' ),
	blogController = require( '../controllers/blogController' ),
	contentController = require( '../controllers/contentController' ),
	secret = require( '../config/secretConfig' ),
	bodyParser = require('body-parser'),
	feedbackController = require( '../controllers/feedback-controller' ),
	betakeyController = require( '../controllers/betakey-controller' )

router.route('/authenticate')
	.post( userController.login )

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route( '/user/password/reset' )
	.get( userController.sendPasswordReset )

router.route( '/user/password/change' )
	.post( userController.checkAuthorization, userController.changePassword )

router.route('/add')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.body.type == "read" ) {
			blogController.add( req, res )
		}
		else { contentController.add( req, res ) }
	})

router.route( '/search' )
	.get( userController.checkAuthorization, contentController.search )

router.route( '/feedback' )
	.post( userController.checkAuthorization, feedbackController.add )

router.route( '/betakeys' )
	.post( userController.checkAuthorization, betakeyController.add )
	.get( userController.checkAuthorization, betakeyController.show )


router.route('/tags')
	.post( userController.checkAuthorization, contentController.addTags )
	.delete( userController.checkAuthorization, contentController.deleteTag )
	
router.route('/stream/:stream')
	.get( userController.checkAuthorization, function ( req, res ) {
		contentController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		contentController.delete( req, res )
	})

module.exports = router
