app.controller('ReaderModalController', [ '$scope', '$modalInstance', 'article', '$sce', '$http', 'flash', function( $scope, $modalInstance, article, $sce, $http, $flash ){
	
	var modalDialog = document.getElementsByClassName( 'modal-dialog' )

	// setTimeout( function() {
	// 	console.log( modalDialog )

	// 	modalDialog[0].setAttribute('class', 'col-md-1 modal-dialog')
	// 	modalDialog[0].style.float = "none"

	// }, 500)

	$scope.article = article

	$sce.trustAsHtml( article.content )

	/*	Used when an admin wants to make a manual edit to a post. A user must be authorized as an admin on the back-end for this to do antything*/
	$scope.adminEdit = false

	$scope.closeModal = function() {
		$modalInstance.close()
	}

	$scope.adminMode = function() {
		$scope.adminEdit = !$scope.adminEdit
	}

	$scope.saveAdminEdit = function () {
		$http.post( '/api/content/edit',
			{ id: article._id, text: article.text }
		)
		.then( function ( response, error ) {
			if ( error ) return $flash.error = error

			$flash.success = response.data
			$modalInstance.close()
		})
	}

	console.log( $scope.adminEdit )

}])