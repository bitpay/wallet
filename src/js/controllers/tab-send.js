'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, incomingData, popupService) {

  var originalList;
  var CONTACTS_SHOW_LIMIT;
  var currentContactsPage;

  var updateList = function() {
    CONTACTS_SHOW_LIMIT = 10;
    currentContactsPage = 0;
    originalList = [];

    var wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.hasWallets = lodash.isEmpty(wallets) ? false : true;
    $scope.oneWallet = wallets.length == 1;

    if (!$scope.oneWallet) {
      lodash.each(wallets, function(v) {
        originalList.push({
          color: v.color,
          name: v.name,
          isWallet: true,
          getAddress: function(cb) {
            walletService.getAddress(v, false, cb);
          },
        });
      });
    }

    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.hasContacts = lodash.isEmpty(ab) ? false : true;
      var completeContacts = [];
      lodash.each(ab, function(v, k) {
        completeContacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null,
          getAddress: function(cb) {
            return cb(null, k);
          },
        });
      });

      var contacts = completeContacts.slice(0, (currentContactsPage + 1) * CONTACTS_SHOW_LIMIT);
      $scope.contactsShowMore = completeContacts.length > contacts.length;
      originalList = originalList.concat(contacts);
      $scope.list = lodash.clone(originalList);

      $timeout(function() {
        $ionicScrollDelegate.resize();
        $scope.$apply();
      }, 100);
    });
  };

  $scope.showMore = function() {
    currentContactsPage++;
    updateList();
  };

  $scope.findContact = function(search) {

    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      }, 10);
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    item.getAddress(function(err, addr) {
      if (err || !addr) {
        $log.error(err);
        return;
      }
      $log.debug('Got toAddress:' + addr + ' | ' + item.name);
      return $state.transitionTo('tabs.send.amount', {
        isWallet: item.isWallet,
        toAddress: addr,
        toName: item.name,
        toEmail: item.email
      })
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.formData = {
      search: null
    };
    updateList();
  });

});
