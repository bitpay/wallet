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
      if (!profileService.profile) return;

      var config = configService.getSync();
      config.colorFor = config.colorFor || {};
      config.aliasFor = config.aliasFor || {};

      // Sanitize empty wallets (fixed in BWC 1.8.1, and auto fixed when wallets completes)
      var credentials = lodash.filter(profileService.profile.credentials, 'walletName');
      var ret = lodash.map(credentials, function(c) {
        return {
          m: c.m,
          n: c.n,
          name: config.aliasFor[c.walletId] || c.walletName,
          id: c.walletId,
          color: config.colorFor[c.walletId] || '#4A90E2',
        };
      });

      $scope.wallets = lodash.sortBy(ret, 'name');
    };
    self.updateAllClients = function() {
      lodash.each(profileService.getClients(), function(client) {
        walletService.updateStatus(client, {}, function(err, status) {
          if (err) 
console.log('[tab-home.js.47]', err); //TODO
console.log('[tab-home.js.47:console:]',status); //TODO

          
        });
      });
    }

    self.setWallets();
    self.updateAllClients();
    $scope.bitpayCardEnabled = true; // TODO



  });
