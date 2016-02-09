'use strict';

angular.module('copayApp.controllers').controller('glideraWalletsController', function($scope, bwsError, profileService) {

	var self = $scope.self;

  $scope.selectWallet = function(walletId, walletName) {
    if (!profileService.getClient(walletId).isComplete()) {
      self.error = bwsError.msg({'code': 'WALLET_NOT_COMPLETE'}, 'Could not choose the wallet');
	    $scope.cancel();
      return;
    }
    self.selectedWalletId = walletId;
    self.selectedWalletName = walletName;
    self.fc = profileService.getClient(self.selectedWalletId);
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.glideraWalletsModal.hide();
    $scope.glideraWalletsModal.remove();
  };

});