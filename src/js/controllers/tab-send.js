'use strict';

angular.module('copayApp.controllers').controller('tabSendController', function($scope, $rootScope, $log, $timeout, $ionicScrollDelegate, addressbookService, profileService, lodash, $state, walletService, incomingData, popupService, platformInfo, bwcError, gettextCatalog, scannerService, bitcoreCash, externalLinkService) {

  var originalList;
  var CONTACTS_SHOW_LIMIT;
  var currentContactsPage;
  $scope.isChromeApp = platformInfo.isChromeApp;
  $scope.serverMessage = null;

  var hasWallets = function() {
    $scope.wallets = profileService.getWallets({
      onlyComplete: true
    });
    $scope.hasWallets = lodash.isEmpty($scope.wallets) ? false : true;
  };

  // THIS is ONLY to show the 'buy bitcoins' message
  // does not has any other function.

  var updateHasFunds = function() {

    if ($rootScope.everHasFunds) {
      $scope.hasFunds = true;
      return;
    }

    $scope.hasFunds = false;
    var foundMessage = false;
    var index = 0;
    lodash.each($scope.wallets, function(w) {
      walletService.getStatus(w, {}, function(err, status) {

        ++index;
        if (err && !status) {
          $log.error(err);
          // error updating the wallet. Probably a network error, do not show
          // the 'buy bitcoins' message.

          $scope.hasFunds = true;
        } else if (status.availableBalanceSat > 0) {
          $scope.hasFunds = true;
          $rootScope.everHasFunds = true;

          if (!foundMessage && !lodash.isEmpty(status.serverMessage)) {
            $scope.serverMessage = status.serverMessage;
            foundMessage = true;
          }
        }

        if (index == $scope.wallets.length) {
          $scope.checkingBalance = false;
          $timeout(function() {
            $scope.$apply();
          });
        }
      });
    });
  };

  var updateWalletsList = function() {

    var networkResult = lodash.countBy($scope.wallets, 'network');

    $scope.showTransferCard = $scope.hasWallets && (networkResult.livenet > 1 || networkResult.testnet > 1);

    if ($scope.showTransferCard) {
      var walletsToTransfer = $scope.wallets;
      if (!(networkResult.livenet > 1)) {
        walletsToTransfer = lodash.filter(walletsToTransfer, function(item) {
          return item.network == 'testnet';
        });
      }
      if (!(networkResult.testnet > 1)) {
        walletsToTransfer = lodash.filter(walletsToTransfer, function(item) {
          return item.network == 'livenet';
        });
      }
      var walletList = [];
      lodash.each(walletsToTransfer, function(v) {
        walletList.push({
          color: v.color,
          name: v.name,
          recipientType: 'wallet',
          coin: v.coin,
          network: v.network,
          getAddress: function(cb) {
            walletService.getAddress(v, false, cb);
          },
        });
      });
      originalList = originalList.concat(walletList);
    }
  }

  var getCoin = function(address) {
    var cashAddress = bitcoreCash.Address.isValid(address, 'livenet');
    if (cashAddress) {
      return 'bch';
    }
    return 'btc';
  };

  var updateContactsList = function(cb) {
    addressbookService.list(function(err, ab) {
      if (err) $log.error(err);

      $scope.hasContacts = lodash.isEmpty(ab) ? false : true;
      if (!$scope.hasContacts) return cb();

      var completeContacts = [];
      lodash.each(ab, function(v, k) {
        completeContacts.push({
          name: lodash.isObject(v) ? v.name : v,
          address: k,
          email: lodash.isObject(v) ? v.email : null,
          recipientType: 'contact',
          coin: getCoin(k),
          getAddress: function(cb) {
            return cb(null, k);
          },
        });
      });
      var contacts = completeContacts.slice(0, (currentContactsPage + 1) * CONTACTS_SHOW_LIMIT);
      $scope.contactsShowMore = completeContacts.length > contacts.length;
      originalList = originalList.concat(contacts);
      return cb();
    });
  };

  var updateList = function() {
    $scope.list = lodash.clone(originalList);
    $timeout(function() {
      $ionicScrollDelegate.resize();
      $scope.$apply();
    }, 10);
  };

  $scope.openScanner = function() {
    var isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;

    if (!isWindowsPhoneApp) {
      $state.go('tabs.scan');
      return;
    }

    scannerService.useOldScanner(function(err, contents) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      incomingData.redir(contents);
    });
  };

  $scope.showMore = function() {
    currentContactsPage++;
    updateWalletsList();
  };

  $scope.searchInFocus = function() {
    $scope.searchFocus = true;
  };

  $scope.searchBlurred = function() {
    if ($scope.formData.search == null || $scope.formData.search.length == 0) {
      $scope.searchFocus = false;
    }
  };

  $scope.findContact = function(search) {

    if (incomingData.redir(search)) {
      return;
    }

    if (!search || search.length < 2) {
      $scope.list = originalList;
      $timeout(function() {
        $scope.$apply();
      });
      return;
    }

    var result = lodash.filter(originalList, function(item) {
      var val = item.name;
      return lodash.includes(val.toLowerCase(), search.toLowerCase());
    });

    $scope.list = result;
  };

  $scope.goToAmount = function(item) {
    $timeout(function() {
      item.getAddress(function(err, addr) {
        if (err || !addr) {
          //Error is already formated
          return popupService.showAlert(err);
        }
        $log.debug('Got toAddress:' + addr + ' | ' + item.name);
        return $state.transitionTo('tabs.send.amount', {
          recipientType: item.recipientType,
          toAddress: addr,
          toName: item.name,
          toEmail: item.email,
          toColor: item.color,
          coin: item.coin
        })
      });
    });
  };

  $scope.openServerMessageLink = function() {
    var url = $scope.serverMessage.link;
    externalLinkService.open(url);
  };

  // This could probably be enhanced refactoring the routes abstract states
  $scope.createWallet = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.add.create-personal');
    });
  };

  $scope.buyBitcoin = function() {
    $state.go('tabs.home').then(function() {
      $state.go('tabs.buyandsell');
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.checkingBalance = true;
    $scope.formData = {
      search: null
    };
    originalList = [];
    CONTACTS_SHOW_LIMIT = 10;
    currentContactsPage = 0;
    hasWallets();
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    if (!$scope.hasWallets) {
      $scope.checkingBalance = false;
      return;
    }
    updateHasFunds();
    updateWalletsList();
    updateContactsList(function() {
      updateList();
    });
  });
});
