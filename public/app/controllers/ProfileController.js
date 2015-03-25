app.controller('ProfileController', ['$scope', '$state', '$urlRouter', '$http', '$modal', 'flash', function( $scope, $state, $urlRouter, $http, $modal, $flash) {

	$scope.passwords = {
		newPassword: "",
		oldPassword: ""
	}

	$http
		.get( '/api/users' )
			.success( function( data ) {
				$scope.user = data
			})
			.error( function( error ) {
				console.log( "Error retrieving user: " + error )
			})

	$scope.changePassword = function () {
		$http
			.post( '/api/user/password/change', {
				newPassword: $scope.passwords.newPassword,
				oldPassword: $scope.passwords.oldPassword
			})
			.success( function ( data ) {
				mixpanel.track( "Password changed", {
					result: "success"
				})
				location.reload()
			})
			.error( function ( error ) {
				mixpanel.track( "Password change error", {
					error: error
				})
				$flash.error = error
			})
	}

}])