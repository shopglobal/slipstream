var http = require('http'),
	https = require( 'https' ),
	fs = require('fs'),
	mongoose = require('mongoose'),
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	secret = require('./config/secretConfig'),
	jwt = require('jsonwebtoken'),
	morgan = require('morgan'),
	portToUse = 8443

var indexPath = path.join(__dirname, 'public')

var options = {
	key: fs.readFileSync( 'server.key'),
	cert: fs.readFileSync( 'server.crt' )
}

mongoose.connect('mongodb://localhost/slipstream')

app = express();

app	
	.use(morgan('dev'))
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.json())
	.use( '/api', require('./routes/usersRoute.js') )
	.use( express.static( indexPath ) )

https
	.createServer( options, app ).listen( portToUse )

//app.get('/', function( req, res ) {
//	res.writeHead( 200, { 'Content-Type': 'text/plain' } )
//	res.sendFile(indexPath)
//})

console.log("Running on port " + portToUse)