// controls the user profile screen

app.controller('ProfileController', ['$scope', '$state', '$urlRouter', '$http', '$modal', function( $scope, $state, $urlRouter, $http, $modal ) {

	$http
		.get( '/api/users' )
			.success( function( data ) {
				$scope.user = data
			})
			.error( function( error ) {
				console.log( "Error retrieving user: " + error )
			})

}])