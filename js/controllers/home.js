'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, walletFactory, notification, controllerUtils) {

  controllerUtils.redirIfLogged();

  $scope.loading = true;

  walletFactory.getWallets(function(ret) {
    $scope.loading = false;
    $scope.hasWallets = (ret && ret.length > 0) ? true : false;
  });
});
