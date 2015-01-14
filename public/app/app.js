var app = angular.module('SlipStream', ['ui.router'])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', function( $stateProvider, $urlRouterProvider, $httpProvider ) {
	$urlRouterProvider.otherwise('/home')

	$httpProvider.interceptors.push('authInterceptor')

	$stateProvider
		.state( '/home', {
			url: '/home',
			templateUrl: 'views/home.html',
			controller: 'HomeController'
		})
		.state( '/login', {
			url: '/login',
			templateUrl: 'views/login.html',
			controller: 'LoginController'
		})
		.state( '/profile', {
			url: '/profile',
			templateUrl: 'views/profile.html',
			controller: 'ProfileController'
		})
}])

.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', function( $scope, $state, $urlRouter, $http ) {
	$scope.message = "hello"
}])

.controller('ProfileController', ['$scope', '$state', '$urlRouter', '$http', function( $scope, $state, $urlRouter, $http ) {

	$http
		.get( '/api/users' )
			.success( function( data ) {
				$scope.user = data
				console.log( $scope.user.email )
			})
			.error( function( error ) {
				console.log( "Error retrieving user: " + error )
			})
}])

.controller('LoginController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {
	$scope.user = {
		username: '',
		password: ''
	}

	$scope.login = function() {
		console.log( "Username: " + $scope.user.username + " Password: " + $scope.user.password )
		$http
			.post( '/api/authenticate', $scope.user )
				.success( function ( data, status ) {
					console.log( "Authentication successful: " + data.token )
					$window.sessionStorage.token = data.token
				} )
				.error( function ( data, status ) {
					delete window.sessionStorage.token
					console.log( "Error signing in: " + status )
				} )
	}
}])

//
// service to add the token the header of the request
//
.factory('authInterceptor', [ '$window', function ( $window ) {
	return {
		request : function (config) {
			config.headers = config.headers || {}
			if ( $window.sessionStorage.token ) {
				config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token
			}
			return config
		},
//		response: function ( response ) {
//			if ( response.status === 403 )
//				console.log ( "Authorization failed" )
//			}
	}
} ] )
