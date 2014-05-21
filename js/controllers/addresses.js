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
          $scope.loading = false;
        },1);
      });
    };

    $scope.selectAddress = function (addr) {
      $scope.selectedAddr = addr;
    };

    $rootScope.$watch('addrInfos', function(addrInfos) {
      $scope.addressList(addrInfos);
    });   

    $scope.addressList = function (addrInfos) {
      $scope.addresses = [];
      if (addrInfos) {
        for(var i=0;i<addrInfos.length;i++) {
          var addrinfo = addrInfos[i];
          $scope.addresses.push({ 
            'address' : addrinfo.address.toString(),
            'balance' : $rootScope.balanceByAddr ? $rootScope.balanceByAddr[addrinfo.address.toString()] : 0,
            'isChange': addrinfo.isChange
          });
        }
        $scope.selectedAddr = $scope.addresses[0];
      }
    }

  });
