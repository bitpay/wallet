'use strict';
angular.module('copayApp.controllers').controller('WarningController', function($scope, $rootScope, $location, identityService) {

  $scope.checkLock = function() {
    if (!$rootScope.tmp || !$rootScope.tmp.getLock()) {
      console.log('[warning.js.7] TODO LOCK'); //TODO
    }
  };

  $scope.signout = function() {
    identityService.signout();
  };

  $scope.ignoreLock = function() {
    var w = $rootScope.tmp;
    delete $rootScope['tmp'];

    if (!w) {
      $location.path('/');
    } else {
      w.ignoreLock = 1;
      $scope.loading = true;
      //controllerUtils.startNetwork(w, $scope);
      // TODO
    }
  };
});
