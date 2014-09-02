'use strict';

angular.module('copayApp.controllers').controller('HomeController',
  function($scope, $rootScope, $location, walletFactory, notification, controllerUtils) {
    
    controllerUtils.redirIfLogged();

    $scope.loading = false;
    $scope.hasWallets = (walletFactory.getWallets() && walletFactory.getWallets().length > 0) ? true : false;
  });
