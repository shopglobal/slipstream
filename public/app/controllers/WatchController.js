app.controller('WatchController', ['$scope', '$window', '$state', '$urlRouter', '$http', '$sce', 'Content', function( $scope, $window, $state, $urlRouter, $http, $sce, Content ) {

	$scope.videos = new Content()

	// $http
	// 	.get( 'api/stream/watch', { params: {
	// 		page: 
	// 	}})
	// 		.success( function ( data ) {
	// 			$scope.videos = data
	// 		})
	// 		.error( function ( error ) {
	// 			console.log( 'Error: ' + error)
	// 		})
}])