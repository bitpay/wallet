'use strict';

angular.module('copayApp.controllers').controller('OpenController', function($scope, $rootScope, $location, walletFactory, controllerUtils, Passphrase, notification) {
  controllerUtils.redirIfLogged();

  if ($rootScope.pendingPayment) {
    notification.info('Login Required', 'Please open wallet to complete payment');
  }

  var cmp = function(o1, o2) {
    var v1 = o1.show.toLowerCase(),
      v2 = o2.show.toLowerCase();
    return v1 > v2 ? 1 : (v1 < v2) ? -1 : 0;
  };
  $rootScope.fromSetup = false;
  $scope.loading = false;
  $scope.retreiving = true;
  walletFactory.getWallets(function(wallets) {
    $scope.wallets = wallets.sort(cmp);

    if (!$scope.wallets.length) {
      $location.path('/');
    }

    walletFactory.storage.getLastOpened(function(ret) {
      $scope.selectedWalletId = ret || ($scope.wallets[0] && $scope.wallets[0].id);
      $scope.retreiving = false;
    });
  });

  $scope.openPassword = '';
  $scope.isMobile = !!window.cordova;

  $scope.open = function(form) {
    if (form && form.$invalid) {
      notification.error('Error', 'Please enter the required fields');
      return;
    }

    $scope.loading = true;
    var password = form.openPassword.$modelValue;

    Passphrase.getBase64Async(password, function(passphrase) {
      var w, errMsg;
      walletFactory.open($scope.selectedWalletId, passphrase, function(err, w) {
        if (!w) {
          $scope.loading = false;
          notification.error('Error', err.errMsg || 'Wrong password');
          $rootScope.$digest();
        }
        $rootScope.updatingBalance = true;
        controllerUtils.startNetwork(w, $scope);
      });
    });
  };

});
