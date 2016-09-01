'use strict';

angular.module('copayApp.controllers').controller('addressbookModalController', function($scope, $log, $state, $timeout, $ionicPopup, addressbookService, lodash, popupService) {

  var contacts;

  $scope.initAddressbook = function() {
    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.isEmptyList = lodash.isEmpty(ab);

      contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          label: v,
          address: k
        });
      });

      $scope.addressbook = lodash.clone(contacts);
    });
  };

  $scope.findAddressbook = function(search) {
    if (!search || search.length < 2) {
      $scope.addressbook = contacts;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter(contacts, function(item) {
      var val = item.label;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.addressbook = result;
  };

  $scope.sendTo = function(item) {
    $scope.closeAddressbookModal();
    $timeout(function() {
      $state.transitionTo('send.amount', { toAddress: item.address, toName: item.label})
    }, 100);
  };

  $scope.closeAddressbookModal = function() {
    $scope.cleanAddressbookEntry();
    $scope.addAddressbookEntry = false;
    $scope.addressbookModal.hide();
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

  $scope.cleanAddressbookEntry = function() {
    $scope.addressbookEntry = {
      'address': '',
      'label': ''
    };
  };

  $scope.toggleAddAddressbookEntry = function() {
    $scope.cleanAddressbookEntry();
    $scope.addAddressbookEntry = !$scope.addAddressbookEntry;
  };

  $scope.add = function(addressbook) {
    $timeout(function() {
      addressbookService.add(addressbook, function(err, ab) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        $scope.initAddressbook();
        $scope.toggleAddAddressbookEntry();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    $timeout(function() {
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          popupService.showAlert(err);
          return;
        }
        $scope.initAddressbook();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.$on('$destroy', function() {
    $scope.addressbookModal.remove();
  });

});
