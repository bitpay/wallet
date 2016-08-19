'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $ionicModal, $log, $timeout, addressbookService, profileService, configService, lodash, $state, walletService) {

  var originalList;

  $scope.init = function() {
    originalList = [];

    var wallets = profileService.getWallets({onlyComplete: true});

    lodash.each(wallets, function(v) {
      originalList.push({
        color: v.color,
        label: v.name,
        isWallet: true,
        getAddress: function(cb) {
          walletService.getAddress(v, false, cb);
        },
      });
    });

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.isEmptyList = lodash.isEmpty(ab);

      var contacts = [];
      lodash.each(ab, function(v, k) {
        contacts.push({
          label: v,
          address: k,
          getAddress: function(cb) {
            return cb(null,k);
          },
        });
      });

      originalList = originalList.concat(contacts);
      $scope.list = lodash.clone(originalList);
    });
  };

  $scope.findContact = function(search, opts) {
    opts = opts || {};

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter($scope.list, function(item) {
      if (opts && opts.onlyContacts && item.isWallet) return;
      var val = item.label || item.alias || item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    item.getAddress(function(err,addr){
      if (err|| !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got toAddress:' +  addr + ' | ' + item.label)
      return $state.transitionTo('send.amount', { toAddress: addr, toName: item.label})
    });
  };

  /*
   * Modal Addressbook
   */

  $ionicModal.fromTemplateUrl('views/modals/addressbook.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.addressbookModal = modal;
  });

  $scope.openAddressbookModal = function() {
    $scope.addressbookModal.show();
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
          $log.error(err);
          return;
        }
        $scope.init();
        $scope.toggleAddAddressbookEntry();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.remove = function(addr) {
    $timeout(function() {
      addressbookService.remove(addr, function(err, ab) {
        if (err) {
          $scope.error = err;
          return;
        }
        $scope.init();
        $scope.$digest();
      });
    }, 100);
  };

  $scope.$on('$destroy', function() {
    $scope.addressbookModal.remove();
  });


});
