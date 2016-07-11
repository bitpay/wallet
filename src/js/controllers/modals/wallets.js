'use strict';

angular.module('copayApp.controllers').controller('walletsController', function($scope, bwcError, profileService) {

  $scope.selectWallet = function(walletId) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) {
        $scope.errorSelectedWallet[walletId] = bwcError.msg(err);
        return;
      }

      $scope.$emit('walletSelected', walletId);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

});
