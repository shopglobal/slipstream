/*

This just sets the default logger. 

*/
/*var path = require( 'path' )

module.exports = require( 'bunyan' ).createLogger( {
	name: "SlipStream",
	streams: [ { 
		level: 'error',
		path: path.join( __dirname, '../logs/error.log'),
		type: 'rotating-file'
	},
	{
		level: 'info',
		path: path.join( __dirname, '../logs/info.log'),
		type: 'rotating-file' 
	}]
})*/

exports.error = function ( error ) {
	console.error( error )
}

exports.info = function ( error ) {
	console.log( error )
}