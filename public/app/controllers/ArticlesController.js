app.controller('ArticlesController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', function( $scope, $window, $state, $urlRouter, $http, Content ) {

	// $http
	// 	.get( 'api/stream/read', { params: { 
	// 		show: 5, 
	// 		page: 1 
	// 	} } )
	// 		.success( function ( data ) {
	// 			$scope.articles = data
	// 		})
	// 		.error( function ( error ) {
	// 			console.log( 'Error: ' + error)
	// 		})

	$scope.articles = new Content()

	// $scope.loadMore = function () {
		
	// 	var last = ( $scope.articles.length / 3 )

	// 	$http
	// 		.get( 'api/stream/read', { params: { 
	// 			show: 3, 
	// 			page: last + 1
	// 		} } )
	// 			.success( function ( data ) {
	// 				$scope.articles.push( data )
	// 			})
	// 			.error( function ( error ) {
	// 				console.log( 'Error: ' + error)
	// 			})
	// }

}])