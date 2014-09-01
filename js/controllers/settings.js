'use strict';

angular.module('copayApp.controllers').controller('SettingsController', function($scope, $rootScope, $window, $location, controllerUtils, rateService) {

  controllerUtils.redirIfLogged();
  $scope.title = 'Settings';
  $scope.networkName = config.networkName;
  $scope.insightHost = config.blockchain.host;
  $scope.insightPort = config.blockchain.port;
  $scope.insightSecure = config.blockchain.schema === 'https';
  $scope.disableVideo = typeof config.disableVideo === undefined ? true : config.disableVideo;
  $scope.forceNetwork = config.forceNetwork;

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

  $scope.changeNetwork = function() {
    $scope.insightHost = $scope.networkName !== 'testnet' ? 'test-insight.bitpay.com' : 'insight.bitpay.com';
  };


  $scope.changeInsightSSL = function() {
    $scope.insightPort = $scope.insightSecure ? 80 : 443;
  };


  $scope.save = function() {
    var network = config.network;
    network.host = $scope.insightHost;
    network.port = $scope.insightPort;
    network.schema = $scope.insightSecure ? 'https' : 'http';

    localStorage.setItem('config', JSON.stringify({
      networkName: $scope.networkName,
      blockchain: {
        host: $scope.insightHost,
        port: $scope.insightPort,
        schema: $scope.insightSecure ? 'https' : 'http',
      },
      socket: {
        host: $scope.insightHost,
        port: $scope.insightPort,
        schema: $scope.insightSecure ? 'https' : 'http',
      },
      network: network,
      disableVideo: $scope.disableVideo,
      unitName: $scope.selectedUnit.shortName,
      unitToSatoshi: $scope.selectedUnit.value,
      unitDecimals: $scope.selectedUnit.decimals,
      alternativeName: $scope.selectedAlternative.name,
      alternativeIsoCode: $scope.selectedAlternative.isoCode,

      version: copay.version
    }));

    // Go home reloading the application
    var hashIndex = window.location.href.indexOf('#!/');
    window.location = window.location.href.substr(0, hashIndex);
  };
});
