'use strict';

angular.module('copayApp.controllers').controller('HomeController', function($scope, $rootScope, $location, notification, controllerUtils) {

  controllerUtils.redirIfLogged();

  //$scope.retreiving = true;
  // identity.getWallets(function(err,ret) {
  //   $scope.retreiving = false;
  //   $scope.hasWallets = (ret && ret.length > 0) ? true : false;
  // });
});
