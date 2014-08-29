'use strict';

angular.module('copayApp.controllers').controller('MoreController',
  function($scope, $rootScope, $location, backupService, walletFactory, controllerUtils, notification) {
    var w = $rootScope.wallet;

    $scope.hideAdv=true;
    $scope.hidePriv=true;
    if (w)
      $scope.priv = w.privateKey.toObj().extendedPrivateKeyString;

    $scope.downloadBackup = function() {
      var w = $rootScope.wallet;
      backupService.download(w);
    }

    $scope.deleteWallet = function() {
      var w = $rootScope.wallet;
      walletFactory.delete(w.id, function() {
        controllerUtils.logout();
      });
    };

    $scope.purge = function(deleteAll) {
      var w = $rootScope.wallet;
      var removed = w.purgeTxProposals(deleteAll);
      if (removed){
        controllerUtils.updateBalance();
      }
      notification.info('Tx Proposals Purged', removed + ' transaction proposal purged');
    };

    $scope.updateIndexes = function() {
      var w = $rootScope.wallet;
      notification.info('Scaning for transactions','Using derived addresses from your wallet');
      w.updateIndexes(function(err) {
        notification.info('Scan Ended', 'Updating balance');
        if (err) {
          notification.error('Error', 'Error updating indexes: ' + err);
        }
        controllerUtils.updateAddressList();
        controllerUtils.updateBalance(function(){
          notification.info('Finished', 'The balance is updated using the derived addresses');
          w.sendIndexes();
        });
      });
    };
  });
