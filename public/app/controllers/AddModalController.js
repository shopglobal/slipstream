app.controller('AddModalController', ['$scope', '$window', '$state', '$urlRouter', '$http', '$modalInstance', 'flash', function( $scope, $window, $state, $urlRouter, $http, $modalInstance, $flash ) {

	$scope.currentState = $state.current.name
	$scope.tags = []
	$scope.showPreview = false
	$scope.showSpinner = false
	$scope.contentParams = {
		url: '',
		type: $state.current.name.split(".")[1]
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
			})
			.error( function ( error, status ) {
				$scope.showSpinner = false
				$flash.error = "Problem adding content."
			})
	}

	// deletes article content from the user's databse and stream

	$scope.deleteItem = function () {
		var endPoint = '/api/stream/' + $scope.contentParams.type
		$http.delete( endPoint, { params: {
			id: $scope.contentPreview._id
		}})
		.success( function( data ) {
			$scope.contentParams.url = ""

		})
		.error( function( error ) {
			console.log( error )
		})
	}

	// closes the modal and assumes user does NOT want to save
	// changes

	$scope.cancel = function() {
		if ( $scope.showPreview === true ) {
			mixpanel.track( "Add item cancelled", {
				url: $scope.contentParams.url
			})
			$scope.deleteItem()
		}
		$modalInstance.close()
	}

	// "adds" the article by simple closing the modal and reloading
	// the state without deleting the article

	$scope.done = function( id ) {
		if( $scope.tags.length === 0 ) {
			$modalInstance.close()
			mixpanel.track( "Add modal done", {
				url: $scope.contentParams.url,
				title: $scope.contentPreview.title
			} )
			$state.reload()
		} else {
			$http
				.post( '/api/tags', { 
					id: $scope.contentPreview._id,
					tags: $scope.tags
				})
				.success( function ( result ) {
					$modalInstance.close()
					mixpanel.track( "Add modal done", {
						url: $scope.contentParams.url,
						title: $scope.contentPreview.title
					})
					mixpanel.track( "Tags added",{
						title: $scope.contentPreview.title,
						url: $scope.contentParams.url,
						tags: $scope.tags
					})
					$state.reload()
				})
				.error( function ( error ) {
					$flash.error = error
				})
		}
	}

}])