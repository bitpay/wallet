'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, lodash, profileService, walletService, configService ) {
    var self = this;


    // wallet list change
    $rootScope.$on('Local/WalletListUpdated', function(event) {
      self.walletSelection = false;
      self.setWallets();
    });

    $rootScope.$on('Local/ColorUpdated', function(event) {
      self.setWallets();
    });

    $rootScope.$on('Local/AliasUpdated', function(event) {
      self.setWallets();
    });

    self.setWallets = function() { 
      $scope.wallets = profileService.getWallets();
    };

    self.updateAllClients = function() {
      lodash.each(profileService.getWallets(), function(wallet) {
        walletService.updateStatus(wallet, {}, function(err, status) {
          if (err)  {} // TODO
        });
      });
    }

    self.setWallets();
    self.updateAllClients();
    $scope.bitpayCardEnabled = true; // TODO
  });
