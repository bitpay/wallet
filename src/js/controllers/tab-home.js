'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo) {
    var self = this;
    $scope.txps = [];

    self.setWallets = function() {
      $scope.wallets = profileService.getWallets();
    };


    var setPendingTxps = function(txps) {
      if (!txps) {
        $scope.txps = [];
        return;
      }
      $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();

console.log('[tab-home.js.18]', $scope.txps); //TODO
    };

    self.updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();

      var txps = [];
      var i = $scope.wallets.length;
      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          } 

          if (status.pendingTxps && status.pendingTxps[0]) {
            txps = txps.concat(status.pendingTxps);
          }
          if (--i == 0) {
            setPendingTxps(txps);
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
        var txps = lodash.filter($scope.txps, function(x) {
          return x.walletId != wallet.id;
        });

        var wasAny = txps.length != $scope.txps.length;

        if ( (status.pendingTxps && status.pendingTxps[0]) || wasAny ) {
          txps = txps.concat(status.pendingTxps);
          setPendingTxps(txps);
        }
        wallet.status = status;
        $scope.$apply();
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

    var GLIDERA_LOCK_TIME = 6 * 60 * 60;

    var glideraActive = true; // TODO TODO TODO
    // isGlidera flag is a security measure so glidera status is not
    // only determined by the tx.message
    $scope.openTxpModal = function(tx) {
      var config = configService.getSync().wallet;
      var scope = $rootScope.$new(true);
      scope.tx = tx;
      scope.wallet = tx.wallet;
      scope.copayers = tx.wallet.copayers;
      scope.isGlidera = glideraActive;
      scope.currentSpendUnconfirmed = config.spendUnconfirmed;

      $ionicModal.fromTemplateUrl('views/modals/txp-details.html', {
        scope: scope
      }).then(function(modal) {
        scope.txpDetailsModal = modal;
        scope.txpDetailsModal.show();
      });
    };

    configService.whenAvailable(function() {
      var config = configService.getSync();
      var glideraEnabled = config.glidera.enabled;
      var coinbaseEnabled = config.coinbase.enabled;
      var isWindowsPhoneApp = platformInfo.isWP && isCordova;
      $scope.buyAndSellEnabled = !isWindowsPhoneApp && (glideraEnabled || coinbaseEnabled);
    });

  });
