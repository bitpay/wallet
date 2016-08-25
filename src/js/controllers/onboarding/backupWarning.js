'use strict';

angular.module('copayApp.controllers').controller('backupWarningController', function($rootScope, $scope, $state, $ionicPopup, $stateParams, profileService, walletService) {

  $scope.openPopup = function() {
    var backupWarningPopup = $ionicPopup.show({
      templateUrl: "views/includes/backupWarningPopup.html",
      scope: $scope,
    });

    $scope.close = function() {
      backupWarningPopup.close();
      var wallet = profileService.getWallets()[0];
      $state.go('wallet.backup', {
        walletId: wallet.credentials.walletId,
        fromOnboarding: true
      })
    };
  }

});
