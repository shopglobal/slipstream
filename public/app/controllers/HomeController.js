app.controller('HomeController', [ '$stateParams', '$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', 'flash', 'Content', 'Search', 'Discover', 'Following', function( $stateParams, $scope, $state, $urlRouter, $http, $window, $location, $modal, $flash, Content, Search, Discover, Following ) {

	$window.scrollTo( 0, 0 )

	$scope.mode = $stateParams.mode
	$scope.currentUser = $stateParams.username
	$scope.currentStream = $stateParams.stream
	$scope.username = $window.localStorage.username

	if ( $scope.mode == 'stream' ) {
		if ( $scope.currentUser == $scope.username ) {
			$scope.mode = 'mystream'
		} else if ( $scope.currentUser != $scope.username ) {
			$scope.mode = 'visiting'
		}
	}

	console.log( $state )
	console.log( $stateParams )

	if ( $scope.mode == 'mystream' || $scope.mode == 'visiting' ) {
		$scope.content = new Content()
	} if ( $scope.mode == 'discover' ) {
		$scope.content = new Discover()
		$scope.content.loadMore( 3 )
	} if ( $scope.mode == 'following' ) {
		$scope.content = new Following()
		$scope.content.loadMore( 3 )
	}

	mixpanel.track( "Stream", {
		action: "Viewed",
		stream: $state.current.name.split(".")[1]
	})

	// $scope.search = new Search()

	$scope.doSearch = function() {
		if ( $scope.search.query.length < 1 ) {
			$scope.userlist = null
			$scope.content = new Content()
			$scope.content.loadMore( 3 )
			return
		}

		if ( $scope.search.query.indexOf( '@' ) == 0 ) {
			if ( $scope.content ) $scope.content = null
			$scope.searchUsers()
			return
		}

		$scope.content = new Search()
		$scope.content.query = $scope.search.query
		$scope.content.loadMore( 3 )
		mixpanel.track( "Searched", { 
			query: $scope.search.query
		} )
	}

	$scope.searchUsers = function () {
		$http
			.get( '/api/user/search', { params: { 
				search: $scope.search.query
			} } )
			.success( function ( data ) {
				$scope.userlist = data
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.modeChange = function ( newMode ) {
		$window.localStorage.mode = newMode
	}

	$scope.discover = function() {
		setTimeout( function () {
			if ( $scope.mode == 'discover' ) {
				$scope.content = new Discover()
				$scope.content.loadMore( 3 )
				$state.reload()
			} else {
				$scope.content = new Content()
				$scope.content.loadMore( 3 )
				$state.reload()
			}
		}, 50)
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
		$http.delete( 'api/stream/' + $scope.username + '/' + type, { 
			params: { id: id } 
		} )
		.success( function ( data, status ) {
			mixpanel.track( "Deleted item", {
				stream: type,
				content_id: id
			})
			console.log( data )
			$scope.content.loadMore( 2 )
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
				mixpanel.track( "Taggin", {
					action: "Added",
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
				mixpanel.track( "Tagging", {
					action: "Removed",
					tag: tag
				})
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.openReaderModal = function ( article ) {
		console.log( "modal should open ")

		mixpanel.track( "Reader", {
			action: "Opened",
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

	$scope.addContent = function ( url ) {
		$http
			.post( '/api/add', {
				url: url,
				type: $scope.currentStream
			} )
			.success( function ( data, status ) {
				console.log( data )
				$flash.success = "Content added to your stream."
				mixpanel.track( "Added content", {
					action: "Re-stream",
					stream: $scope.currentStream,
					title: data.title,
					url: url
				})
				return
			})
			.error( function ( error, status ) {
				$flash.error = "Problem adding content."
				return
			})
	}

}])