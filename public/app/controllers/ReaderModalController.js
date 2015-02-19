app.controller('ReaderModalController', [ '$scope', '$modalInstance', 'article', '$sce', function( $scope, $modalInstance, article, $sce){
	
	var modalDialog = document.getElementsByClassName( 'modal-dialog' )

	// setTimeout( function() {
	// 	console.log( modalDialog )

	// 	modalDialog[0].setAttribute('class', 'col-md-1 modal-dialog')
	// 	modalDialog[0].style.float = "none"

	// }, 500)

	$scope.article = article

	$sce.trustAsHtml( article.content )

	$scope.closeModal = function() {
		$modalInstance.close()
	}

	console.log( $scope.article.content )

}])