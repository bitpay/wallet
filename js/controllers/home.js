'use strict';

angular.module('copayApp.controllers').controller('HomeController',
  function($scope, $rootScope, $location, walletFactory, notification) {
    if ($rootScope.wallet) {
      $location.path('/addresses');
    }

    $scope.loading = false;
    if ($rootScope.pendingPayment) {
      notification.info('Login Required', 'Please open wallet to complete payment');
    }
    $scope.hasWallets = walletFactory.getWallets().length > 0 ? true : false;
  });
