'use strict';

angular.module('copayApp.controllers').controller('buyandsellController', function($scope, $ionicHistory, configService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    configService.whenAvailable(function(config) {
      $scope.isCoinbaseEnabled = config.coinbaseV2;
      $scope.isGlideraEnabled = config.glidera.enabled;

      if (!$scope.isCoinbaseEnabled && !$scope.isGlideraEnabled)
        $ionicHistory.goBack();
    });
  });
});
