'use strict';

angular.module('copayApp.controllers').controller('ReceiveController',
  function($scope, $rootScope, $timeout, $modal) {
    $rootScope.title = 'Receive';
    $scope.loading = false;
    $scope.showAll = false;
    $scope.isNewAddr = false;

    $scope.newAddr = function() {
      var w = $rootScope.wallet;
      $scope.loading = true;
      $scope.isNewAddr = false;
      w.generateAddress(null);
      $timeout(function() {
        $scope.loading = false;
        $scope.isNewAddr = true;
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

    $rootScope.$watch('addrInfos', function() {
      if ($rootScope.updatingBalance) return;
      $scope.addressList();
    });

    $scope.toggleShowAll = function() {
      $scope.showAll = !$scope.showAll;
      $scope.addressList();
    };

    $scope.limitAddress = function(elements, isNewAddr) {

      if(!isNewAddr){
        elements = elements.sort(function(a, b) {
          return (+a.isChange - +b.isChange);
        });
      }

      if (elements.length <= 1 || $scope.showAll) {
        return elements;
      }

      // Show last 3 non-change addresses plus those with balance
      var addrs = elements.filter(function(e, i) {
        return (!e.isChange && i < 3) || (e.balance && e.balance > 0);
      });

      return addrs;
    };

    $scope.addressList = function() {
      $scope.addresses = [];
      var w = $rootScope.wallet;
      var balance = $rootScope.balanceByAddr;

      var addresses = w.getAddresses();
      if (addresses) {
        $scope.addrLength = addresses.length;
        _.each(addresses, function(address, index){
          $scope.addresses.push({
            'index': index,
            'address': address,
            'balance': balance ? balance[address] : 0,
            'isChange': w.addressIsChange(address),
            // TODO
            'owned': w.addressIsOwn(address),
          });
        });
        $scope.addresses = $scope.limitAddress($scope.addresses, $scope.isNewAddr);
      }
    };
  }
);
