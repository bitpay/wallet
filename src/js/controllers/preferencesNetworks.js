'use strict';

angular.module('copayApp.controllers').controller('preferencesNetworksController',
  function($scope, networkHelper, configService, feeService, gettextCatalog) {

    $scope.availableNetworks = networkHelper.getNetworks();

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.title = gettextCatalog.getString('Currency Networks');

      $scope.networkName = data.stateParams.networkName;
      if (!$scope.networkName) {
        return;
      }

      var network = networkHelper.getNetworkByName($scope.networkName);

      $scope.title = network.label;
      $scope.feeOpts = feeService.getFeeOpts($scope.networkName);
      $scope.currentFeeLevel = feeService.getCurrentFeeLevel($scope.networkName);

      configService.whenAvailable(function(config) {
        $scope.unitName = config.currencyNetworks[network.getName()].unitName;

        $scope.selectedAlternative = {
          name: config.currencyNetworks[network.getName()].alternativeName,
          isoCode: config.currencyNetworks[network.getName()].alternativeIsoCode
        };
      });
    });

  });
