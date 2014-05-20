'use strict';

angular.module('copay.addresses').controller('AddressesController',
  function($scope, $rootScope, $timeout, controllerUtils) {
    $scope.loading = false;
    var w = $rootScope.wallet;

    $scope.newAddr = function() {
      $scope.loading = true;
      w.generateAddress(null, function() {
        $timeout(function() {
          controllerUtils.setSocketHandlers();
          controllerUtils.updateAddressList();
          $rootScope.selectedAddr = $rootScope.addrInfos[0].address.toString();
          $scope.loading = false;
          $rootScope.$digest();
        },1);
      });
    };

    $scope.selectAddr = function (addr) {
      return addr === $rootScope.selectedAddr ? 'selected' : '';
    };
  });
