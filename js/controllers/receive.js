'use strict';

angular.module('copayApp.controllers').controller('ReceiveController',
  function($scope, $rootScope, $timeout, $modal) {

    $scope.newAddr = function() {
      var w = $rootScope.wallet;
      $scope.loading = true;
      var lastAddr = w.generateAddress(null);
      $scope.setAddressList();
      $scope.addr = lastAddr;
      $timeout(function() {
        $scope.loading = false;
      }, 1);
    };

    $scope.init = function() {
      $rootScope.title = 'Receive';
      $scope.showAll = false;

      var w = $rootScope.wallet;
      var lastAddr = _.first(w.getAddressesOrdered());
      var balance = w.balanceInfo.balanceByAddr;
      $scope.setAddressList();

      while (balance && balance[lastAddr] > 0) {
        $scope.loading = true;
        lastAddr = w.generateAddress(null);
      };
      $scope.loading = false;
      $scope.addr = lastAddr;
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
      if ($scope.showAll) {
        var w = $rootScope.wallet;
        var balance = w.balanceInfo.balanceByAddr;

        var addresses = w.getAddressesOrderer();
        if (addresses) {
          $scope.addrLength = addresses.length;

          if (!$scope.showAll)
            addresses = addresses.slice(0, 3);

          var list = [];
          _.each(addresses, function(address, index) {
            list.push({
              'index': index,
              'address': address,
              'balance': balance ? balance[address] : null,
              'isChange': w.addressIsChange(address),
            });
          });
          $scope.addresses = list;
        }
      } else {
        $scope.addresses = [];
      }
    };
  }
);
