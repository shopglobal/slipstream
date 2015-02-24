var chai = require( 'chai' ),
	chaiAsPromised = require( 'chai-as-promised' ),
	assert = require( 'chai' ).assert,
	should = require( 'chai' ).should(),
	saveImage = require( 'helpers/save-image' ),
	path = require( 'path' ),
	getUser = require( 'helpers/get-user' ),
	httpMocks = require( 'node-mocks-http' ),
	app = require( 'server.js' ),
	userController = require( 'controllers/userController' ),
	request = require( 'request' ),
	User = require( 'models/userModel' ),
	shortid = require( 'shortid' )

chai.use( chaiAsPromised )

var newTestUser = {}

describe( 'UserController', function () {
	
	describe( 'signUp', function () {
		
		it( 'should create and return a new user', function ( done ) {	
			
			var userSuffix = shortid.generate()
			
			request({
				method: 'POST',
				url: 'https://localhost:8443/api/signup',
				json: true,
				strictSSL: false,
				body: {
					"username": 'test-user-' + userSuffix,
					"email": 'test-user@zombo.com',
					"password": '1q2w3e4r'
				} }, function ( err, response, body ) {
					newTestUser.username = body.username
					newTestUser.token = body.token
				
					body.should.include.keys( [ "username", "password", "token" ] )
					
					done()
			})
		})
	})
})	

/*
Test the save-image.js middleware, custom made by us
*/
describe( 'SaveImage', function () {
	
	describe( 'saveImage( type, url )', function () {		
		
		it( 'should return a hash', function() {
			var type = 'read',
				imageUrl = "http://i.imgur.com/wd7jzMg.gif"
			
			this.timeout( 4000 )
			
			return saveImage( type, imageUrl ).should.eventually.include( 'e772e38e3b0f4f8977888aa8fb5d954e' )
		})
		
	})
	   
})

/*
Test the save-image.js middleware we made for saving pictures.
*/
describe( 'GetUser', function () {

	describe( "getUser( token )", function() {
		
		it( "should return a user's ID when given token", function() {
			this.timeout( 4000 )
			
			var token = newTestUser.token
			
			return getUser( token ).should.eventually.lengthOf( 24 )
		})
		
	})
	
})