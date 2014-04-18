'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {
    $scope.loading = false;
    $scope.walletIds = walletFactory.getWalletIds();
    $scope.selectedWalletId = $scope.walletIds.length ? $scope.walletIds[0]:null;

    $scope.create = function() {
      $location.path('setup');
    };

    $scope.open = function(walletId) {
      $scope.loading = true;

      var w = walletFactory.open(walletId);
      controllerUtils.setupUxHandlers(w);
      w.netStart();
    };

    $scope.join = function(peerId) {
      $scope.loading = true;
      walletFactory.network.on('openError', function() {
        controllerUtils.onError($scope); 
        $rootScope.$digest();
      });
      walletFactory.connectTo(peerId, function(w) {
        controllerUtils.setupUxHandlers(w);
        w.netStart();
      });
    };
  });
