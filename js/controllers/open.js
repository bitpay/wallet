'use strict';

angular.module('copayApp.controllers').controller('OpenController',
  function($scope, $rootScope, walletFactory, controllerUtils, Passphrase, notification) {
    var cmp = function(o1, o2) {
      var v1 = o1.show.toLowerCase(),
        v2 = o2.show.toLowerCase();
      return v1 > v2 ? 1 : (v1 < v2) ? -1 : 0;
    };
    $scope.loading = false;
    $scope.wallets = walletFactory.getWallets().sort(cmp);
    $scope.selectedWalletId = walletFactory.storage.getLastOpened() || ($scope.wallets[0] && $scope.wallets[0].id);
    $scope.openPassword = '';

    $scope.open = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      $scope.loading = true;
      var password = form.openPassword.$modelValue;

      Passphrase.getBase64Async(password, function(passphrase) {
        var w, errMsg;
        try {
          var w = walletFactory.open($scope.selectedWalletId, {
            passphrase: passphrase
          });
        } catch (e) {
          errMsg = e.message;
        };
        if (!w) {
          $scope.loading = false;
          notification.error('Error', errMsg || 'Wrong password');
          $rootScope.$digest();
          return;
        }
        controllerUtils.startNetwork(w, $scope);
      });
    };

  });
