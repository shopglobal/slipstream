var app = angular.module('SlipStream', ['ui.router'])

.config( [ '$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
	$urlRouterProvider.otherwise('/home')

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
}])

.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', function( $scope, $state, $urlRouter, $http ) {
	$scope.message = "hello"
}])

.controller('LoginController', ['$scope', '$state', '$urlRouter', '$http', function( $scope, $state, $urlRouter, $http ) {
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
				window.sessionStorage.token = data.token
			} )
			.error( function ( data, status ) {
				delete $window.sessionStorage.token
				alert( "Error signing in: " + status )
			} )
	}
}])