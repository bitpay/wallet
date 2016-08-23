'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo) {
    var self = this;

    self.setWallets = function() {
      $scope.wallets = profileService.getWallets();
    };

    self.updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();

      var i = $scope.wallets.length;
      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          } 
          wallet.status = status;
        });
      });
    }

    self.updateWallet = function(wallet) {

      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        wallet.status = status;
        $timeout(function(){
          $scope.$apply();
        }, 1);
      });
    };



    self.updateAllWallets();
    $scope.bitpayCardEnabled = true; // TODO

    var listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        var wallet = profileService.getWallet(walletId);
        self.updateWallet(wallet);
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        var wallet = profileService.getWallet(walletId);
        self.updateWallet(wallet);
      }),
    ];

    $scope.$on('$destroy', function() {
      lodash.each(listeners, function(x){
        x();
      });
    });

    configService.whenAvailable(function() {
      var config = configService.getSync();
      var glideraEnabled = config.glidera.enabled;
      var coinbaseEnabled = config.coinbase.enabled;
      var isWindowsPhoneApp = platformInfo.isWP && isCordova;
      $scope.buyAndSellEnabled = !isWindowsPhoneApp && (glideraEnabled || coinbaseEnabled);
    });

  });
