var chai = require( 'chai' ),
	chaiAsPromised = require( 'chai-as-promised' ),
	assert = require( 'chai' ).assert,
	should = require( 'chai' ).should(),
	saveImage = require( '../helpers/save-image' ),
	path = require( 'path' ),
	getUser = require( '../helpers/get-user' ),
	httpMocks = require( 'node-mocks-http' ),
	userController = require( '../controllers/userController' ),
	blogController = require( '../controllers/blogController' ),
	request = require( 'request' ),
	User = require( '../models/userModel' ),
	Content = require( '../models/contentModel' ),
	shortid = require( 'shortid' )
//	app = require( '../server' )

chai.use( chaiAsPromised )

var userSuffix = shortid.generate()

newTestUser = {
	username: 'test-user-' + userSuffix
}

newTestContent = {
	medium: {},
	youtube: {}
}


/*
Tests the user related functions
*/
describe( 'UserController', function () {
	
	describe( 'signUp', function () {
		
		it( 'should create and return a new user', function ( done ) {	
			
			request({
				method: 'POST',
				url: 'https://localhost:8443/api/signup',
				json: true,
				strictSSL: false,
				body: {
					"username": newTestUser.username,
					"email": 'test-user@zombo.com',
					"password": '1q2w3e4r'
				} }, function ( err, response, body ) {
					if( err )
						return done( err )
				
					newTestUser.username = body.username
					newTestUser.token = body.token
				
					body.should.include.keys( "token" )
					
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
		
		it( 'should return a hash', function( done ) {
			var type = 'read',
				imageUrl = "http://i.imgur.com/wd7jzMg.gif"
			
			this.timeout( 4000 )
			
			saveImage( type, imageUrl ).should.eventually.include( 'e772e38e3b0f4f8977888aa8fb5d954e' )
			
			done()
		})
		
	})
	   
})

/*
Test the save-image.js middleware we made for saving pictures.
*/
describe( 'GetUser', function () {

	/*
	describe( "getUser( token )", function() {
		
		it( "should return a user's ID when given token", function() {
			this.timeout( 4000 )
			
			var token = newTestUser.token
			
			return getUser( token ).should.eventually.lengthOf( 24 )
		})
		
	})
	*/
	
	describe( 'GET /api/users', function () {
		
		it( 'should return the users information', function ( done ) {
			
			this.timeout( 5000 )
			
				request({
					method: 'GET',
					url: 'https://localhost:8443/api/users',
					json: true,
					strictSSL: false,
					headers: {
						"Authorization": "Bearer " + newTestUser.token
					} }, function ( err, response, body ) {
						if ( err )
							return done( err )
						
						body.should.include.keys( [ "username", "id", "email" ] )

						done()
				})
				
		})
	})
	
})



describe( 'Add content', function () {
	
	describe( 'Add BBC', function () {
		
		it( 'should return the article data, including user, title and content fields', function ( done ) {
			
			this.timeout( 5000 )
			
				request({
					method: 'POST',
					url: 'https://localhost:8443/api/add',
					json: true,
					strictSSL: false,
					body: {
						"type": "read",
						"url": "http://www.bbc.com/news/world-us-canada-31596580"
					},
					headers: {
						"Authorization": "Bearer " + newTestUser.token
					} }, function ( err, response, body ) {
						if ( err )
							return done( err )
						
						body.should.include.keys( [ "user", "title", "content" ] )
						
						done()
				})
				
		})
	})
	
	describe( 'Add Medium', function () {
		
		it( 'should return the article data, including user, title and content fields', function ( done ) {
			
			this.timeout( 5000 )
			
				request({
					method: 'POST',
					url: 'https://localhost:8443/api/add',
					json: true,
					strictSSL: false,
					body: {
						"type": "read",
						"url": "https://medium.com/message/archive-fever-2a330b627274"
					},
					headers: {
						"Authorization": "Bearer " + newTestUser.token
					} }, function ( err, response, body ) {
					
						newTestContent.medium.id = body._id
						
						body.should.include.keys( [ "user", "title", "content" ] )

						done()
				})
				
		})
	})
	
	describe( 'Add Youtube', function () {
		
		it( 'should return the video data, including user, title and content fields', function ( done ) {
			
			this.timeout( 5000 )
			
			request({
				method: 'POST',
				url: 'https://localhost:8443/api/add',
				json: true,
				strictSSL: false,
				body: {
					"type": "watch",
					"url": "https://www.youtube.com/watch?v=uxfRLNiSikM"
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
				
					newTestContent.youtube.id = body._id

					body.should.include.keys( 'user' )

					done()
			})
		})
	})
	
})

/*
Tests deleting content
*/
describe( 'Delete content', function () {
		
	describe( 'DELETE /api/stream/read', function() {
		
		it( 'should delete the Medium stream item from earlier test', function ( done ) {
			
			request({
				method: 'DELETE',
				url: 'https://localhost:8443/api/stream/read',
				strictSSL: false,
				json: true,
				useQuerystring: true,
				qs: {
					"id": newTestContent.medium.id
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
					if ( err ) return done( err )

					body.should.include.keys( 'content' )

					done()
			})
			
		})
			
	})
	
	describe( 'DELETE /api/stream/watch', function() {
		
		it( 'should delete the Youtube stream item from earlier test', function ( done ) {
			
			request({
				method: 'DELETE',
				url: 'https://localhost:8443/api/stream/watch',
				strictSSL: false,
				json: true,
				useQuerystring: true,
				qs: {
					"id": newTestContent.youtube.id
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
					if ( err ) return done( err )

					body.should.include.keys( 'title' )

					done()
			})
			
		})
			
	})
})