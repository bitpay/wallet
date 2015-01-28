'use strict';

angular.module('copayApp.controllers').controller('ReceiveController',
  function($scope, $rootScope, $timeout, $modal, isCordova) {

    $scope.newAddr = function() {
      var w = $rootScope.wallet;
      var lastAddr = w.generateAddress(null);
      $scope.setAddressList();
      $scope.addr = lastAddr;
    };

    $scope.copyAddress = function(addr) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(addr);
        window.plugins.toast.showShortCenter('Copied to clipboard');
      }
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
      var scope = $scope;
      var ModalInstanceCtrl = function($scope, $modalInstance, address) {
        $scope.address = address;
        $scope.isCordova = isCordova;
        $scope.copyAddress = function(addr) {
          scope.copyAddress(addr);
        };

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

        var addresses = w.getAddressesOrdered();
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
