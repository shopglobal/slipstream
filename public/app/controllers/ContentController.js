app.controller('ContentController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', 'flash',function( $scope, $window, $state, $urlRouter, $http, Content, $flash ) {

	$scope.currentStream = $state.current.name.split(".")[1]

	$scope.content = new Content()

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

}])