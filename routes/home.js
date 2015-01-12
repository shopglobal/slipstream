var express = require('express'),
	router = express.Router(),
	path = require('path')

var indexPath = path.join( __dirname, '..public/index.html')

router.get('/', function( rez, res, next ) {
	res.writeHead( 200, {'Content-Type': 'text/html'} )

	fs.createReadStream('public/index.html')
		.on('open', function () {
			this.pipe(res)
		})
})

module.exports = router