app.controller('ArticlesController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {

	$http
		.get( 'api/stream/read', { params: { 
			show: 3, 
			page: 1 
		} } )
			.success( function ( data ) {
				$scope.articles = data
			})
			.error( function ( error ) {
				console.log( 'Error: ' + error)
			})

	$scope.deleteArticle = function ( id ) {
		$http.delete( 'api/stream/read', { params: {
			id: id
		}})
			.error( function( error ) {
				console.log( error )
			})
	}

}])