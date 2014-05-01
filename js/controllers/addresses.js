'use strict';

angular.module('copay.addresses').controller('AddressesController',
  function($scope, $rootScope, controllerUtils) {

    var w = $rootScope.wallet;
    $scope.loading = false;

    $scope.newAddr = function() {
      $scope.loading = true;
      w.generateAddress();
      controllerUtils.updateBalance(function() {
        $scope.loading = false;
        $rootScope.$digest();
      });
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };

  });
