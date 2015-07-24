app.controller('EmailModalController', ['$scope', '$modalInstance', 'item', 'flash', '$rootScope', '$http', function ( $scope, $modalInstance, item, $flash, $rootScope, $http ) {
	
	$scope.inviteMode = item.invite ? true : false

	$scope.choices = [ { email: "" } ]

	$scope.headlines = [
		"Which of your friends always finds the best music?",
		"Which of your friends always finds the best videos?",
		"Which of your friends always finds the best articles?",
	]

	$scope.number = ( Math.random() * 10 ).toFixed()

	$scope.headerNumber = $scope.number % 3

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

				var api = item.invite ? '/api/users/invite' : '/api/content/share'

				var params = item.invite ? { recipients: allEmails } : { title: item.title, url: $rootScope.getSinglePostUrl( item ), recipients: allEmails }

				$http.post( api, params )
				.then( function ( response, error ) {
					if ( error ) $flash.error = error

					$flash.success = response.data

					$modalInstance.close()
				})
			}
		})
	}

}])