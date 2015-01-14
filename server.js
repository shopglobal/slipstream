var http = require('http'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	passport = require('passport'),
	secret = require('config/secretConfig'),
	jwt = require('jsonwebtoken'),
	morgan = require('morgan'),
	portToUse = 4000

var indexPath = path.join(__dirname, 'public')

mongoose.connect('mongodb://localhost/slipstream')

app = express();

require('./config/passportConfig')(passport)

app	
	.use(morgan('dev'))
	app.use(bodyParser.urlencoded({ extended: true }))
	app.use(bodyParser.json())
	.use(express.static(indexPath))

	.use( '/api', require('./routes/usersRoute.js') )
	.use( '/', require( './routes/home.js' ) )


	.listen(portToUse)

console.log("Running on port " + portToUse)