app.controller('ReaderModalController', [ '$scope', '$modalInstance', 'article', '$sce', '$http', 'flash', '$stateParams', function( $scope, $modalInstance, article, $sce, $http, $flash, $stateParams ){
	
	var modalDialog = document.getElementsByClassName( 'modal-dialog' )

	// setTimeout( function() {
	// 	console.log( modalDialog )

	// 	modalDialog[0].setAttribute('class', 'col-md-1 modal-dialog')
	// 	modalDialog[0].style.float = "none"

	// }, 500)

	$scope.article = article

	/*
	check if the article is currently processing. If it is, check again. This will make the app check each time an add modal is openened instead of only after refreshign the whole app.
	*/
	if ( article.processing ) {
		$http.get( '/api/single/' + $stateParams.username + '/' + article._id )
		.then( function ( response, error ) {
			if ( error ) return

			if ( !response.data.processing ) $scope.article = response.data[0]
		})
	}

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