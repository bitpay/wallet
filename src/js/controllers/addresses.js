'use strict';

angular.module('copayApp.controllers').controller('addressesController', function($scope, $stateParams, $state, $timeout, $ionicScrollDelegate, configService, popupService, gettextCatalog, ongoingProcess, lodash, profileService, walletService, bwcError) {
  var UNUSED_ADDRESS_LIMIT = 5;
  var BALANCE_ADDRESS_LIMIT = 5;
  var config;
  var unitName;
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var withBalance;
  $scope.showInfo = false;
  $scope.wallet = profileService.getWallet($stateParams.walletId);

  function init() {
    ongoingProcess.set('gettingAddresses', true);
    walletService.getMainAddresses($scope.wallet, {}, function(err, addresses) {
      if (err) {
        ongoingProcess.set('gettingAddresses', false);
        return popupService.showAlert(gettextCatalog.getString('Error'), err);
      }

      var allAddresses = addresses;

      walletService.getBalance($scope.wallet, {}, function(err, resp) {
        ongoingProcess.set('gettingAddresses', false);
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), err);
        }

        withBalance = resp.byAddress;
        var idx = lodash.indexBy(withBalance, 'address');
        $scope.noBalance = lodash.reject(allAddresses, function(x) {
          return idx[x.address];
        });

        processPaths($scope.noBalance);
        processPaths(withBalance);

        $scope.latestUnused = lodash.slice($scope.noBalance, 0, UNUSED_ADDRESS_LIMIT);
        $scope.latestWithBalance = lodash.slice(withBalance, 0, BALANCE_ADDRESS_LIMIT);

        lodash.each(withBalance, function(a) {
          a.balanceStr = (a.amount * satToUnit).toFixed(unitDecimals) + ' ' + unitName;
        });

        $scope.viewAll = {
          value: $scope.noBalance.length > UNUSED_ADDRESS_LIMIT || withBalance.length > BALANCE_ADDRESS_LIMIT
        };
        $scope.allAddresses = $scope.noBalance.concat(withBalance);
        $scope.$digest();
      });
    });
  };

  function processPaths(list) {
    lodash.each(list, function(n) {
      n.path = n.path.replace(/^m/g, 'xpub');
    });
  };

  $scope.newAddress = function() {
    ongoingProcess.set('generatingNewAddress', true);
    walletService.getAddress($scope.wallet, true, function(err, addr) {
      if (err) {
        ongoingProcess.set('generatingNewAddress', false);
        return popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
      }

      walletService.getMainAddresses($scope.wallet, {
        limit: 1
      }, function(err, _addr) {
        ongoingProcess.set('generatingNewAddress', false);
        if (err) return popupService.showAlert(gettextCatalog.getString('Error'), err);
        if (addr != _addr[0].address) return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('New address could not be generated. Please try again.'));

        $scope.viewAll = {
          value: [_addr[0]].concat($scope.latestUnused).length > UNUSED_ADDRESS_LIMIT
        };
        $scope.noBalance.concat(_addr[0]);
        $scope.latestUnused = lodash.slice($scope.noBalance, 0, UNUSED_ADDRESS_LIMIT);
        $scope.$digest();
      });
    });
  };

  $scope.viewAllAddresses = function() {
    $state.go('tabs.receive.allAddresses', {
      walletId: $scope.wallet.id
    });
  };

  $scope.showInformation = function() {
    $timeout(function() {
      $scope.showInfo = !$scope.showInfo;
      $ionicScrollDelegate.resize();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    config = configService.getSync().wallet.settings;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitName = config.unitName;
    unitDecimals = config.unitDecimals;

    if (!$scope.allAddresses || $scope.allAddresses.length < 0) init();
  });
});
