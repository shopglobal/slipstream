var app = angular.module('SlipStream', ['ui.router', 'ui.bootstrap', 'ui.keypress', 'infinite-scroll', 'yaru22.angular-timeago', 'iframely', 'ngSanitize', 'angular-flash.service', 'angular-flash.flash-alert-directive', 'ct.ui.router.extras' ])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', '$sceDelegateProvider', '$futureStateProvider', function( $stateProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider, $futureStateProvider ) {
	
	// sets default state

	$urlRouterProvider.otherwise('/home/splash')
	
	// whitelists outside scripts for iframe use

	$sceDelegateProvider.resourceUrlWhitelist( [
		'self',
		'https://www.youtube.com/**',
		'https://w.soundcloud.com/**',
		'https://api.soundcloud.com/**',
		'https://reedoo.link/**'
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
			controller: 'MainController'
		})
		.state( 'app.home', {
			url: '/main',
			templateUrl: 'app/views/home.html',
			controller: 'HomeController'
		})
		.state( 'app.profile', {
			url: '/profile',
			templateUrl: 'app/views/profile.html',
			controller: 'ProfileController'
		})
		.state( 'app.read', {
			url: '/read',
			templateUrl: 'app/views/articles.html',
			controller: 'ArticlesController'
		})
		.state( 'app.watch', {
			url: '/watch',
			templateUrl: 'app/views/stream-content.html',
			controller: 'ContentController'
		})
		.state( 'app.listen', {
			url: '/listen',
			templateUrl: 'app/views/stream-content.html',
			controller: 'ContentController'
		})

	/*	
	Config for dynamic states for content streams
	*/	
	/*$futureStateProvider.addResolve( function( $q, $timeout ) {
        var d = $q.defer()
        
        $timeout(function() { 
            d.resolve("When this resolves, future state provider will re-sync the state/url");
        }, 1000)

        return d.promise;
    });
    
    var futureState = { 
    	type: 'ngload', 
    	stateName: 'foo', 
    	url: '/foo', 
    	src: 'foo.js' 
    };

    $futureStateProvider.futureState(futureState);
    
    $futureStateProvider.stateFactory('ngload', dynamicStateFactory);*/
}])

.controller('MainController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', 'flash', function( $scope, $window, $state, $urlRouter, $http, Content, flash ) {

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
		email: ''
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
			.error( function ( data, status ) {
				delete $window.sessionStorage.token
				console.log( "Error signing in: " + status )
			} )
	}

	// registartion 

	$scope.register = function () {
		$http
			.post( 'api/signup', $scope.reg )
			.success( function ( data ) {
				$window.sessionStorage.token = data.token
				$state.reload()
			})
			.error( function ( data, status ) {
				delete $window.sessionStorage.token
			})
	}

	$scope.resetPassword = function () {
		if ( $scope.user.email.length == 0 ) {
			flash.error = "Email address required!"
		} else {
			$http
				.get( 'api/user/password/reset', {
					params: { email: $scope.user.email }
				})
				.success( function () {
					flash.success = "An reset email was sent."
				})
				.error( function ( error ) {
					flash.error = error
				})
		}
	}

}])

// service to add the token the header of the request

.factory('authInterceptor', [ '$window', function ( $window ) {	
		return {
			request : function (config) {
				config.headers = config.headers || {}
				var iframelyPath = "https://" + location.hostname + ":8061/iframely"
				if ( $window.sessionStorage.token && config.url !==  iframelyPath ) {
					config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token
				}
				return config
			}
		}
} ] )

// gets content for infinite scrolling. usage: loadMore( TYPE, AMOUNT )

.value( 'THROTTLE_MILLISECONDS', 500 )

.factory( 'Content', [ '$http', function ( $http ) {
	var Content = function () {
		this.items = []
		this.busy = false
		this.page = 1
		THROTTLE_MILLISECONDS = 1000
	}

	Content.prototype.loadMore = function ( type, show ) {
		if ( this.busy )
			return

		this.busy = true

		$http
			.get( 'api/stream/' + type, { params: { 
				show: show, 
				page: this.page 
			} } )
				.success( function ( data ) {
					for( i = 0; i < data.length; i++) {
						this.items.push( data[i] )
					}
				
					this.page++
					this.busy = false
			}.bind(this))
	}

	return Content
}])

var dynamicStateFactory = function( $q, $timeout, futureState ) {
    var d = $q.defer();
    $timeout(function() {
    	console.log( futureState )
      
		var fullUiRouterState = {
			name: futureState.stateName,
			url: futureState.urlPrefix,
			template: 'app/views/stream-content.html'
		}

		d.resolve(fullUiRouterState); // Async resolve of ui-router state promise
    }, 1000);

    return d.promise; // ui-router state promise returned
}