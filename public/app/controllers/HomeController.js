app.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', 'flash', 'Content', 'Search', function( $scope, $state, $urlRouter, $http, $window, $location, $modal, $flash, Content, Search ) {

	$scope.currentStream = $state.current.name.split(".")[1]

	$scope.content = new Content()

	// $scope.search = new Search()

	$scope.doSearch = function() {
		if ( $scope.search.query.length < 1 ) {
			$scope.content = new Content()
			$scope.content.loadMore( $state.current.name.split(".")[1], 2)
			return
		}

		$scope.content = new Search()
		$scope.content.query = $scope.search.query
		$scope.content.loadMore( $state.current.name.split(".")[1], 2 )
	}

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

	$scope.tagAdded = function ( tag, contentId ) {
		$http
			.post( '/api/tags', { 
				id: contentId,
				tags: [ tag ]
			})
			.success( function ( result ) {
				$flash.success = "Tag added."
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.tagRemoved = function ( tag, contentId ) {
		$http
			.delete( '/api/tags', { params: {
				id: contentId,
				tag: tag
			} } )
			.success( function ( result ) {
				$flash.success = "Tag removed."
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.openReaderModal = function ( article ) {
		console.log( "modal should open ")

		var modalInstance = $modal.open( {
			templateUrl: "app/views/reader-modal.html",
			windowClass: 'reader-modal',
			controller: 'ReaderModalController',
			resolve: {
				article: function() {
					return article
				}
			}
		})
	}
}])