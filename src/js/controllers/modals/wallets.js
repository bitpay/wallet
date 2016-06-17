'use strict';

angular.module('copayApp.controllers').controller('walletsController', function($scope, bwsError, profileService) {

  $scope.selectWallet = function(walletId) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) { 
        $scope.errorSelectedWallet[walletId] = bwsError.msg(err);
        return;
      }

      $scope.$emit('walletSelected', walletId);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

});
