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
		$scope.item = response.data[0]

		getPublisher( response.data[0].url )

		$rootScope.OG = {
			title: $scope.item.title,
			description: $scope.item.description,
			image: $scope.item.images[ $scope.item.thumbnail ]
		}
	})

	function getPublisher ( url ) {
		var tempElem = document.createElement( "a" )
		tempElem.href = url
		$scope.publisher = tempElem.hostname
	}

}])