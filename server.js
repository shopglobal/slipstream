var http = require('http'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	portToUse = 4000

var indexPath = path.join(__dirname, 'public')

mongoose.connect('mongodb://localhost/slipstream')

app = express();

app
	.use(bodyParser.urlencoded( { extended:true } ))
	.use(express.static(indexPath))

	.use('/', require('./routes/home.js'))

	.listen(portToUse)

console.log("Running on port " + portToUse)