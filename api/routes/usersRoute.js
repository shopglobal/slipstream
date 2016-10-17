import express from 'express'
import userController from '../controllers/userController'
import {postArticle} from '../controllers/blogController'
import {
  addTags,
  makePrivate,
  getStream,
  addContent,
  getContent,
  postFlag,
  editContent,
  deleteContent,
  deleteTag,
  shareByEmail
} from '../controllers/contentController'

// const {SECRET_TOKEN} = process.env

const router = new express.Router()

/* User */
router.route('/authenticate')
  .post( userController.login )
router.route('/users')
  .get( userController.checkAuthorization, userController.getUser )
  .delete( userController.checkAuthorization, userController.deleteUser )
router.route('/user')
  .post( userController.signUp )
router.route( '/password/reset' )
  .get( userController.sendPasswordReset )
router.route( '/password/change' )
  .post( userController.checkAuthorization, userController.changePassword )
router.route('/content')
  .post( userController.checkAuthorization, ( req, res ) => (
    req.body.stream === "read" ? postArticle( req, res ) : addContent( req, res )
  ))

/* Content */
router.route('/content/:content/tag')
  .post( userController.checkAuthorization, addTags )
  .delete( userController.checkAuthorization, deleteTag )
router.route( '/content/private' )
  .post( userController.checkAuthorization, makePrivate )
router.route( '/content/share' )
  .post( userController.checkAuthorization, shareByEmail )
router.route( '/content/edit' )
  .post( userController.checkAuthorization, editContent )
router.route( '/content/flag' )
  .post( userController.checkAuthorization, postFlag )
router.route('/stream/:stream')
  .get(getStream)
  .delete( userController.checkAuthorization, function ( req, res ) {
    deleteContent( req, res )
  })

router.route( '/content/:slug')
  .get( getContent )

module.exports = router
