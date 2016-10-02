import express from 'express'
import userController from '../controllers/userController'
import blogController from '../controllers/blogController'
import contentController from '../controllers/contentController'
import feedbackController from '../controllers/feedback-controller'
import betakeyController from '../controllers/betakey-controller'
import discoveryController from '../controllers/discovery-controller'

// const {SECRET_TOKEN} = process.env

const router = new express.Router()

router.route('/authenticate')
	.post( userController.login )

router.route('/users')
	.get( userController.checkAuthorization, userController.getUser )
	.delete( userController.checkAuthorization, userController.deleteUser )

router.route('/signup')
	.post( userController.signUp )

router.route( '/password/reset' )
	.get( userController.sendPasswordReset )

router.route( '/password/change' )
	.post( userController.checkAuthorization, userController.changePassword )

router.route( '/follow' )
	.post( userController.checkAuthorization, userController.follow )

router.route( '/unfollow' )
	.post( userController.checkAuthorization, userController.unFollow )

router.route( '/isfollowing' )
	.get( userController.checkAuthorization, userController.isfollowing )

router.route( '/user/name' )
	.get( userController.checkAuthorization, userController.getName )

router.route( '/search/user' )
	.get( userController.checkAuthorization, userController.search )

router.route( '/waitlist/user' )
	.post( userController.waitlist )
	.get( userController.checkAuthorization, userController.getwaitlist )

router.route( '/betakey' )
	.post( userController.checkAuthorization, userController.sendBetakey )

router.route( '/invite' )
	.post( userController.checkAuthorization, userController.inviteByEmail )

router.route( '/admin/user-emails' )
	.get( userController.checkAuthorization, userController.exportEmails )

router.route('/content')
	.post( userController.checkAuthorization, function ( req, res ) {
		if ( req.body.type == "read" ) {
			blogController.add( req, res )
		}
		else { contentController.add( req, res ) }
	})

router.route( '/shorten-url' )
	.get( contentController.shortenUrl )

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
	
router.route('/user/:username/stream/:stream')
	.get( userController.checkAuthorization, function ( req, res ) {
		contentController.stream( req, res )
	})
	.delete( userController.checkAuthorization, function ( req, res ) {
		contentController.delete( req, res )
	})

router.route( '/single/manifesto' )
	.get( contentController.singleManifesto )

router.route( '/single/user/:username')
	.get( contentController.single )

router.route( '/following/stream/:stream' )
	.get( userController.checkAuthorization, contentController.following )

module.exports = router
