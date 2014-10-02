'use strict';

angular.module('copayApp.controllers').controller('MoreController',
  function($scope, $rootScope, $location, $filter, backupService, walletFactory, controllerUtils, notification, rateService) {
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
      name: w.settings.alternativeName,
      isoCode: w.settings.alternativeIsoCode
    };
    $scope.alternativeOpts = rateService.isAvailable ?
      rateService.listAlternatives() : [$scope.selectedAlternative];

    rateService.whenAvailable(function() {
      $scope.alternativeOpts = rateService.listAlternatives();
      for (var ii in $scope.alternativeOpts) {
        if (w.settings.alternativeIsoCode === $scope.alternativeOpts[ii].isoCode) {
          $scope.selectedAlternative = $scope.alternativeOpts[ii];
        }
      }
    });


    for (var ii in $scope.unitOpts) {
      if (w.settings.unitName === $scope.unitOpts[ii].shortName) {
        $scope.selectedUnit = $scope.unitOpts[ii];
        break;
      }
    }
    $scope.save = function() {
      w.changeSettings({
        unitName: $scope.selectedUnit.shortName,
        unitToSatoshi: $scope.selectedUnit.value,
        unitDecimals: $scope.selectedUnit.decimals,
        alternativeName: $scope.selectedAlternative.name,
        alternativeIsoCode: $scope.selectedAlternative.isoCode,
      });
      notification.success('Success', $filter('translate')('settings successfully updated'));
      controllerUtils.updateBalance();
    };


    $scope.hideAdv = true;
    $scope.hidePriv = true;
    if (w)
      $scope.priv = w.privateKey.toObj().extendedPrivateKeyString;

    $scope.downloadBackup = function() {
      backupService.download(w);
    }

    $scope.deleteWallet = function() {
      walletFactory.delete(w.id, function() {
        controllerUtils.logout();
      });
    };

    $scope.purge = function(deleteAll) {
      var removed = w.purgeTxProposals(deleteAll);
      if (removed) {
        controllerUtils.updateBalance();
      }
      notification.info('Transactions Proposals Purged', removed + ' ' + $filter('translate')('transaction proposal purged'));
    };

    $scope.updateIndexes = function() {
      notification.info('Scaning for transactions', 'Using derived addresses from your wallet');
      w.updateIndexes(function(err) {
        notification.info('Scan Ended', 'Updating balance');
        if (err) {
          notification.error('Error', $filter('translate')('Error updating indexes: ') + err);
        }
        controllerUtils.updateAddressList();
        controllerUtils.updateBalance(function() {
          notification.info('Finished', 'The balance is updated using the derived addresses');
          w.sendIndexes();
        });
      });
    };
  });
