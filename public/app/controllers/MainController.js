app.controller('MainController', ['$scope', '$rootScope', '$window', '$state', '$urlRouter', '$http', 'Content', 'flash', '$modal', function( $scope, $rootScope, $window, $state, $urlRouter, $http, Content, $flash, $modal ) {

	if ( $state.current.name && typeof $state.current.name != undefined && $state.current.name != null && $state ) {
		console.log( "hello " + $state.current.name )
		mixpanel.track( "Visit", {
			state: $state.current.name ? $state.current.name : ''
		})
	}

	$scope.appName = "SlipStream"

	$rootScope.role = $window.localStorage.role

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
				$window.localStorage.username = data.username
				if ( data.role == 'admin' ) {
					$window.localStorage.role = 'admin'
				}
				mixpanel.identify( data.id )
				mixpanel.track( "User", {
					action: "Logged in" 
				})
				$state.go( 'app.stream', { 
					username: data.username, 
					stream: 'read',
					mode: 'stream'
				} )
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
				$window.localStorage.username = data.username
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
				$state.go( 'app.stream', { username: data.username, stream: 'read', mode: 'stream' } )
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

	// logs user out by deleting session storage and reloading the app

	$scope.logout = function() {
			delete $window.localStorage.token
			delete $window.localStorage.username
			delete $window.localStorage.mode
			delete $window.localStorage.role
			mixpanel.track( "User", {
				action: "Sign out"
			} )
			$state.go( 'landing.login' )
	}

	$scope.openManifesto = function () {
		mixpanel.track( "Landing", {
			action: "Opened Manifesto"
		})

		var modalInstance = $modal.open( {
			templateUrl: "app/views/reader-modal.html",
			windowClass: 'reader-modal',
			controller: function ( $scope ) {
				$scope.closeModal = function() {
					modalInstance.close()
				}

				$http.get( '/app/views/manifesto.json' )
				.success( function ( data ) {
					$scope.article = data
				})
				.error( function ( error ) {
					console.log( error )
				})
			}
		})
	}

	$scope.waitlist = function () {
		$http
			.post( '/api/user/waitlist', {
				email: $scope.user.email
			})
			.success( function ( data ) {
				mixpanel.identify( data.id )
				mixpanel.track( "Landing", {
					action: "Waitlisted" 
				})

				$flash.success = data
			})
			.error( function ( error ) {
				$flash.error = error
			})
	}

}])
