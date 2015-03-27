angular.module( 'iframely', [])

.directive( 'iframely', [ '$http', '$sce', function ( $http, $sce ) {
	return {
		replace: true,
		restrict: "AE",
		scope: {
			url: '@'
		},
		template: '<div ng-bind-html="content"></div>',
		link: function ( scope, element, attrs ) {
			$http( {
				url: 'http://localhost:8061/iframely',
				method: 'GET',
				params: {
					url: attrs.url
				}
			})
			.then( function ( result ) {
				mixpanel.track( "Embed viewed", {
					embed_url: attrs.url
				})
				console.log( result.data )
				scope.content = $sce.trustAsHtml( result.data.html )
			})
		}
	}
}])