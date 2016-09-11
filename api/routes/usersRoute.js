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
	betakeyController = require( '../controllers/betakey-controller' ),
	discoveryController = require( '../controllers/discovery-controller' )

router.route('/authenticate')
	.post( userController.login )

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.checkAuthorization, userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route( '/user/password/reset' )
	.get( userController.sendPasswordReset )

router.route( '/user/password/change' )
	.post( userController.checkAuthorization, userController.changePassword )

router.route( '/user/follow' )
	.post( userController.checkAuthorization, userController.follow )

router.route( '/user/unfollow' )
	.post( userController.checkAuthorization, userController.unFollow )

router.route( '/user/isfollowing' )
	.get( userController.checkAuthorization, userController.isfollowing )

router.route( '/user/name' )
	.get( userController.checkAuthorization, userController.getName )

router.route( '/user/search' )
	.get( userController.checkAuthorization, userController.search )

router.route( '/user/waitlist' )
	.post( userController.waitlist )
	.get( userController.checkAuthorization, userController.getwaitlist )

router.route( '/user/sendbetakey' )
	.post( userController.checkAuthorization, userController.sendBetakey )

router.route( '/users/invite' )
	.post( userController.checkAuthorization, userController.inviteByEmail )

router.route( '/admin/user-emails' )
	.get( userController.checkAuthorization, userController.exportEmails )

router.route('/add')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.body.type == "read" ) {
			blogController.add( req, res )
		}
		else { contentController.add( req, res ) }
	})

router.route( '/shorten-url' )
	.get( contentController.shortenUrl )

router.route( '/search' )
	.get( userController.checkAuthorization, contentController.search )

router.route( '/feedback' )
	.post( userController.checkAuthorization, feedbackController.add )

router.route( '/betakeys' )
	.post( userController.checkAuthorization, betakeyController.add )
	.get( userController.checkAuthorization, betakeyController.show )

router.route( '/betakeys/sent' )
	.post( userController.checkAuthorization, betakeyController.sent )

router.route('/tags')
	.post( userController.checkAuthorization, contentController.addTags )
	.delete( userController.checkAuthorization, contentController.deleteTag )

router.route( '/content/private' )
	.post( userController.checkAuthorization, contentController.private )

router.route( '/content/share' )
	.post( userController.checkAuthorization, contentController.shareByEmail )

router.route( '/content/edit' )
	.post( userController.checkAuthorization, contentController.edit )

router.route( '/content/flag' )
	.post( userController.checkAuthorization, contentController.flag )

router.route( '/discover/:measure/:stream' )
	.get( userController.checkAuthorization, function ( req, res ) {
		if ( req.params.measure == 'popular' ) {
			discoveryController.popular( req, res )
		}
	})
	
router.route('/stream/:username/:stream')
	.get( userController.checkAuthorization, function ( req, res ) {
		contentController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		contentController.delete( req, res )
	})

router.route( '/single/manifesto' )
	.get( contentController.singleManifesto )

router.route( '/single/:username')
	.get( contentController.single )

router.route( '/following/:stream' )
	.get( userController.checkAuthorization, contentController.following )
	

module.exports = router
