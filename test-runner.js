var chai = require( 'chai' ),
	chaiAsPromised = require( 'chai-as-promised' ),
	assert = require( 'chai' ).assert,
	should = require( 'chai' ).should(),
	Mocha = require( 'mocha' ),
	path = require( 'path' )

chai.use( chaiAsPromised )

var mocha = new Mocha()

mocha.addFile( path.join( __dirname, "/test/test.js" ) )

mocha.run( function () {
	process.exit()
})