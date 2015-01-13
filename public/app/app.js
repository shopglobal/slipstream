var app = angular.module('SlipStream', ['ui.router'])

.config( [ '$stateProvider', '$urlRouterProvider', function( $stateProvider, $urlRouterProvider ) {
	$urlRouterProvider.otherwise('/home')

	$stateProvider
		.state( '/home', {
			url: '/home',
			templateUrl: 'views/home.html',
			controller: 'HomeController'
		})
}])

.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', function( $scope, $state, $urlRouter, $http ) {
	$scope.message = "hello"
}])