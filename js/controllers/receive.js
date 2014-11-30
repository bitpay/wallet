'use strict';

angular.module('copayApp.controllers').controller('ReceiveController',
  function($scope, $rootScope, $timeout, $modal) {
    $rootScope.title = 'Receive';
    $scope.loading = false;
    $scope.showAll = false;

    $scope.newAddr = function() {
      var w = $rootScope.wallet;
      $scope.loading = true;
      w.generateAddress(null);
      $scope.setAddressList();
      $timeout(function() {
        $scope.loading = false;
      }, 1);
    };

    $scope.openAddressModal = function(address) {
      var ModalInstanceCtrl = function($scope, $modalInstance, address) {
        $scope.address = address;

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/qr-address.html',
        windowClass: 'tiny',
        controller: ModalInstanceCtrl,
        resolve: {
          address: function() {
            return address;
          }
        }
      });
    };

    $scope.toggleShowAll = function() {
      $scope.showAll = !$scope.showAll;
      $scope.setAddressList();
    };

    $scope.setAddressList = function() {
      var w = $rootScope.wallet;
      var balance = $rootScope.balanceByAddr;

      var addresses = w.getAddressesOrderer();
      if (addresses) {
        $scope.addrLength = addresses.length;

        if (!$scope.showAll)
          addresses = addresses.slice(0,3);

        var list = [];
        _.each(addresses, function(address, index){
          list.push({
            'index': index,
            'address': address,
            'balance': balance ? balance[address] : 0,
            'isChange': w.addressIsChange(address),
          });
        });
        $scope.addresses = list;
      }
    };
  }
);
