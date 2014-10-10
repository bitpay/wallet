'use strict';

angular.module('copayApp.controllers').controller('AddressesController',
  function($scope, $rootScope, $timeout, $modal, controllerUtils) {
    controllerUtils.redirIfNotComplete();


    $scope.loading = false;
    $scope.showAll = false;
    var w = $rootScope.wallet;

    $scope.newAddr = function() {
      $scope.loading = true;
      w.generateAddress(null, function() {
        $timeout(function() {
          controllerUtils.updateAddressList();
          $scope.loading = false;
        }, 1);
      });
    };

    $scope.openAddressModal = function(address) {
      var ModalInstanceCtrl = function($scope, $modalInstance, address) {
        $scope.address = address;
        $scope.isMobile = !!window.cordova;

        $scope.mobileCopy = function(address) {
          window.cordova.plugins.clipboard.copy(address);
          window.plugins.toast.showShortBottom('Copied to clipboard');
        }

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

    $scope.limitAddress = function(elements) {

      elements = elements.sort(function(a, b) {
        return (+a.isChange - +b.isChange);
      });

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

      if ($rootScope.addrInfos) {
        var addrInfos = $rootScope.addrInfos;
        $scope.addrLength = addrInfos.length;
        for (var i = 0; i < addrInfos.length; i++) {
          var addrinfo = addrInfos[i];
          $scope.addresses.push({
            'address': addrinfo.addressStr,
            'balance': $rootScope.balanceByAddr ? $rootScope.balanceByAddr[addrinfo.addressStr] : 0,
            'isChange': addrinfo.isChange,
            'owned': addrinfo.owned
          });
        }
        $scope.addresses = $scope.limitAddress($scope.addresses);
      }
    };
  }
);
