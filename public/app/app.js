var app = angular.module('SlipStream', ['ui.router', 'ngStorage'])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', function( $stateProvider, $urlRouterProvider, $httpProvider ) {
	$urlRouterProvider.otherwise('/home')

	//
	// add the custom service to add Authenticaiotn to header
	//
	$httpProvider.interceptors.push('authInterceptor')
	// $httpProvider.interceptors.push('authCheck')

	$stateProvider
		.state( 'home', {
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

.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$sessionStorage', '$location', function( $scope, $state, $urlRouter, $http, $window, $sessionStorage, $location ) {
	$scope.user = {
		username: '',
		password: ''
	}

	$scope.login = function() {
		$http
			.post( '/api/authenticate', $scope.user )
			.success( function ( data, status ) {
				$window.sessionStorage.token = data.token
				location.reload()
			} )
			.error( function ( data, status ) {
				delete $window.sessionStorage.token
				console.log( "Error signing in: " + status )
			} )
	}

	$scope.logout = function() {
			delete $window.sessionStorage.token
			location.reload()
	}

	//
	// check if there is sessionStorage, which is probably an auth token
	//
	var init = function () {
		if ( $window.sessionStorage.length > 0 )
			$scope.isLoggedIn = true
	}

	//
	// deletes the current account
	//
	$scope.deleteAccount = function () {
		$http
			.delete( '/api/users' )
			.success( function () {
				delete $window.sessionStorage.token
				$state.go( 'home' )
				location.reload()
			})
	}

	init()

}])

.controller('ProfileController', ['$scope', '$state', '$urlRouter', '$http', function( $scope, $state, $urlRouter, $http ) {

	$http
		.get( '/api/users' )
			.success( function( data ) {
				$scope.user = data
			})
			.error( function( error ) {
				console.log( "Error retrieving user: " + error )
			})

}])

.controller('LoginController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {



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
		}
	}
} ] )

	//
	// set a scope variable for whether a user is signed in or not
	//
	// .factory('authCheck', [ '$window', '$rootScope', function ( $window, $rootScope ) {
	// 		$rootScope.isLoggedIn = false;
	//
	// 		if ( $window.sessionStorage.token ) {
	// 			$rootScope.isLoggedIn = true;
	// 		}
	//
	// 		return $rootScope.isLoggedIn;
	// }])
