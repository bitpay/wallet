'use strict';

angular.module('copay.settings').controller('SettingsController',
  function($scope, $rootScope, $window) {
    $scope.title = 'Settings';

    $scope.networkName = config.networkName;
    $scope.blockchainHost = config.blockchain.host;
    $scope.blockchainPort = config.blockchain.port;
    $scope.socketHost = config.socket.host;
    $scope.socketPort = config.socket.port;

    $scope.save = function() {
      localStorage.setItem('config', JSON.stringify({
          networkName: $scope.networkName,
          blockchain: {
            host: $scope.blockchainHost,
            port: $scope.blockchainPort
          },
          socket: {
            host: $scope.socketHost,
            port: $scope.socketPort
          }
        })
      );

      $window.location.reload();
    };
  });
