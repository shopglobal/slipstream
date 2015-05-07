app.controller('AdminController', ['$scope', '$state', '$urlRouter', '$http', '$window', '$location', '$modal', 'flash', 'Content', 'Search', function( $scope, $state, $urlRouter, $http, $window, $location, $modal, $flash, Content, Search ) {

	$scope.getBetaKeys = function( amount ) {
		
		$http
			.post( '/api/betakeys', {
				amount: amount
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

	$http
		.get( '/api/betakeys' )
		.success( function ( data, status ) {
			$scope.oldBetaKeys = data
		})

	$scope.toggleSent = function( key ) {
		$http
			.post( '/api/betakeys/sent', {
				key: key
			} )
			.success( function ( result ) {
				$flash.success = result
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.sendBetakey = function ( user ) {
		$http.post( '/api/user/sendbetakey', { email: user.email } )
		.success( function ( data ) {
			$flash.success = data
			user.hide = true
		})
		.error( function ( error ) {
			$flash.error = error
			console.log( error )
		})
	}

	$http
		.get( '/api/user/waitlist' )
		.success( function ( data ) {
			$scope.waitlist = data
		})
		.error( function ( error ) {
			$flash.error = error
			console.log( error )
		})
}])