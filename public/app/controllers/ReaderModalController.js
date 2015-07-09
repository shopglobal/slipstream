app.controller('ReaderModalController', [ '$scope', '$modalInstance', 'article', '$sce', '$http', 'flash', '$stateParams', '$window', '$filter', function( $scope, $modalInstance, article, $sce, $http, $flash, $stateParams, $window, $filter ){
	
	var modalDialog = document.getElementsByClassName( 'modal-dialog' )

	// setTimeout( function() {
	// 	console.log( modalDialog )

	// 	modalDialog[0].setAttribute('class', 'col-md-1 modal-dialog')
	// 	modalDialog[0].style.float = "none"

	// }, 500)

	$scope.item = article

	$scope.newTitle = ''

	$scope.$state = $state

	/*
	check if the article is currently processing. If it is, check again. This will make the app check each time an add modal is openened instead of only after refreshign the whole app.
	*/
	if ( article.processing ) {
		$http.get( '/api/single/' + $stateParams.username, { params: {
			id: article._id 
		} }  )
		.then( function ( response, error ) {
			if ( error ) return

			if ( !response.data.processing ) $scope.item = response.data[0]
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
		$http.post( '/api/content/edit', { 
			id: $scope.item._id, 
			changes: { text: $scope.item.text }
		})
		.then( function ( response, error ) {
			if ( error ) return $flash.error = error

			$flash.success = response.data
			$modalInstance.close()
		})
	}

	console.log( $scope.adminEdit )

	/*Props for React directive to edit post title inline*/
	/*$scope.adminEditTitle = {
		title: $scope.item.title,
		tagName: "div",
		className: "name-field",
		autoFocus: true,
		maxLength: 300,
		postId: $scope.item._id
	}*/

	$scope.adminEditTitle = function ( newValue ) {
		$http.post( 'api/content/edit', {
			id: $scope.item._id,
			changes: {
				title: newValue
			}
		})
		.then( function ( response, error ) {
			if ( error ) return $flash.error = error

			$flash.success = response.data
		})
	}
	
	function getSinglePostUrl ( item ) {
		if ( $scope.mode == 'mystream' ) {
			var username = $stateParams.username
		} else {
			var username = item.user.username ? item.user.username : item.user
		}

		var slug = item.slug ? item.slug : item._id

		var singlePostUrl = $window.location.protocol + "//" + $window.location.host + "/" + username + "/" + item.stream + "/" + slug

		return singlePostUrl
	}

	$scope.shareTwitter = function ( item ) {
		var singlePostUrl = getSinglePostUrl( item )

		$http.get( 'api/shorten-url', { params: {
			url: singlePostUrl
		}})
		.then( function ( response, error ){
			if ( error ) return $flash.error = "Problem sharing link :("
			var tweetMessage = $filter( 'limitTo' )( item.title, 99, 0) + "... " + response.data

			window.open( 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetMessage) + '&via=getslipstream', '_blank')
		})
	}

	$scope.shareToFacebook = function ( item ) {
		var singlePostUrl = getSinglePostUrl( item )

		var facebookUrl = 'https://www.facebook.com/dialog/share?app_id=1416653888663542&display=popup&href=' + encodeURIComponent( singlePostUrl ) + '&redirect_uri=' + encodeURIComponent( $window.location )

		console.log( facebookUrl )

		$window.open( facebookUrl, '_blank' )
	}

}])