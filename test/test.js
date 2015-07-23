	var chai = require( 'chai' ),
		chaiAsPromised = require( 'chai-as-promised' ),
		assert = chai.assert,
		should = chai.should(),
		// saveImage = require( '../helpers/save-image' ),
		path = require( 'path' ),
		getUser = require( '../helpers/get-user' ),
		userController = require( '../controllers/userController' ),
		blogController = require( '../controllers/blogController' ),
		request = require( 'request' ),
		User = require( '../models/userModel' ),
		Content = require( '../models/contentModel' ),
		shortid = require( 'shortid' )
	//	app = require( '../server' )

	chai.use( chaiAsPromised )

var userSuffix = shortid.generate()

beta = {}

newTestUser = {
	username: 'test-user-' + userSuffix
}

newTestContent = {
	medium: {},
	youtube: {},
	soundcloud: {}
}

var PORT = process.env.PORT

/*
Tests the user related functions
*/
describe( 'UserController', function () {
	
	describe( 'signUp', function () {
		
		it( 'should create and return a new user', function ( done ) {	
			
			request({
				method: 'POST',
				url: 'http://localhost:' + PORT + '/api/signup',
				json: true,
				strictSSL: false,
				body: {
					"username": newTestUser.username,
					"email": newTestUser.username + '@slipstreamapp.com',
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
/*describe( 'SaveImage', function () {
	
	describe( 'saveImage( type, url )', function () {		
		
		it( 'should return a hash', function ( done ) {
			var type = 'read',
				imageUrl = "http://i.imgur.com/wd7jzMg.gif"
			
			this.timeout( 4000 )
			
			saveImage( type, imageUrl ).should.eventually.include( 'e772e38e3b0f4f8977888aa8fb5d954e' )
			
			done()
		})
		
	})
	   
})*/

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
					url: 'http://localhost:' + PORT + '/api/users',
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
					url: 'http://localhost:' + PORT + '/api/add',
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
						
						body.should.include.keys( [ "_id", "title", "description" ] )
						
						done()
				})
				
		})
	})
	
	describe( 'Add Medium', function () {
		
		it( 'should return the article data, including user, title and content fields', function ( done ) {
			
			this.timeout( 10000 )
			
			request({
				method: 'POST',
				url: 'http://localhost:' + PORT + '/api/add',
				json: true,
				strictSSL: false,
				body: {
					"type": "read",
					"url": "http://medium.com/message/archive-fever-2a330b627274"
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
					if ( err ) return done( err )
				
					newTestContent.medium.id = body._id
					
					body.should.include.keys( [ "_id", "title", "description" ] )

					done()
			})
				
		})
	})
	
	describe( 'Add Youtube', function () {
		
		it( 'should return the video data, including user, title and content fields', function ( done ) {
			
			this.timeout( 5000 )
			
			request({
				method: 'POST',
				url: 'http://localhost:' + PORT + '/api/add',
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

					body.should.include.keys( [ "_id", "title", "description" ] )

					done()
			})
		})
	})
	
	describe( 'Youtube in listen stream', function () {
		
		it( 'should add Youtube to listen stream and return item', function ( done ) {
			
			this.timeout( 5000 )
			
			request({
				method: 'POST',
				url: 'http://localhost:' + PORT + '/api/add',
				json: true,
				strictSSL: false,
				body: {
					"type": "listen",
					"url": "https://www.youtube.com/watch?v=uxfRLNiSikM"
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
				
					newTestContent.youtube.id = body._id

					body.should.include.keys( [ "_id", "title", "description" ] )

					done()
			})
		})
	})
	
	describe( 'Add soundcloud', function () {
		
		it( 'should add Soundcloud to listen stream and return item', function ( done ) {
			
			this.timeout( 5000 )
			
			request({
				method: 'POST',
				url: 'http://localhost:' + PORT + '/api/add',
				json: true,
				strictSSL: false,
				body: {
					"type": "listen",
					"url": "https://soundcloud.com/braxe1/sets/alan-braxe-moments-in-time-ep"
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
				
					newTestContent.soundcloud.id = body._id

					body.should.include.keys( [ "_id", "title", "description" ] )

					done()
			})
		})
	})
	
})

describe( 'Stream content', function () {
	
	describe( 'GET /api/stream/USERNAME/read', function() {
		
		it( 'should return list of articles for the read stream', function( done ) {
			
			request({
				method: 'GET',
				url: 'http://localhost:' + PORT + '/api/stream/' + newTestUser.username + '/read',
				json: true,
				strictSSL: false,
				qs: {
					"page": 1,
					"show": 2
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
					if ( err ) done( err )

					response.statusCode.should.equal( 200 )
					body.should.be.an( "array" )
					body.should.include.deep.property( '1.title', 'Obama vetoes Keystone oil pipeline bill' )
					body.should.include.deep.property( '0.title', 'Archive Fever' )

					done()
			})
			
		})
		
	})
	
	describe( 'GET /api/stream/USERNAME/listen', function() {
		
		it( 'should return list of Listen items', function ( done ) {
			
			request({
				method: 'GET',
				url: 'http://localhost:' + PORT + '/api/stream/' + newTestUser.username + '/listen',
				json: true,
				strictSSL: false,
				qs: {
					"page": 1,
					"show": 2
				},
				headers: {
					"Authorization": "Bearer " + newTestUser.token
				} }, function ( err, response, body ) {
					if ( err ) done( err )

					response.statusCode.should.equal( 200 )
					body.should.be.an( "array" )
					body.should.include.deep.property( '0.title', 'Scion AV Presents: ALAN BRAXE - MOMENTS IN TIME EP by ALAN BRAXE' )

					done()
			})
			
		})
		
	})

})

/*
Tests deleting content
*/
describe( 'Delete content', function () {
		
	describe( 'DELETE /api/stream/USERNAME/read', function() {
		
		it( 'should delete the Medium stream item from earlier test', function ( done ) {
			
			request({
				method: 'DELETE',
				url: 'http://localhost:' + PORT + '/api/stream/' + newTestUser.username + '/read',
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

					response.statusCode.should.equal( 200 )

					done()
			})
			
		})
			
	})
	
	describe( 'DELETE /api/stream/USERNAME/watch', function() {
		
		it( 'should delete the Youtube stream item from earlier test', function ( done ) {
			
			request({
				method: 'DELETE',
				url: 'http://localhost:' + PORT + '/api/stream/' + newTestUser.username + '/watch',
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

					response.statusCode.should.equal( 200 )

					done()
			})
		})
	})
})