app.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', function( $scope, $state, $urlRouter, $http, $window, $location, $modal ) {
	
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
				location.reload()
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

	// logs user out by deleting session storage and reloading the app

	$scope.logout = function() {
			delete $window.sessionStorage.token
			location.reload()
	}


	// deletes the currently signed-in account

	$scope.deleteAccount = function () {
		$http
			.delete( '/api/users' )
			.success( function () {
				delete $window.sessionStorage.token
				$state.go( 'home' )
				location.reload()
			})
	}


	// opens the "add content" model when a user click's "add"

	$scope.openAddModal = function () {
		var modalInstance = $modal.open( {
			templateUrl: "views/add.html",
			controller: 'AddModalController',
			windowClass: 'add-modal'
		})
	}


	// check if there is sessionStorage, which is probably an auth token

	$scope.$on('$stateChangeStart', function () {
		if ( $window.sessionStorage.length == 1 ) {
			$scope.isLoggedIn = true
		}
	})

	// deletes an item. format: ` delete( type(string), id ) `

	$scope.deleteItem = function ( type, id ) {
		$http.delete( 'api/stream/' + type, { params: { id: id } } )
		.error( function ( error ) {
			console.log( error )
		})
	}

}])