'use strict';

angular.module('copayApp.controllers').controller('AddressesController',
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

    $rootScope.$watch('addrInfos', function() {
      $scope.addressList();
    });   

    $scope.addressList = function () {
      $scope.addresses = [];
      var addrInfos = $rootScope.addrInfos;
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
        $scope.addrWithFund = $rootScope.receivedFund ? $rootScope.receivedFund[1] : null;
        $rootScope.receivedFund = null;
      }
    }

  });
