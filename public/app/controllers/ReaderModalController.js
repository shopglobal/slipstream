app.controller('ReaderModalController', [ '$scope', '$modalInstance', 'article', '$sce', function( $scope, $modalInstance, article, $sce ){
	
	$scope.article = article

	$sce.trustAsHtml( article.content )

	console.log( $scope.article.content )

}])