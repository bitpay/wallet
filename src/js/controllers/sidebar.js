'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($rootScope, $timeout, $log, lodash, profileService, configService, go, isMobile, isCordova, themeCatalogService) {
    var self = this;
    self.isWindowsPhoneApp = isMobile.Windows() && isCordova;
    self.walletSelection = false;

    // wallet list change
    $rootScope.$on('Local/WalletListUpdated', function(event) {
      self.walletSelection = false;
      self.setWallets();
    });

    $rootScope.$on('Local/SkinUpdated', function(event) {
      self.setWallets();
    });
    
    $rootScope.$on('Local/ThemeUpdated', function(event) {
      self.setWallets();
    });
    
    $rootScope.$on('Local/AliasUpdated', function(event) {
      self.setWallets();
    });

    self.signout = function() {
      profileService.signout();
    };

    self.switchWallet = function(selectedWalletId, currentWalletId) {
      if (selectedWalletId == currentWalletId) return;
      self.walletSelection = false;
      profileService.setAndStoreFocus(selectedWalletId, function() {});
    };

    self.toggleWalletSelection = function() {
      self.walletSelection = !self.walletSelection;
      if (!self.walletSelection) return;
      self.setWallets();
    };

    self.setWallets = function() {
      if (!profileService.profile) return;

      var config = configService.getSync();
      var catalog = themeCatalogService.getSync();
      config.aliasFor = config.aliasFor || {};
      catalog.skinFor = catalog.skinFor || {};

      // Sanitize empty wallets (fixed in BWC 1.8.1, and auto fixed when wallets completes)
      var credentials = lodash.filter(profileService.profile.credentials, 'walletName');
      var ret = lodash.map(credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: config.aliasFor[c.walletId] || c.walletName,
          id: c.walletId,
          avatarIsWalletName: (catalog.skinFor[c.walletId] !== undefined ? $rootScope.theme.skins[catalog.skinFor[c.walletId]].avatarIsWalletName : $rootScope.theme.skins[$rootScope.theme.header.defaultSkinId].avatarIsWalletName),
          avatarBackground: (catalog.skinFor[c.walletId] !== undefined ? $rootScope.theme.skins[catalog.skinFor[c.walletId]].avatarBackground : $rootScope.theme.skins[$rootScope.theme.header.defaultSkinId].avatarBackground),
          avatarBorder: (catalog.skinFor[c.walletId] !== undefined ? $rootScope.theme.skins[catalog.skinFor[c.walletId]].avatarBorderSmall : $rootScope.theme.skins[$rootScope.theme.header.defaultSkinId].avatarBorderSmall),
        };
      });

      self.wallets = lodash.sortBy(ret, 'name');
    };

    self.setWallets();

  });
