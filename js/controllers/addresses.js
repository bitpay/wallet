'use strict';

angular.module('copay.addresses').controller('AddressesController',
  function($scope, $rootScope, controllerUtils) {
    $scope.loading = false;
    var w = $rootScope.wallet;
    $scope.newAddr = function() {
      $scope.loading=true;
      w.generateAddress(null, function() {
        setTimeout(function() {
          controllerUtils.setSocketHandlers();
          controllerUtils.updateAddressList();
          $scope.loading=false;
          $rootScope.$digest();
        },1);
      });
    };

    $scope.selectAddr = function(addr) {
      $scope.selectedAddr = addr;
    };

  });
