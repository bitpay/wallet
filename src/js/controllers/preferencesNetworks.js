'use strict';

angular.module('copayApp.controllers').controller('preferencesNetworksController',
  function($scope, networkService, configService, feeService, gettextCatalog) {

    $scope.availableNetworks = networkService.getNetworks();

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.title = gettextCatalog.getString('Currency Networks');

      $scope.networkURI = data.stateParams.networkURI;
      if (!$scope.networkURI) {
        return;
      }

      var network = networkService.getNetworkByURI($scope.networkURI);

      $scope.title = network.label;
      $scope.feeOpts = feeService.getFeeOpts($scope.networkURI);
      $scope.currentFeeLevel = feeService.getCurrentFeeLevel($scope.networkURI);

      configService.whenAvailable(function(config) {
        $scope.unitName = config.currencyNetworks[network.getURI()].unitName;

        $scope.selectedAlternative = {
          name: config.currencyNetworks[network.getURI()].alternativeName,
          isoCode: config.currencyNetworks[network.getURI()].alternativeIsoCode
        };
      });
    });

  });
