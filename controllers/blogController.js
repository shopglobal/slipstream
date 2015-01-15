var User = require('../models/userModel.js'),
    secret = require('../config/secretConfig'),
    jwt = require('jsonwebtoken'),
    tokenManager = require('../config/tokenManager'),
	 noodle = require('noodlejs'),
    bodyParser = require('body-parser')

exports.add = function ( req, res ) {
    res.json( "Looks like you're adding a blog post or article. " + req.params.url )
}
