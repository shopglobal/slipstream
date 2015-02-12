app.controller('ListenController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', function( $scope, $window, $state, $urlRouter, $http, Content ) {

	$scope.embedUrl = function ( videoId ) {
		return "https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/" + videoId
	}

	$scope.songs = new Content()

}])