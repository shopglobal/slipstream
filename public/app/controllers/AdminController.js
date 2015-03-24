app.controller('AdminController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', 'flash', 'Content', 'Search', function( $scope, $state, $urlRouter, $http, $window, $location, $modal, $flash, Content, Search ) {

	$scope.getBetaKeys = function( amount ) {
		
		$http
			.get( '/api/betakeys', {
				params: {
					amount: amount
				}
			})
			.success( function ( data, status ) {
				$scope.newBetaKeys = data
				mixpanel.track( "Made beta keys", {
					amount: amount
				})
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}
}])