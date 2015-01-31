var express = require('express'),
	router = express.Router(),
	path = require('path'),
	fs = require( 'fs' ),
	tls = require( 'tls' )

var indexPath = path.join( __dirname, '..public/index.html')

var options = {
	key: fs.readFileSync( 'server.key'),
	cert: fs.readFileSync( 'server.crt' )
}

// 
// serves he index file when accessing root URL
// 
router.get('/', function( rez, res, next ) {
	res.writeHead( 200, {'Content-Type': 'text/html'} )
	
	tls.createServer( function ( s ) {
		s.write( 'public/index.html' )
		s.pipe( s )
	} ).listen( 4000 )
	
	fs.createReadStream('public/index.html')
		.on('open', function () {
			this.pipe(res)
		})
})

module.exports = router