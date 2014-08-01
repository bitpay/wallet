'use strict';

angular.module('copayApp.controllers').controller('SettingsController',
  function($scope, $rootScope, $window, $location) {
    $scope.title = 'Settings';
    $scope.loading = false;
    $scope.networkName = config.networkName;
    $scope.insightHost = config.blockchain.host;
    $scope.insightPort = config.blockchain.port;
    $scope.insightSecure = config.blockchain.schema === 'https';
    $scope.networkKey = config.network.key;
    $scope.networkHost = config.network.host;
    $scope.networkPort = config.network.port;
    $scope.networkSecure = config.network.secure || false;
    $scope.disableVideo = typeof config.disableVideo === undefined ? true : config.disableVideo;
    $scope.forceNetwork = config.forceNetwork;

    $scope.unitOpts = [{
      name: 'Satoshis (100,000,000 satoshis = 1BTC)',
      shortName: 'SAT',
      value: 1
    }, {
      name: 'bits (1,000,000 bits = 1BTC)',
      shortName: 'bits',
      value: 100
    }, {
      name: 'mBTC (1,000 mBTC = 1BTC)',
      shortName: 'mBTC',
      value: 100000
    }, {
      name: 'BTC',
      shortName: 'BTC',
      value: 100000000
    }];

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


    $scope.save = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'There is an error in the form');
        return;
      }

      var network = config.network;
      network.key = $scope.networkKey;
      network.host = $scope.networkHost;
      network.port = $scope.networkPort;
      network.secure = $scope.networkSecure;

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
      }));

      var target = ($window.location.origin !== 'null' ? $window.location.origin : '');
      $window.location.href = target;
    };
  });
