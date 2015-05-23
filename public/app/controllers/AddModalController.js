app.controller('AddModalController', [ '$rootScope', '$stateParams', '$scope', '$window', '$state', '$urlRouter', '$http', '$modalInstance', 'flash', '$timeout', function( $rootScope, $stateParams, $scope, $window, $state, $urlRouter, $http, $modalInstance, $flash, $timeout ) {

	$scope.currentState = $state.current.name
	$scope.tags = []
	$scope.showPreview = false
	$scope.showSpinner = false
	$scope.contentParams = {
		url: '',
		type: $stateParams.stream,
		private: false
	}

	mixpanel.track( "Add modal opened" )

	// adds article ontent to the user's database and stream

	$scope.addContent = function () {
		$scope.showSpinner = true

		if ( $scope.contentParams.url.length === 0 ) {
			$scope.showPreview = false
			$scope.showSpinner = false
			$scope.deleteItem()
			return
		}

		if ( $scope.contentPreview ) {
			$scope.showPreview = false
			$scope.deleteItem()
		}

		$http
			.post( '/api/add', $scope.contentParams )
			.success( function ( data, status ) {
				$scope.contentPreview = data
				$scope.showPreview = true
				$scope.showSpinner = false
				console.log( data )
				mixpanel.track( "Added content", {
					stream: $scope.contentParams.type,
					title: data.title,
					url: $scope.contentParams.url
				})
				return
			})
			.error( function ( error, status ) {
				$scope.showSpinner = false
				$flash.error = "Problem adding content."
				return
			})
	}

	/*If the stream is switched after the URL is put in, delete the old one and save it again in the new stream.*/
	$scope.switchStream = function () {
		if ( $scope.contentParams.url.length >= 5 ) {
			$scope.showPreview = false
			$scope.showSpinner = true
			$scope.deleteItem()
			$timeout( function () {
				$scope.addContent()
				return
			}, 1500 )			
		} else {
			return
		}
	}

	// deletes article content from the user's databse and stream

	$scope.deleteItem = function () {
		var endPoint = '/api/stream/' + $scope.username + '/' + $scope.contentParams.type
		$http.delete( endPoint, { params: {
			id: $scope.contentPreview._id
		}})
		.success( function( data ) {
			// $scope.contentParams.url = ""
		})
		.error( function( error ) {
			console.log( error )
		})
	}

	// closes the modal and assumes user does NOT want to save
	// changes

	$scope.cancel = function() {
		if ( $scope.showPreview === true ) {
			mixpanel.track( "Adding", {
				action: "Cancelled",
				url: $scope.contentParams.url
			})
			$scope.deleteItem()
		}
		$modalInstance.close()
	}

	// "adds" the article by simple closing the modal and reloading
	// the state without deleting the article

	$scope.done = function( id ) {
		if ( !$scope.contentParams.private ) {
			$http.post( '/api/content/private', {
				id: $scope.contentPreview._id
			} )
			.success( function ( data ) {
				return
			})
			.error( function ( error ) {
				$flash.error = error
			})
		}
		if( $scope.tags.length === 0 ) {
			$modalInstance.close()
			mixpanel.track( "Adding", {
				action: "Done",
				url: $scope.contentParams.url,
				title: $scope.contentPreview.title
			} )
			insertToStream( $scope.contentPreview._id )
		} 
		if ( $scope.tags.length != 0 ) {
			$http.post( '/api/tags', { 
				id: $scope.contentPreview._id,
				tags: $scope.tags
			})
			.success( function ( result ) {
				$modalInstance.close()
				mixpanel.track( "Adding", {
					action: "Done",
					url: $scope.contentParams.url,
					title: $scope.contentPreview.title
				})
				mixpanel.track( "Tagging", {
					action: "Added",
					title: $scope.contentPreview.title,
					url: $scope.contentParams.url,
					tags: $scope.tags
				})
				insertToStream( $scope.contentPreview._id )
			})
			.error( function ( error ) {
				$flash.error = error
			})
		}
	}

	function insertToStream( id ) {
		$http.get( '/api/single/' + $window.localStorage.username, { params: {
			id: $scope.contentPreview._id  
		}} )
		.success( function ( data ) {
			$rootScope.content.items.unshift( data[0] )
		})
		.error( function ( error ) {
			console.log( error )

			$flash.error = error 
		})
	}

}])