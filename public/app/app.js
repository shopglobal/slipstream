var app = angular.module('SlipStream', ['ui.router', 'ui.bootstrap', 'ui.keypress', 'infinite-scroll', 'yaru22.angular-timeago', 'iframely', 'ngSanitize', 'angular-flash.service', 'angular-flash.flash-alert-directive', 'ngTagsInput', 'angular.filter', '$feedback.directives', 'ngWig', 'react', 'angularInlineEdit' ])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', '$sceDelegateProvider', '$locationProvider', function( $stateProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider, $locationProvider ) {


	/*$locationProvider.html5Mode( true )*/
	
	// sets default state

	$urlRouterProvider.otherwise('/home/splash')
	
	// whitelists outside scripts for iframe use

	$sceDelegateProvider.resourceUrlWhitelist( [
		'self',
		'https://www.youtube.com/**',
		'https://w.soundcloud.com/**',
		'https://api.soundcloud.com/**',
		'https://reedoo.link/**',
		'https://glacial-sea-2323.herokuapp.com'
	] )

	// add the custom service to add Authenticaiotn to header

	$httpProvider.interceptors.push('authInterceptor')

	$stateProvider
		.state( 'landing', {
			url: '/home',
			templateUrl: 'app/views/landing.html',
			controller: 'MainController'
		})
			.state( 'landing.splash', {
				url: '/splash',
				templateUrl: 'app/views/landing-splash.html'
			})
			.state( 'landing.login', {
				url: '/login',
				templateUrl: 'app/views/login.html'
			})
			.state( 'landing.register', {
				params: { email: { value: '' } },
				url: '/register',
				templateUrl: 'app/views/register.html'
			})
			.state( 'landing.reset', {
				url: '/reset',
				templateUrl: 'app/views/landing-reset.html'
			})
		.state( 'app', {
			url: '/app',
			templateUrl: 'app/views/app.html',
			controller: 'HomeController'
		})
			.state( 'app.home', {
				url: '/main',
				templateUrl: 'app/views/home.html'
			})
			.state( 'app.profile', {
				url: '/profile',
				templateUrl: 'app/views/profile.html',
				controller: 'ProfileController'
			})
			.state( 'app.admin', {
				url: '/admin',
				templateUrl: 'app/views/app-admin.html',
				controller: 'AdminController'
			})
			.state( 'app.users', {
				url: '/users',
				templateUrl: 'app/views/app-users.html',
				controller: 'UserSearchController'
			})
			.state( 'app.discover', {
				url: '/:mode/:stream',
				templateUrl: 'app/views/stream-content.html'
			})
			.state( 'app.stream', {
				url: '/:mode/:username/:stream',
				templateUrl: 'app/views/stream-content.html'
			})
		.state( 'single', {
			url: '/:username/:stream/:slug',
			templateUrl: 'app/views/reader-modal.html',
			controller: 'ItemController'
		})
}])

// service to add the token the header of the request

.factory('authInterceptor', [ '$window', function ( $window ) {	
		return {
			request : function (config) {
				config.headers = config.headers || {}
				if ( $window.localStorage.token && config.url.indexOf( "iframely" ) == -1 ) {
					config.headers.Authorization = 'Bearer ' + $window.localStorage.token
				}
				return config
			}
		}
} ] )

// gets content for infinite scrolling. usage: loadMore( TYPE, AMOUNT )

.value( 'THROTTLE_MILLISECONDS', 500 )

.factory( 'Content', [ '$http', '$window', '$stateParams', function ( $http, $window, $stateParams ) {
	var Content = function () {
		this.items = []
		this.busy = false
		this.page = 1
		THROTTLE_MILLISECONDS = 1000
	}

	Content.prototype.loadMore = function ( show ) {
		if ( this.busy )
			return

		this.busy = true

		$http
			.get( 'api/stream/' + $stateParams.username + '/' + $stateParams.stream, { params: { 
					show: show, 
					page: this.page 
			} } )
			.success( function ( data ) {
				console.log( data )
				for( i = 0; i < data.length; i++) {
					this.items.push( data[i] )
				}
			
				this.page++
				this.busy = false
			}.bind(this))
	}

	return Content
}])

/*
A service for searching using Algolia, but through our back-end
*/
.factory( 'Search', [ '$http', 'flash', '$stateParams', function ( $http, $flash, $stateParams ) {

	var Search = function () {
		this.items = []
		this.busy = false
		this.page = 0
		this.query = ''
		THROTTLE_MILLISECONDS = 1000
	}

	Search.prototype.loadMore = function ( show ) {
		if ( this.busy )
			return

		this.busy = true

		$http
			.get( '/api/search', { params: { 
				terms: this.query,
				page: this.page,
				show: show,
				stream: $stateParams.stream
			} } )
			.success( function ( results ) {
				console.log( results )
				for( i = 0; i < results.length; i++) {
					this.items.push( results[i] )
				}

				this.page++	
				this.busy = false

			}.bind(this))

	}

	return Search
}])

