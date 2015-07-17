app.controller('EmailModalController', ['$scope', '$modalInstance', 'item', 'flash', '$rootScope', '$http', function ( $scope, $modalInstance, item, $flash, $rootScope, $http ) {
	
	$scope.choices = [ { email: "" } ]

	$scope.addMoreEmails = function () {
		$scope.choices.push( { email: "" } )
	}

	$scope.cancel = function () {
		$modalInstance.close()
	}

	$scope.sendEmails = function ( emailObj ) {
		var filledEmails = emailObj.filter( function ( each ) {
			if ( each.email != "" ) {
				return each
			}
		})

		var validEmails = angular.copy( filledEmails )

		console.log( item )

		validEmails.filter( function ( each, index ) {
			if ( !each.email ) return $flash.error = "Please correct the emails."

			if( validEmails.length == index + 1 ) {
				var allEmails = []

				validEmails.filter( function ( each ) {
					allEmails.push( each.email )
				})

				$http.post( '/api/content/share', {
					title: item.title,
					url: $rootScope.getSinglePostUrl( item ),
					recipients: allEmails
				} )
				.then( function ( response, error ) {
					if ( error ) $flash.error = error

					$flash.success = response.data

					$modalInstance.close()
				})
			}
		})
	}

}])