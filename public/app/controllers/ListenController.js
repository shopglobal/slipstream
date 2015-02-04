app.controller('ListenController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {

	$http
		.get( 'api/stream/listen')
			.success( function ( data ) {
				$scope.songs = data
			})
			.error( function ( error ) {
				console.log( 'Error: ' + error)
			})

	$scope.deleteArticle = function ( id ) {
		$http.delete( 'api/stream/listen', { params: {
			id: id
		}})
			.error( function( error ) {
				console.log( error )
			})
	}

}])