'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets();
    $scope.selectedWalletId = $scope.wallets.length ? $scope.wallets[0].id : null;

    $scope.create = function(walletName) {
      $scope.loading = true;
      $rootScope.walletName = walletName;
      $location.path('setup');
    };

    $scope.open = function(walletId, opts) {
      $scope.loading = true;
      var w = walletFactory.open(walletId, opts);
      controllerUtils.startNetwork(w);
    };

    $scope.join = function(secret, nickname ) {
      $scope.loading = true;

      walletFactory.network.on('badSecret', function() {
      });

      walletFactory.joinCreateSession(secret, nickname, function(err,w) {
        $scope.loading = false;

        if (err || !w) {
          if (err === 'joinError') 
            $rootScope.flashMessage = { message: 'Can not find peer'};
          else if (err === 'badSecret')  
            $rootScope.flashMessage = { message: 'Bad secret secret string', type: 'error'};
          else 
            $rootScope.flashMessage = { message: 'Unknown error', type: 'error'};
            controllerUtils.onErrorDigest();
        }
        else
            controllerUtils.startNetwork(w);
      });
    };
  });
