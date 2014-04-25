'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets();
    $scope.selectedWalletId = $scope.wallets.length ? $scope.wallets[0].id : null;

    $scope.create = function() {
      $scope.loading = true;
      $location.path('setup');
    };

    $scope.open = function(walletId, opts) {
      $scope.loading = true;
      var w = walletFactory.open(walletId, opts);
      controllerUtils.setupUxHandlers(w);
    };

    $scope.join = function(secret) {
      if (!secret || secret.length !==66 || !secret.match(/^[0-9a-f]*$/) ) {
        $rootScope.flashMessage = { message: 'Bad secret secret string', type: 'error'};
        return;
      }
      $scope.loading = true;

      walletFactory.network.on('joinError', function() {
        controllerUtils.onErrorDigest($scope); 
      });

      walletFactory.joinCreateSession(secret, function(w) {
console.log('[signin.js.33] joinCreateSession RETURN', w); //TODO
        controllerUtils.setupUxHandlers(w);
      });
    };
  });
