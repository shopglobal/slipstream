app.controller('AddModalController', ['$scope', '$window', '$state', '$urlRouter', '$http', '$modalInstance', function( $scope, $window, $state, $urlRouter, $http, $modalInstance ) {

	$scope.currentState = $state.current.name
	$scope.showPreview = false
	$scope.showSpinner = false
	$scope.contentParams = {
		url: '',
		type: $state.current.name.split(".")[1]
	}

	// attempts to detect if a user deletes the url in the url field and
	// deletes the last stream entry if they do

	$scope.blankCheck = function () {
		if ( $scope.contentParams.url.length === 0 ) {
			$scope.showPreview = false
			$scope.showSpinner = false
			$scope.deleteItem()
		}
	}

	// adds article ontent to the user's database and stream

	$scope.addContent = function () {
		$scope.showSpinner = true
		$http
			.post( '/api/add', $scope.contentParams )
			.success( function ( data, status ) {
				$scope.contentPreview = data
				$scope.showPreview = true
				$scope.showSpinner = false
			})
			.error( function ( error, status ) {
				console.log( "Error adding article: " + error + "| status: " + status + " | params: " + $scope.contentParams.url )
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
		if ( $scope.showPreview === true )
			$scope.deleteItem()
		$modalInstance.close()
	}

	// "adds" the article by simple closing the modal and reloading
	// the state without deleting the article

	$scope.done = function() {
		$modalInstance.close()
		$state.reload()
	}

}])