/*
A service for using our Discover feature
*/
.factory( 'Discover', [ '$http', 'flash', '$stateParams', function( $http, $flash, $stateParams ) {

	var Discover = function () {
		this.items = []
		this.busy = false
		this.page = 1
	}

	Discover.prototype.loadMore = function ( show ) {
		if ( this.busy )
			return

		this.busy = true

		$http
			.get( '/api/discover/popular/' + $stateParams.stream, { params: { 
				page: this.page,
				show: show
			} } )
			.success( function ( results ) {
				console.log( results )
				for( i = 0; i < results.length; i++) {
					this.items.push( results[i] )
				}

				this.page++	
				this.busy = false

			}.bind(this))
	}

	return Discover
}])

.factory( 'Following', [ '$http', 'flash', '$stateParams', function( $http, $flash, $stateParams ) {

	var Following = function () {
		this.items = []
		this.busy = false
		this.page = 1
	}

	Following.prototype.loadMore = function ( show ) {
		if ( this.busy )
			return

		this.busy = true

		$http
			.get( '/api/following/' + $stateParams.stream, { params: { 
				page: this.page,
				show: show
			} } )
			.success( function ( results ) {
				console.log( results )
				for( i = 0; i < results.length; i++) {
					this.items.push( results[i] )
				}

				this.page++	
				this.busy = false

			}.bind(this))
	}

	return Following
}])

/**
 * A generic confirmation for risky actions.
 * Usage: Add attributes: ng-really-message="Are you sure"? ng-really-click="takeAction()" function
 */
app.directive('ngReallyClick', [ function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                var message = attrs.ngReallyMessage
                if (message && confirm(message)) {
                    scope.$apply( attrs.ngReallyClick )
                }
            })
        }
    }
}])

app.directive( 'toggleButtons', [ function () {
	return {
		link: function ( scope, element ) {
			var toggleButtons = element.find( '.input-add-checkbox' )

			function checkState() {
				Array.prototype.forEach.call( toggleButtons, function( each ) {
					if ( scope.contentParams && each.value === scope.contentParams.type )
						each.parentNode.style.backgroundColor = "#5CD298"
					else
						each.parentNode.style.backgroundColor = "transparent"
				})
			}

			Array.prototype.forEach.call( toggleButtons, function (each) {
				each.addEventListener( 'click', function () {
					checkState()
				})
			})

			setTimeout(checkState(), 1000)
		}
	}
}])

app.directive( 'buttonFollow', [ '$http', '$stateParams', function ( $http, $stateParams ) {
	return {
		scope: {
			'username': '@'
		},
		link: function( scope, element ) {
			var followButton = element.find( '.button-follow' )

			console.log( followButton )

			/*If username is not set in the directive, get it from the scope.*/
			var username = ( ( !scope.username && $stateParams.username )? $stateParams.username : scope.username )

			$http
				.get( '/api/user/isfollowing', { params: 
					{ username: username }
				} )
				.success( function ( data ) {
					scope.isfollowing = data.isfollowing

					if ( data.isfollowing ) {
						followButton[0].setAttribute( 'class', 'btn btn-xs btn-white btn-white-solid btn-active cursor-pointer' )
					} else if ( !data.isfollowing ) {
						followButton[0].setAttribute( 'class', 'btn btn-xs btn-white btn-inactive cursor-pointer' )
					}
				})
				.error( function ( error ) {
					console.log( error )
				})

			followButton[0].addEventListener( 'click', function () {
				if ( scope.isfollowing ) {
					$http({ method: 'POST', url: '/api/user/unfollow', data: { username: username }
					})
					.success( function ( result ) {
						followButton[0].setAttribute( 'class', 'btn btn-xs btn-white btn-inactive cursor-pointer' )
					})
				} else if ( !scope.isfollowing ) {
					$http({ method: 'POST', url: '/api/user/follow', data: { username: username }
					})
					.success( function ( result ) {
						followButton[0].setAttribute( 'class', 'btn btn-xs btn-white btn-active cursor-pointer' )
					})
				}

				scope.isfollowing = !scope.isfollowing
			})
		},
		templateUrl: 'app/views/button-follow.html'
	}
}])

app.directive( 'dropdownMode', [ function () {
	return {
		link: function( scope, element, state, stateParams ) {
			scope.modeChange = function ( newMode ) {
				window.localStorage.mode = newMode
			}
		},
		templateUrl: 'app/views/dropdown-mode.html'
	}
}])

app.directive( 'userName', [ function ( userId ) {
	return {
		scope: {
			id: '=',
			username: '&'
		},
		template: ' <span ng-bind="username"></span> ',
		controller: function( $scope, $http ) {
			$http
				.get( '/api/user/name', {
					params: { id: $scope.id }
				})
				.success( function ( result ) {
					$scope.username = result
				})
				.error( function ( error ) {
					console.log( error )
					$scope.username = "[Deleted]"
				})
		}
	}
}])

/*app.directive( 'sidebarButton', [ 'reactDirective', function ( reactDirective ) {
	return reactDirective( 'sidebarComponent' )
}])

app.directive( 'editTitle', [ 'reactDirective', function ( reactDirective ) {
	return reactDirective( 'EditTitle' )
}])*/