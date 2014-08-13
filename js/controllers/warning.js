'use strict';
angular.module('copayApp.controllers').controller('WarningController', function($scope, $rootScope, $location, controllerUtils) {


  $scope.checkLock = function() {
    if (!$rootScope.tmp || !$rootScope.tmp.getLock()) {
      controllerUtils.redirIfLogged();
    }
  };


  $scope.signout = function() {
    controllerUtils.logout();
  };

  $scope.ignoreLock = function() {
    var w = $rootScope.tmp;
    delete $rootScope['tmp'];

    if (!w) {
      $location.path('/');
    } else {
      w.ignoreLock = 1;
      $scope.loading = true;
      controllerUtils.startNetwork(w, $scope);
    }
  };
});
