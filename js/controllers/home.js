'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, walletFactory, notification, controllerUtils) {

  controllerUtils.redirIfLogged();

  $scope.retreiving = true;

  walletFactory.getWallets(function(ret) {
    $scope.retreiving = false;
    $scope.hasWallets = (ret && ret.length > 0) ? true : false;
  });
});
