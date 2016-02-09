'use strict';

angular.module('copayApp.controllers').controller('glideraWalletsController', function($scope, bwsError, profileService) {

	var self = $scope.self;

  $scope.cancel = function() {
    $scope.gliderWalletsModal.hide();
  };

  $scope.selectWallet = function(walletId, walletName) {
    if (!profileService.getClient(walletId).isComplete()) {
      self.error = bwsError.msg({'code': 'WALLET_NOT_COMPLETE'}, 'Could not choose the wallet');
	    $scope.gliderWalletsModal.hide();
      return;
    }
    self.selectedWalletId = walletId;
    self.selectedWalletName = walletName;
    self.fc = profileService.getClient(obj.walletId);
    $scope.gliderWalletsModal.hide();
  };

});