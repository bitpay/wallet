'use strict';

angular.module('copayApp.controllers').controller('walletsController', function($scope, bwsError, profileService) {

  $scope.selectWallet = function(walletId, walletName) {

    var client = profileService.getClient(walletId);
    $scope.errorSelectedWallet = {};

    profileService.isReady(client, function(err) {
      if (err) { 
        $scope.errorSelectedWallet[walletId] = bwsError.msg(err);
        return;
      }

      var obj = {
        'walletId': walletId,
        'walletName': walletName,
        'client': profileService.getClient(walletId)
      }
      $scope.$emit('walletSelected', obj);
    });
  };

  $scope.cancel = function() {
    $scope.walletsModal.hide();
  };

});
