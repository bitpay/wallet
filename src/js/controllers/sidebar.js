'use strict';

angular.module('copayApp.controllers').controller('sidebarController',
  function($rootScope, $scope, $timeout, $ionicScrollDelegate, $ionicModal, lodash, profileService, storageService, configService, go, platformInfo) {
    var self = this;
    var config = configService.getSync();
    $scope.isLockedApp = config.app ? config.app.locked : false;
    self.isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;
    self.walletSelection = false;

    self.bitpayCardEnabled = $window.appConfig && $window.appConfig._enabledExtensions.debitcard;


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

    $scope.lockAppChange = function() {
      $scope.isLockedApp = !$scope.isLockedApp;
      var opts = {
        app: {
          locked: $scope.isLockedApp
        }
      };
      configService.set(opts, function(err) {
        if (err) $log.debug(err);
      });

      if (!$scope.isLockedApp) return;

      $rootScope.fromSidebar = true;

      $ionicModal.fromTemplateUrl('views/modals/appLocked.html', {
        scope: $rootScope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $rootScope.appLockedModal = modal;
        $rootScope.appLockedModal.show();
      });
    };

    self.signout = function() {
      profileService.signout();
    };

    self.switchWallet = function(selectedWalletId, currentWalletId) {
      var client = profileService.focusedClient;
      if (selectedWalletId == currentWalletId && client.isComplete()) return;
      self.walletSelection = false;
      profileService.setAndStoreFocus(selectedWalletId, function() {});
      $ionicScrollDelegate.scrollTop();
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

      self.wallets = lodash.sortBy(ret, 'name');
    };

    self.setWallets();
  });
