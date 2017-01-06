import express from 'express'
import userController from '../controllers/userController'
import {postArticle} from '../controllers/blogController'
import {
  addTags,
  makePrivate,
  getStream,
  postContent,
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
router.route('/session')
  .post( userController.login )
router.route('/user')
  .post( userController.signUp )
  .delete( userController.checkAuthorization, userController.deleteUser )
router.route('/user/me')
  .get( userController.checkAuthorization, userController.getUser )
router.route( '/password/reset' )
  .get( userController.sendPasswordReset )
router.route( '/password/change' )
  .post( userController.checkAuthorization, userController.changePassword )
router.route('/stream/:stream/content')
  .post( userController.checkAuthorization, ( req, res ) => (
    req.body.format === "read" ? postArticle( req, res ) : postContent( req, res )
  ))

/* Content */
router.route('/content/:content/tag')
  .post( userController.checkAuthorization, addTags )
  .delete( userController.checkAuthorization, deleteTag )
router.route( '/content/private' )
  .post( userController.checkAuthorization, makePrivate )
router.route( '/content/share' )
  .post( userController.checkAuthorization, shareByEmail )
router.route( '/content/:content' )
  .post( userController.checkAuthorization, editContent )
router.route( '/content/flag' )
  .post( userController.checkAuthorization, postFlag )
router.route('/stream/:stream/content')
  .get(getStream)

router.route( '/content/:slug')
  .get( getContent )
  .delete( userController.checkAuthorization, deleteContent)

module.exports = router
