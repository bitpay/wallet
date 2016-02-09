'use strict';

angular.module('copayApp.controllers').controller('destinationAddressController', function($scope, $rootScope, $timeout, addressbookService, profileService) {

	var self = $scope.self;
  var fc = profileService.focusedClient;

  $scope.editAddressbook = false;
  $scope.addAddressbookEntry = false;
  $scope.selectedAddressbook = {};
  $scope.walletName = fc.credentials.walletName;
  $scope.addressbook = {
    'address': ($scope.newAddress || ''),
    'label': ''
  };

  $scope.beforeQrCodeScann = function() {
    $scope.error = null;
    $scope.addAddressbookEntry = true;
    $scope.editAddressbook = false;
  };

  $scope.onQrCodeScanned = function(data, addressbookForm) {
    $timeout(function() {
      var form = addressbookForm;
      if (data && form) {
        data = data.replace('bitcoin:', '');
        form.address.$setViewValue(data);
        form.address.$isValid = true;
        form.address.$render();
      }
      $scope.$digest();
    }, 100);
  };

  $scope.selectAddressbook = function(addr) {
    self.setForm(addr);
    $scope.cancel();
  };

  $scope.toggleEditAddressbook = function() {
    $scope.editAddressbook = !$scope.editAddressbook;
    $scope.selectedAddressbook = {};
    $scope.addAddressbookEntry = false;
  };

  $scope.toggleSelectAddressbook = function(addr) {
    $scope.selectedAddressbook[addr] = $scope.selectedAddressbook[addr] ? false : true;
  };

  $scope.toggleAddAddressbookEntry = function() {
    $scope.error = null;
    $scope.addressbook = {
      'address': ($scope.newAddress || ''),
      'label': ''
    };
    $scope.addAddressbookEntry = !$scope.addAddressbookEntry;
  };

  $scope.list = function() {
    $scope.error = null;
    addressbookService.list(function(err, ab) {
      if (err) {
        $scope.error = err;
        return;
      }
      $scope.list = ab;
    });
  };

  $scope.add = function(addressbook) {
    $scope.error = null;
    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          $scope.error = err;
          return;
        }
        $rootScope.$emit('Local/AddressbookUpdated', ab);
        $scope.list = ab;
        $scope.editAddressbook = true;
        $scope.toggleEditAddressbook();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    $scope.error = null;
    $timeout(function() {
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          $scope.error = err;
          return;
        }
        $rootScope.$emit('Local/AddressbookUpdated', ab);
        $scope.list = ab;
        $scope.$digest();
      });
    }, 100);
  };

  $scope.cancel = function() {
    $scope.destinationAddressModal.hide();
    $scope.destinationAddressModal.remove();
		$rootScope.modalOpened = false;
  };

  $scope.selectWallet = function(walletId, walletName) {
    $scope.gettingAddress = true;
    $scope.selectedWalletName = walletName;
    $timeout(function() {
      $scope.$apply();
    });
    addressService.getAddress(walletId, false, function(err, addr) {
      $scope.gettingAddress = false;

      if (err) {
        self.error = err;
	      $scope.cancel();
        return;
      }

      self.setForm(addr);
      $scope.cancel();
    });
  };

});