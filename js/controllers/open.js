'use strict';

angular.module('copayApp.controllers').controller('OpenController', function($scope, $rootScope, $location, controllerUtils, Passphrase, notification) {
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

  identity.getWallets(function(err, wallets) {

    if (err || !wallets || !wallets.length) {
      $location.path('/');
    } else {
      $scope.retreiving = false;
      $scope.wallets = wallets.sort(cmp);
      var lastOpened = _.findWhere($scope.wallets, {
        lastOpened: true
      });
      $scope.selectedWalletId = lastOpened ? lastOpened.id : ($scope.wallets[0] && $scope.wallets[0].id);

      setTimeout(function() {
        $rootScope.$digest();
      }, 0);
    }
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
      identity.open($scope.selectedWalletId, passphrase, function(err, w) {
        if (!w) {
          $scope.loading = false;
          notification.error('Error', err.errMsg || 'Wrong password');
          $rootScope.$digest();
        } else {
          $rootScope.updatingBalance = true;
          controllerUtils.startNetwork(w, $scope);
        }
      });
    });
  };

});
