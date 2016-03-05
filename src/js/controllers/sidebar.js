'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($rootScope, $scope, $log, $timeout, lodash, profileService, configService, go, isMobile, isCordova) {
    var self = this;
    self.isWindowsPhoneApp = isMobile.Windows() && isCordova;
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

    $scope.sortableOptions = {
      containment: '#scrollable-container',
      scrollableContainer: '#scrollable-container',
      orderChanged: function() {
        self.setWalletSequence();
      },
      //restrict move across columns. move only within column.
      accept: function(sourceItemHandleScope, destSortableScope) {
        return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
      }
    };

    self.closeMenu = function() {
      go.swipe();
    };

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
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};
      config.sequenceFor = config.sequenceFor || {};

      // Sanitize empty wallets (fixed in BWC 1.8.1, and auto fixed when wallets completes)
      var credentials = lodash.filter(profileService.profile.credentials, 'walletName');
      var ret = lodash.map(lodash.range(0, credentials.length), function(i) {
        return {
          m: credentials[i].m,
          n: credentials[i].n,
          name: config.aliasFor[credentials[i].walletId] || credentials[i].walletName,
          id: credentials[i].walletId,
          color: config.colorFor[credentials[i].walletId] || '#4A90E2',
          sequence: config.sequenceFor[credentials[i].walletId],
        };
      });

      if (!lodash.isEmpty(config.sequenceFor))
        self.wallets = lodash.sortBy(ret, 'sequence');
      else
        self.wallets = lodash.sortBy(ret, 'name');
    };

    self.setWalletSequence = function() {
      var opts = {
        sequenceFor: {}
      };

      lodash.each(lodash.range(0, self.wallets.length), function(i) {
        opts.sequenceFor[self.wallets[i].id] = i;
      });

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        $log.debug('Wallet sequence saved');
      });
    };

    self.setWallets();
  });
