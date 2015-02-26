/*

This just sets the default logger. 

*/
module.exports = require( 'bunyan' ).createLogger( {
	name: "SlipStream",
	streams: [ { 
		level: 'error',
		path: './logs/error.log',
		type: 'rotating-file'
	},
	{
		level: 'info',
		path: './logs/info.log',
		type: 'rotating-file' 
	}]
})