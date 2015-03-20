app.controller('MainController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', 'flash', function( $scope, $window, $state, $urlRouter, $http, Content, $flash ) {

	$scope.appName = "SlipStream"

	$scope.$state = $state

	$scope.user = {
		username: '',
		password: '',
		email: ''
	}

	$scope.reg = {
		username: '',
		password: '',
		email: '',
		betakey: ''
	}

	$scope.feedbackOptions = {
		ajaxURL: '/api/feedback',
		postBrowserInfo: true,
		postURL: true
	}

	// logs in. signs in and returns the user's token into her
	// session storage

	$scope.login = function() {
		$http
			.post( '/api/authenticate', $scope.user )
			.success( function ( data, status ) {
				$window.sessionStorage.token = data.token
				$state.go( 'app.read' )
			} )
			.error( function ( error ) {
				console.log( error )
				delete $window.sessionStorage.token
				$flash.error = "Error signing in." 
			} )
	}

	// registartion 

	$scope.register = function () {
		$http
			.post( 'api/signup', $scope.reg )
			.success( function ( data ) {
				$window.sessionStorage.token = data.token
				$state.go( 'app.read' )
			})
			.error( function ( error ) {
				$flash.error = error
				delete $window.sessionStorage.token
			})
	}

	$scope.resetPassword = function () {
		if ( $scope.user.email.length == 0 ) {
			$flash.error = "Email address required!"
		} else {
			$http
				.get( 'api/user/password/reset', {
					params: { email: $scope.user.email }
				})
				.success( function ( data ) {
					$flash.success = data
				})
				.error( function ( error ) {
					$flash.error = error
				})
		}
	}

}])
