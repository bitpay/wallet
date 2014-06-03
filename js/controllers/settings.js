'use strict';

angular.module('copayApp.settings').controller('SettingsController',
  function($scope, $rootScope, $window, $location) {
    $scope.title = 'Settings';

    $scope.networkName = config.networkName;
    $scope.insightHost = config.blockchain.host;
    $scope.insightPort = config.blockchain.port;
    $scope.networkKey = config.network.key;
    $scope.networkHost = config.network.host;
    $scope.networkPort = config.network.port;

    $scope.save = function() {
      var network = config.network;
      network.key = $scope.networkKey;
      network.host = $scope.networkHost;
      network.port = $scope.networkPort;

      localStorage.setItem('config', JSON.stringify({
          networkName: $scope.networkName,
          blockchain: {
            host: $scope.insightHost,
            port: $scope.insightPort
          },
          socket: {
            host: $scope.insightHost,
            port: $scope.insightPort
          },
          network: network
        })
      );

      $window.location.href= $window.location.origin + $window.location.pathname;
    };
  });
