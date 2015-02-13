var app = angular.module('SlipStream', ['ui.router', 'ui.bootstrap', 'ui.keypress', 'infinite-scroll', 'yaru22.angular-timeago' ])

.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', '$sceDelegateProvider', function( $stateProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider ) {
	
	// sets default state

	$urlRouterProvider.otherwise('/home')
	
	// whitelists outside scripts for iframe use

	$sceDelegateProvider.resourceUrlWhitelist( [
		'self',
		'https://www.youtube.com/**',
		'https://w.soundcloud.com/**',
		'https://api.soundcloud.com/**'
	] )

	// add the custom service to add Authenticaiotn to header

	$httpProvider.interceptors.push('authInterceptor')

	$stateProvider
		.state( 'home', {
			url: '/home',
			templateUrl: 'views/home.html',
			controller: 'HomeController'
		})
		.state( 'read', {
			url: '/read',
			templateUrl: 'views/articles.html',
			controller: 'ArticlesController'
		})
		.state( 'watch', {
			url: '/watch',
			templateUrl: 'views/watch-stream.html',
			controller: 'WatchController'
		})
		.state( '/login', {
			url: '/login',
			templateUrl: 'views/login.html'
		})
		.state( '/profile', {
			url: '/profile',
			templateUrl: 'views/profile.html',
			controller: 'ProfileController'
		})
		.state( 'listen', {
			url: '/listen',
			templateUrl: 'views/listen-stream.html',
			controller: 'ListenController'
		})
}])


// service to add the token the header of the request

.factory('authInterceptor', [ '$window', function ( $window ) {
	return {
		request : function (config) {
			config.headers = config.headers || {}
			if ( $window.sessionStorage.token ) {
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

// getting the items from the read stream for the endless scrolling

// .factory('datasource', [
//     '$timeout', '$http', function( $timeout, $http ) {
//         var get;
//         get = function(index, count, success) {
//             return $timeout(function() {
//                 var i, result, _i, _ref;
//                 result = []
//                 var articles
//                 $http
// 					.get( 'api/stream/read', { params: { 
// 						show: 10, 
// 						page: 1 
// 					} } )
// 						.success( function ( data ) {
// 							articles = data
// 						})
// 						.error( function ( error ) {
// 							console.log( 'Error: ' + error)
// 						})
//                 for (i = _i = index, _ref = index + count - 1; index <= _ref ? _i <= _ref : _i >= _ref; i = index <= _ref ? ++_i : --_i) {
//                 	result.push( articles[i] )
//                 }
//                 return success( result );
//             }, 100);
//         };
//         return {
//             get: get
//         };
//     }
// ])


// .factory( 'readStream', [ '$timeout', '$http', function ( $timeout, $http ) {
// 	var get = function ( index, count, success ) {
// 		return $timeout( function () {
// 			var results = []
			
// 			for (i = _i = index, _ref = index + count - 1; index <= _ref ? _i <= _ref : _i >= _ref; i = index <= _ref ? ++_i : --_i) {
// 					results.push("item #" + i);
// 			}

// 			// $http
// 			// 	.get( 'api/stream/read', { params: { 
// 			// 		show: 10, 
// 			// 		page: 1 
// 			// 	} } )
// 			// 		.success( function ( data ) {
// 			// 			results.push( data )
// 			// 		})
// 			// 		.error( function ( error ) {
// 			// 			console.log( 'Error: ' + error)
// 			// 		})

// 			return success( results )
// 		}, 1000 )
// 	}
	
// 	return { get : get }

// } ] )

	//
	// set a scope variable for whether a user is signed in or not
	//
	// .factory('authCheck', [ '$window', '$rootScope', function ( $window, $rootScope ) {
	// 		$rootScope.isLoggedIn = false;
	//
	// 		if ( $window.sessionStorage.token ) {
	// 			$rootScope.isLoggedIn = true;
	// 		}
	//
	// 		return $rootScope.isLoggedIn;
	// }])
