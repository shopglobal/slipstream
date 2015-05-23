app.controller( 'ItemController', [ '$scope', '$http', '$stateParams', '$state', '$window', function ( $scope, $http, $stateParams, $state, $window ) {

	$scope.role = $window.localStorage.role
	$scope.$state = $state
	$scope.username = $window.localStorage.username
	$scope.currentUser = $stateParams.username
	$scope.currentStream = $stateParams.stream

	$http.get( '/api/single/' + $stateParams.username, { params: { 
		slug: $stateParams.slug 
	}})
	.then( function ( response, error ) {
		$scope.article = response.data[0]
	})

}])