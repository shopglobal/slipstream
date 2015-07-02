app.controller( 'ItemController', [ '$scope', '$http', '$stateParams', '$state', '$window', '$rootScope', function ( $scope, $http, $stateParams, $state, $window, $rootScope ) {

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

		$rootScope.OG = {
			title: $scope.article.title,
			description: $scope.article.description,
			image: $scope.article.images[ $scope.article.thumbnail ]
		}
	})

}])