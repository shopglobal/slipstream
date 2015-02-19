app.controller('ArticlesController', ['$scope', '$window', '$state', '$urlRouter', '$http', '$modal', 'Content', function( $scope, $window, $state, $urlRouter, $http, $modal, Content ) {

	$scope.articles = new Content()

	// opens the "reader" modal to read the article

	$scope.openReaderModal = function ( article ) {
		console.log( "modal should open ")

		var modalInstance = $modal.open( {
			templateUrl: "views/reader-modal.html",
			windowClass: 'reader-modal',
			controller: 'ReaderModalController',
			resolve: {
				article: function() {
					return article
				}
			}
		})
	}

}])