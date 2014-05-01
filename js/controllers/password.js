'use strict';

angular.module('copay.password').controller('PasswordController',
  function($scope, $rootScope, Passphrase, walletFactory, controllerUtils) {
    $scope.title = 'Password';
    $scope.loading = false;

    $scope.getPassphrase = function() {
      $scope.loading = true;
      var passphrase = Passphrase.getBase64($scope.password);

      var w = walletFactory.open($rootScope.openedWalletId, { passphrase: passphrase});
      controllerUtils.startNetwork(w);
    };
  });
