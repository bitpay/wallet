'use strict';

angular.module('copayApp.controllers').controller('preferencesAdvancedController', function($scope, $timeout, $stateParams, profileService) {
  var wallet = profileService.getWallet($stateParams.walletId);
  $scope.network = wallet.network;

  $timeout(function() {
    $scope.$apply();
  }, 1);
});
