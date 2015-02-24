var chai = require( 'chai' ),
	chaiAsPromised = require( 'chai-as-promised' ),
	assert = require( 'chai' ).assert,
	should = require( 'chai' ).should(),
	saveImage = require( 'helpers/save-image' ),
	Mocha = require( 'mocha' ),
	path = require( 'path' ),
	getUser = require( 'helpers/get-user' )

chai.use( chaiAsPromised )

var mocha = new Mocha()

mocha.addFile( path.join( __dirname, "/test/test.js" ) )

mocha.run( function () {
	process.exit()
})