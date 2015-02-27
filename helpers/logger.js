/*

This just sets the default logger. 

*/
//var path = require( 'path' )

module.exports = require( 'bunyan' ).createLogger( {
	name: "SlipStream",
	streams: [ { 
		level: 'error',
		path: __dirname + '/logs/error.log',
		type: 'rotating-file'
	},
	{
		level: 'info',
		path: __dirname + '/logs/info.log',
		type: 'rotating-file' 
	}]
})