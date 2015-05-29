'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($rootScope, $timeout, lodash, profileService, configService, go) {
    var self = this;
    self.walletSelection = false;

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


    self.signout = function() {
      profileService.signout();
    };

    self.switchWallet = function(wid) {
      self.walletSelection = false;
      profileService.setAndStoreFocus(wid, function() {
      });
    };

    self.toggleWalletSelection = function() {
      self.walletSelection = !self.walletSelection;
      if (!self.walletSelection) return;
      self.setWallets();
    };

    self.setWallets = function() {
      if (!profileService.profile) return;
      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};
      var ret = lodash.map(profileService.profile.credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: config.aliasFor[c.walletId] || c.walletName,
          id: c.walletId,
          color: config.colorFor[c.walletId] || '#4A90E2',
        };
      });
      self.wallets = lodash.sortBy(ret, 'name');
    };

    self.setWallets();

  });
