
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
					url: 'http://' + location.hostname + ':8061/iframely',
					method: 'GET',
					params: {
						url: attrs.url
					}
				})
				.then( function ( result ) {
					scope.content = $sce.trustAsHtml( result.data.html )
				})
			}
		}
	}])