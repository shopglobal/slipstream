app.controller('HomeController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', 'flash', 'Content', 'Search', 'Discover', function( $scope, $state, $urlRouter, $http, $window, $location, $modal, $flash, Content, Search, Discover ) {

	$window.scrollTo( 0, 0 )

	$scope.mode = window.localStorage.mode

	if ( $scope.mode != 'discover' ) {
		$scope.currentStream = $state.current.name.split(".")[1]
		$scope.content = new Content()
	} else if ( $scope.mode == 'discover' ) {
		$scope.content = new Discover()
		$scope.content.loadMore( $state.current.name.split(".")[1], 3 )
	}
	

	mixpanel.track( "Viewed stream", {
		stream: $state.current.name.split(".")[1]
	})

	// $scope.search = new Search()

	$scope.doSearch = function() {
		if ( $scope.search.query.length < 1 ) {
			$scope.content = new Content()
			$scope.content.loadMore( $state.current.name.split(".")[1], 3)
			return
		}

		$scope.content = new Search()
		$scope.content.query = $scope.search.query
		$scope.content.loadMore( $state.current.name.split(".")[1], 3 )
		mixpanel.track( "Searched", { 
			query: $scope.search.query
		} )
	}

	$scope.discover = function() {
		setTimeout( function () {
			if ( $scope.mode == 'discover' ) {
				$scope.content = new Discover()
				$scope.content.loadMore( $state.current.name.split(".")[1], 3 )
				$state.reload()
			} else {
				$scope.content = new Content()
				$scope.content.loadMore( $state.current.name.split(".")[1], 3)
				$state.reload()
			}
		}, 50)
	}

	// logs user out by deleting session storage and reloading the app

	$scope.logout = function() {
			delete $window.sessionStorage.token
			mixpanel.track( "Logged out" )
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

	// $scope.$on( '$stateChangeStart', function () {
	// 	if ( $window.localStorage.length !== 1 ) {
	// 		$state.go( 'landing.login')
	// 	}
	// })

	// deletes an item. format: ` delete( type(string), id ) `

	$scope.deleteItem = function ( type, id ) {
		$http.delete( 'api/stream/' + type, { params: { id: id } } )
		.success( function ( data, status ) {
			mixpanel.track( "Deleted item", {
				stream: type,
				content_id: id
			})
			console.log( data )
			$scope.content.loadMore( $state.current.name.split(".")[1], 2 )
		})
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
				mixpanel.track( "Added tag", {
					tag: tag
				})
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
				mixpanel.track( "Removed tag", {
					tag: tag
				})
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.openReaderModal = function ( article ) {
		console.log( "modal should open ")

		mixpanel.track( "Opened reader", {
			article: article
		})

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