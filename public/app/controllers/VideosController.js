app.controller('VideosController', ['$scope', '$window', '$state', '$urlRouter', '$http', '$sce', function( $scope, $window, $state, $urlRouter, $http, $sce ) {

	$http
		.get( 'api/stream/videos')
			.success( function ( data ) {
				$scope.videos = data
			})
			.error( function ( error ) {
				console.log( 'Error: ' + error)
			})



	// $scope.deleteArticle = function ( id ) {
	// 	$http.delete( 'api/stream/articles', { params: {
	// 		id: id
	// 	}})
	// 		.error( function( error ) {
	// 			console.log( error )
	// 		})
	// }
}])