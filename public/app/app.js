var app = angular.module('SlipStream', ['ui.router', 'ui.bootstrap', 'ui.keypress', 'infinite-scroll', 'yaru22.angular-timeago', 'iframely', 'ngSanitize' ])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', '$sceDelegateProvider', function( $stateProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider ) {
	
	// sets default state

	$urlRouterProvider.otherwise('/home')
	
	// whitelists outside scripts for iframe use

	$sceDelegateProvider.resourceUrlWhitelist( [
		'self',
		'https://www.youtube.com/**',
		'https://w.soundcloud.com/**',
		'https://api.soundcloud.com/**'
	] )

	// add the custom service to add Authenticaiotn to header

	$httpProvider.interceptors.push('authInterceptor')

	$stateProvider
		.state( 'landing', {
			url: '/home',
			templateUrl: 'views/landing.html'
		})
		.state( 'landing.login', {
			url: '/login',
			templateUrl: 'views/login.html'
		})
		.state( 'landing.register', {
			url: '/register',
			templateUrl: 'views/register.html'
		})
		.state( 'app', {
			url: '/app',
			templateUrl: 'views/app.html',
			controller: 'MainController'
		})
		.state( 'app.home', {
			url: '/main',
			templateUrl: 'views/home.html',
			controller: 'HomeController'
		})
		.state( 'app.read', {
			url: '/read',
			templateUrl: 'views/articles.html',
			controller: 'ArticlesController'
		})
		.state( 'app.watch', {
			url: '/watch',
			templateUrl: 'views/watch-stream.html',
			controller: 'WatchController'
		})
		.state( 'app.login', {
			url: '/login',
			templateUrl: 'views/login.html'
		})
		.state( 'app.profile', {
			url: '/profile',
			templateUrl: 'views/profile.html',
			controller: 'ProfileController'
		})
		.state( 'app.listen', {
			url: '/listen',
			templateUrl: 'views/listen-stream.html',
			controller: 'ListenController'
		})
}])

.controller('MainController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', function( $scope, $window, $state, $urlRouter, $http, Content ) {

	$scope.appName = "SlipStream"

	$scope.user = {
		username: '',
		password: ''
	}

	$scope.reg = {
		username: '',
		password: '',
		email: ''
	}

	// logs in. signs in and returns the user's token into her
	// session storage

	$scope.login = function() {
		$http
			.post( '/api/authenticate', $scope.user )
			.success( function ( data, status ) {
				$window.sessionStorage.token = data.token
				$state.go( 'app.home' )
			} )
			.error( function ( data, status ) {
				delete $window.sessionStorage.token
				console.log( "Error signing in: " + status )
			} )
	}

	// registartion 

	$scope.register = function () {
		$http
			.post( 'api/signup', $scope.reg )
			.success( function ( data ) {
				$window.sessionStorage.token = data.token
				$state.reload()
			})
			.error( function ( data, status ) {
				delete $window.sessionStorage.token
			})
	}

}])

// service to add the token the header of the request

.factory('authInterceptor', [ '$window', function ( $window ) {	
		return {
			request : function (config) {
				config.headers = config.headers || {}
				var iframelyPath = "http://" + location.hostname + ":8061/iframely"
				if ( $window.sessionStorage.token && config.url !==  iframelyPath ) {
					config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token
				}
				return config
			}
		}
} ] )

// gets content for infinite scrolling. usage: loadMore( TYPE, AMOUNT )

.value( 'THROTTLE_MILLISECONDS', 500 )

.factory( 'Content', [ '$http', function ( $http ) {
	var Content = function () {
		this.items = []
		this.busy = false
		this.page = 1
		THROTTLE_MILLISECONDS = 1000
	}

	Content.prototype.loadMore = function ( type, show ) {
		if ( this.busy )
			return

		this.busy = true

		$http
			.get( 'api/stream/' + type, { params: { 
				show: show, 
				page: this.page 
			} } )
				.success( function ( data ) {
					for( i = 0; i < data.length; i++) {
						this.items.push( data[i] )
					}
				
					this.page++
					this.busy = false
			}.bind(this))
	}

	return Content
}])