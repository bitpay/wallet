'use strict';

angular.module('copayApp.controllers').controller('preferencesAdvancedController', function($scope, $ionicHistory, $timeout, $stateParams, profileService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.network = wallet.network;

  $timeout(function() {
    $scope.$apply();
  }, 1);

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if ($ionicHistory.viewHistory() && !$ionicHistory.viewHistory().backView)
      data.enableBack = true;
  });
});
