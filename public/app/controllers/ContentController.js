app.controller('ContentController', ['$scope', '$window', '$state', '$urlRouter', '$http', 'Content', function( $scope, $window, $state, $urlRouter, $http, Content ) {

	$scope.currentStream = $state.current.name.split(".")[1]

	$scope.content = new Content()

}])