app.controller('MainController', ['$scope', '$rootScope', '$window', '$state', '$urlRouter', '$http', 'Content', 'flash', '$modal', function( $scope, $rootScope, $window, $state, $urlRouter, $http, Content, $flash, $modal ) {

	/*Attemps to try track any visit in mixpanel as an event called Visit with property state to show the current state.*/

/*	$scope.$watch( '$state.current.name', function ( newValue, oldValue ) {
		if ( newValue != oldValue ) {
			$window.mixpanel.track( "Visit", {
				state: $window.location.pathname
			})
		}
	})*/

	$scope.appName = "Slipstream"

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

	/*FaceBook Open Graph default data*/

	$rootScope.OG = {
		image: "http://slipstream-dev.s3.amazonaws.com/meta_image.png",
		title: "Slipstream",
		content: "Slipstream is the most delightful way to save all your favourite content, enjoy it again later, and discover more. Three distinct feeds separate content by media type so that you don't have to go looking. When you're in the mood to watch something, videos are all conveniently in one place, same goes for reading and listening. Slipstream isn't about gaining followers, so there's no incentive to post more frequently - making Discovery on Slipstream it's best feature. See what other users have been collecting that actually matters to them. We're building a platform for all the best content on the web to call home."
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
				/*	Used when an admin wants to make a manual edit to a post. A user must be authorized as an admin on the back-end for this to do antything*/
				$scope.adminEdit = false

				$scope.adminMode = function() {
					$scope.adminEdit = !$scope.adminEdit
				}

				$scope.saveAdminEdit = function () {
					$http.post( '/api/content/edit', { 
						id: $scope.item._id, 
						changes: { text: $scope.item.text }
					})
					.then( function ( response, error ) {
						if ( error ) return $flash.error = error

						$flash.success = response.data
						$modalInstance.close()
					})
				}

				$scope.closeModal = function() {
					modalInstance.close()
				}

				$http.get( '/api/single/manifesto' )
				.success( function ( data ) {
					$scope.item = data
				})
				.error( function ( error ) {
					console.log( error )
					$flash.error = error
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

	$rootScope.adminEditThumb = function ( object ) {
		$http.post( 'api/content/edit', {
			id: object.id,
			changes: {
				thumbnail: object.thumbnail
			}
		})
		.then( function ( response, error ) {
			if ( error ) return $flash.error = error

			$flash.success = response.data
		})
	}

	$rootScope.adminEditTitle = function ( newValue, object ) {
		$http.post( 'api/content/edit', {
			id: object._id,
			changes: {
				title: newValue
			}
		})
		.then( function ( response, error ) {
			if ( error ) return $flash.error = error

			$flash.success = response.data
		})
	}

}])
