var app = angular.module('SlipStream', ['ui.router', 'ui.bootstrap'])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', function( $stateProvider, $urlRouterProvider, $httpProvider ) {
	$urlRouterProvider.otherwise('/home')

	//
	// add the custom service to add Authenticaiotn to header
	//
	$httpProvider.interceptors.push('authInterceptor')

	$stateProvider
		.state( 'home', {
			url: '/home',
			templateUrl: 'views/home.html',
			controller: 'HomeController'
		})
		.state( 'articles', {
			url: '/articles',
			templateUrl: 'views/articles.html',
			controller: 'ArticlesController'
		})
		.state( '/login', {
			url: '/login',
			templateUrl: 'views/login.html'
		})
		.state( '/profile', {
			url: '/profile',
			templateUrl: 'views/profile.html',
			controller: 'ProfileController'
		})
}])

// home control, and parent controller containing all others. put global
// things here.

.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', function( $scope, $state, $urlRouter, $http, $window, $location, $modal ) {
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

	$scope.openAddModal = function () {
		var modalInstance = $modal.open( {
			templateUrl: "views/add.html",
			controller: 'AddModalController'
		})
	}

	//
	// check if there is sessionStorage, which is probably an auth token
	//
	$scope.$on('$stateChangeStart', function () {
		if ( $window.sessionStorage.length == 1 ) {
			console.log( "you're logged in" )
			$scope.isLoggedIn = true
		}
	})

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

// controller for the "add" modal (pop-up) used when adding items to streams

.controller('AddModalController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {

	$scope.contentParams = {
		url: '',
		type: ''
	}

	$scope.addContent = function () {
		$http
			.post( '/api/add', $scope.contentParams )
			.success( function ( data, status ) {
				$scope.contentPreview = data
				$scope.showPreview = true
			})
			.error( function ( error, status ) {
				console.log( "Error: " + error + " " + status )
			})
	}

	$scope.deleteArticle = function () {
		console.log('delete clicked')
		$http.delete( 'api/stream/articles', { params: {
			id: $scope.contentPreview._id
		}})
		.success( function( data ) {
			$scope.contentParams.url = ""
		})
		.error( function( error ) {
			console.log( error )
		})
	}

}])

// controller for the articles stream.

.controller('ArticlesController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {

	$http
		.get( 'api/stream/articles')
			.success( function ( data ) {
				$scope.articles = data
			})
			.error( function ( error ) {
				console.log( 'Error: ' + error)
			})

	$scope.deleteArticle = function ( id ) {
		console.log('delete clicked')
		$http.delete( 'api/stream/articles', { params: {
			id: id
		}})
			.success( function( data ) {
				console.log( data )
			})
			.error( function( error ) {
				console.log( error )
			})
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
