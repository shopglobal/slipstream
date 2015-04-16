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
				$window.localStorage.token = data.token
				mixpanel.identify( data.id )
				mixpanel.track( "Logged in" )
				$state.go( 'app.read' )
			} )
			.error( function ( error ) {
				console.log( error )
				delete $window.localStorage.token
				$flash.error = "Error signing in." 
			} )
	}

	// registartion 

	$scope.register = function () {
		$http
			.post( 'api/signup', $scope.reg )
			.success( function ( data ) {
				$window.localStorage.token = data.token
				mixpanel.identify( data.id )
				mixpanel.people.set({
				    "id": data._id,
				    "$email": data.email,
				    "$created": new Date(),
				    "$last_login": new Date(),
				    "$name": data.username
				})
				mixpanel.track( "User", {
					action: "Registered"
				} )
				$state.go( 'app.read' )
			})
			.error( function ( error ) {
				$flash.error = error
				delete $window.localStorage.token
			})
	}

	$scope.deleteAccount = function () {
		$http
			.delete( '/api/users' )
			.success( function ( data ) {
				mixpanel.track( "User", {
					action: "Delete account"
				} )
				$state.go( 'landing.splash' )
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

	$scope.resetPassword = function () {
		if ( $scope.user.email.length == 0 ) {
			$flash.error = "Email address required!"
			mixpanel.track( "User", {
				action: "Password reset failed",
				error: "Email address required!"
			})
		} else {
			$http
				.get( 'api/user/password/reset', {
					params: { email: $scope.user.email }
				})
				.success( function ( data ) {
					mixpanel.track( "User", {
						action: "Password reset"
					} )
					$flash.success = data
				})
				.error( function ( error ) {
					mixpanel.track( "User", {
						action: "Password reset failed",
						error: error
					} )
					$flash.error = error
				})
		}
	}

}])
