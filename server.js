var http = require('http'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	secret = require('./config/secretConfig'),
	jwt = require('jsonwebtoken'),
	morgan = require('morgan')

var indexPath = path.join( __dirname, process.env.PUBLIC_FOLDER )

mongoose.connect( process.env.MONGOLAB_URI )

app = express();

app	
	.use( morgan( 'dev' ) )
	.use(bodyParser.urlencoded( { limit: '50mb', extended: true } ) )
	.use( bodyParser.json( { limit: '50mb' } ) )
	.use( '/api', require('./routes/usersRoute.js') )
	.use( express.static( indexPath ) )
	.on( 'error', function( error ){
	   console.log( "Error: " + hostNames[i] + "\n" + error.message )
	   console.log( error.stack )
	})

http
	.createServer( app ).listen( process.env.PORT )
	.on( 'error', function( error ){
	   console.log( "Error: " + hostNames[i] + "\n" + error.message )
	   console.log( error.stack )
	})

setInterval(function() {
    http.get("http://slipstreamapp.com" )
		.on( 'error', function ( error ) {
			console.log( error.stack )
		})
    http.get("http://glacial-sea-2323.herokuapp.com/")
		.on( 'error', function ( error ) {
			console.log( error.stack )
		})
}, 300000)

console.log( "Running on port " + process.env.PORT )