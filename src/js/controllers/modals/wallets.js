'use strict';

angular.module('copayApp.controllers').controller('walletsController', function($scope, $timeout, bwcError, profileService) {

  $scope.selectWallet = function(walletId) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) {
        $scope.errorSelectedWallet[walletId] = bwcError.msg(err);
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }

      $scope.$emit('walletSelected', walletId);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

});
