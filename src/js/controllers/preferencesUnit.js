'use strict';

angular.module('copayApp.controllers').controller('preferencesUnitController', function($scope, $log, lodash, configService, $ionicHistory, gettextCatalog, walletService, profileService, networkService) {

  var config = configService.getSync();

  $scope.save = function(newUnit) {
    var opts = {
      currencyNetworks: {}
    };

    opts.currencyNetworks[$scope.networkURI] = {
      unitName: newUnit.shortName,
      unitToAtomicUnit: newUnit.value,
      unitDecimals: newUnit.decimals,
      unitCode: newUnit.code,
    };

    configService.set(opts, function(err) {
      if (err) $log.warn(err);

      $ionicHistory.goBack();
      walletService.updateRemotePreferences(profileService.getWallets());
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $scope.networkURI = data.stateParams.networkURI;
    if (!$scope.networkURI) {
      return;
    }

    var network = networkService.getNetworkByURI($scope.networkURI);
    $scope.unitList = lodash.filter(network.units, function(n) {
      return n.userSelectable;
    });

    $scope.currentUnit = config.currencyNetworks[network.getURI()].unitCode;
  });
});
