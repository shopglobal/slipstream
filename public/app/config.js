app.config( [ '$stateProvider', '$urlRouterProvider', '$httpProvider', '$sceDelegateProvider', function( $stateProvider, $urlRouterProvider, $httpProvider, $sceDelegateProvider ) {
	
	// sets default state

	$urlRouterProvider.otherwise('/home')
	
	// whitelists outside scripts for iframe use

	$sceDelegateProvider.resourceUrlWhitelist( [
		'self',
		'https://www.youtube.com/**'
	] )

	// add the custom service to add Authenticaiotn to header

	$httpProvider.interceptors.push('authInterceptor')

	$stateProvider
		.state( 'home', {
			url: '/home',
			templateUrl: 'views/home.html',
			controller: 'HomeController'
		})
		.state( 'articles', {
			url: '/articles',
			templateUrl: 'views/articles.html',
			controller: 'ArticlesController'
		})
		.state( 'videos', {
			url: '/videos',
			templateUrl: 'views/video-stream.html',
			controller: 'VideosController'
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
}])