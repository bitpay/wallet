'use strict';

angular.module('copayApp.controllers').controller('preferencesUnitController', function($scope, $log, configService, $ionicHistory, gettextCatalog, walletService, profileService) {

  var config = configService.getSync();
  $scope.unitList = [{
    name: 'μNAV (1,000,000 μNAV = 1NAV)',
    shortName: 'μNAV',
    value: 100,
    decimals: 2,
    code: 'unav',
  }, {
    name: 'NAV',
    shortName: 'NAV',
    value: 100000000,
    decimals: 8,
    code: 'nav',
  }];

  $scope.save = function(newUnit) {
    var opts = {
      wallet: {
        settings: {
          unitName: newUnit.shortName,
          unitToSatoshi: newUnit.value,
          unitDecimals: newUnit.decimals,
          unitCode: newUnit.code,
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.warn(err);

      $ionicHistory.goBack();
      walletService.updateRemotePreferences(profileService.getWallets())
    });
  };

  $scope.$on("$ionicView.enter", function(event, data){
    $scope.currentUnit = config.wallet.settings.unitCode;
  });
});
