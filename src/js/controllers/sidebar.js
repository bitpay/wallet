'use strict';

angular.module('copayApp.controllers').controller('sidebarController', 
  function($rootScope, $timeout, identityService, isMobile, isCordova, go) {

  this.isMobile = isMobile.any();
  this.isCordova = isCordova;
  this.username = $rootScope.iden ? $rootScope.iden.username : '';

  this.menu = [{
    'title': 'Home',
    'icon': 'icon-home',
    'link': 'homeWallet'
  }, {
    'title': 'Receive',
    'icon': 'icon-receive',
    'link': 'receive'
  }, {
    'title': 'Send',
    'icon': 'icon-paperplane',
    'link': 'send'
  }, {
    'title': 'History',
    'icon': 'icon-history',
    'link': 'history'
  }];

  this.signout = function() {
    identityService.signout();
  };

  this.switchWallet = function(wid) {
    this.walletSelection = false;
    identityService.setFocusedWallet(wid);
    go.walletHome();
  };

  this.toggleWalletSelection = function() {
    this.walletSelection = !this.walletSelection;
    if (!this.walletSelection) return;
    this.setWallets();
  };

  this.openScanner = function() {
    window.ignoreMobilePause = true;
    cordova.plugins.barcodeScanner.scan(
      function onSuccess(result) {
        $timeout(function() {
          window.ignoreMobilePause = false;
        }, 100);
        if (result.cancelled) return;

        $timeout(function() {
          var data = result.text;
          this.$apply(function() {
            $rootScope.$emit('dataScanned', data); 
          });
        }, 1000);
      },
      function onError(error) {
        $timeout(function() {
          window.ignoreMobilePause = false;
        }, 100);
        alert('Scanning error');
      }
    );
    go.send();
  };

  this.init = function() {
    // This should be called only once.

    // focused wallet change
    if ($rootScope.wallet) {
      $rootScope.$watch('wallet', function() {
        this.walletSelection = false;
        this.setWallets();
      });
    }

    // wallet list change
    if ($rootScope.iden) {
      var iden = $rootScope.iden;
      iden.on('newWallet', function() {
        this.walletSelection = false;
        this.setWallets();
      });
      iden.on('walletDeleted', function(wid) {
        if (wid == $rootScope.wallet.id) {
          copay.logger.debug('Deleted focused wallet:', wid);

          // new focus
          var newWid = $rootScope.iden.getLastFocusedWalletId();
          if (newWid && $rootScope.iden.getWalletById(newWid)) {
            identityService.setFocusedWallet(newWid);
          } else {
            copay.logger.debug('No wallets');
            identityService.noFocusedWallet(newWid);
          }
        }
        this.walletSelection = false;
        this.setWallets();
      });
    }
  };

  this.setWallets = function() {
    if (!$rootScope.iden) return;
    var ret = _.filter($rootScope.iden.getWallets(), function(w) {
      return w;
    });
    this.wallets = _.sortBy(ret, 'name');
  };
});
