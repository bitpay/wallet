'use strict';

angular.module('copayApp.controllers').controller('HomeController',
  function($scope, $rootScope, walletFactory, notification) {
    $scope.loading = false;
    if ($rootScope.pendingPayment) {
      notification.info('Login Required', 'Please open wallet to complete payment');
    }
    $scope.hasWallets = (walletFactory.getWallets() && walletFactory.getWallets().length > 0) ? true : false;
  });
