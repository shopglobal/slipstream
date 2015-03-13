app.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', 'flash', function( $scope, $state, $urlRouter, $http, $window, $location, $modal, $flash ) {
	
	$scope.query = ''

	// logs user out by deleting session storage and reloading the app

	$scope.logout = function() {
			delete $window.sessionStorage.token
			$state.go( 'landing.login' )
	}

	// deletes the currently signed-in account

	$scope.deleteAccount = function () {
		$http
			.delete( '/api/users' )
			.success( function () {
				delete $window.sessionStorage.token
				$state.go( 'landing' )
				location.reload()
			})
	}

	// opens the "add content" model when a user click's "add"

	$scope.openAddModal = function () {
		var modalInstance = $modal.open( {
			templateUrl: "app/views/add.html",
			controller: 'AddModalController',
			windowClass: 'add-modal'
		})
	}

	// check if there is sessionStorage, which is probably an auth token

	$scope.$on('$stateChangeStart', function () {
		if ( $window.sessionStorage.length !== 1 ) {
			$state.go( 'landing.login ')
		}
	})

	// deletes an item. format: ` delete( type(string), id ) `

	$scope.deleteItem = function ( type, id ) {
		$http.delete( 'api/stream/' + type, { params: { id: id } } )
		.error( function ( error ) {
			console.log( error )
		})
	}

	$scope.search = function() {
		if ( $scope.query == '' )
			return $scope.hits = null

		$http
			.get( '/api/search', { params: 
				{ terms: $scope.query }
			} )
			.success( function ( results ) {
				$scope.hits = results
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

}])