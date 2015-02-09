app.controller('ListenController', ['$scope', '$window', '$state', '$urlRouter', '$http', function( $scope, $window, $state, $urlRouter, $http ) {

	$scope.embedUrl = function ( videoId ) {
		return "https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/" + videoId
	}

	$http
		.get( 'api/stream/listen')
			.success( function ( data ) {
				$scope.songs = data
			})
			.error( function ( error ) {
				console.log( 'Error: ' + error)
			})

}])