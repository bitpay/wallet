'use strict';

angular.module('copayApp.controllers').controller('MoreController',
  function($scope, $rootScope, $location, backupService, walletFactory, controllerUtils, notification) {
    var w = $rootScope.wallet;


    $scope.unitOpts = [{
      name: 'Satoshis (100,000,000 satoshis = 1BTC)',
      shortName: 'SAT',
      value: 1,
      decimals: 0
    }, {
      name: 'bits (1,000,000 bits = 1BTC)',
      shortName: 'bits',
      value: 100,
      decimals: 2
    }, {
      name: 'mBTC (1,000 mBTC = 1BTC)',
      shortName: 'mBTC',
      value: 100000,
      decimals: 5
    }, {
      name: 'BTC',
      shortName: 'BTC',
      value: 100000000,
      decimals: 8
    }];
    $scope.selectedAlternative = {
      name: config.alternativeName,
      isoCode: config.alternativeIsoCode
    };
    $scope.alternativeOpts = rateService.isAvailable ?
      rateService.listAlternatives() : [$scope.selectedAlternative];

    rateService.whenAvailable(function() {
      $scope.alternativeOpts = rateService.listAlternatives();
      for (var ii in $scope.alternativeOpts) {
        if (config.alternativeIsoCode === $scope.alternativeOpts[ii].isoCode) {
          $scope.selectedAlternative = $scope.alternativeOpts[ii];
        }
      }
    });


    for (var ii in $scope.unitOpts) {
      if (config.unitName === $scope.unitOpts[ii].shortName) {
        $scope.selectedUnit = $scope.unitOpts[ii];
        break;
      }
    }


    $scope.hideAdv = true;
    $scope.hidePriv = true;
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
      if (removed) {
        controllerUtils.updateBalance();
      }
      notification.info('Tx Proposals Purged', removed + ' transaction proposal purged');
    };

    $scope.updateIndexes = function() {
      var w = $rootScope.wallet;
      notification.info('Scaning for transactions', 'Using derived addresses from your wallet');
      w.updateIndexes(function(err) {
        notification.info('Scan Ended', 'Updating balance');
        if (err) {
          notification.error('Error', 'Error updating indexes: ' + err);
        }
        controllerUtils.updateAddressList();
        controllerUtils.updateBalance(function() {
          notification.info('Finished', 'The balance is updated using the derived addresses');
          w.sendIndexes();
        });
      });
    };
  });
