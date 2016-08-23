'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo) {
    var self = this;

    self.glideraEnabled = configService.getSync().glidera.enabled;


    var setPendingTxps = function(txps) {
      if (!txps) {
        $scope.txps = [];
        return;
      }
      $scope.txps = txps.sort(function(a, b) {
        return a.walletId.localeCompare(b.walletId);
      });
    };

    var formatPendingTxps = function(txps) {
      $scope.pendingTxProposalsCountForUs = 0;
      var now = Math.floor(Date.now() / 1000);

      /* To test multiple outputs...
      var txp = {
        message: 'test multi-output',
        fee: 1000,
        createdOn: new Date() / 1000,
        outputs: []
      };
      function addOutput(n) {
        txp.outputs.push({
          amount: 600,
          toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
          message: 'output #' + (Number(n) + 1)
        });
      };
      lodash.times(150, addOutput);
      txps.push(txp);
      */

      lodash.each(txps, function(tx) {

        tx = txFormatService.processTx(tx);

        // no future transactions...
        if (tx.createdOn > now)
          tx.createdOn = now;

        tx.wallet = profileService.getWallet(tx.walletId);
        if (!tx.wallet) {
          $log.error("no wallet at txp?");
          return;
        }

        var action = lodash.find(tx.actions, {
          copayerId: tx.wallet.copayerId
        });

        if (!action && tx.status == 'pending') {
          tx.pendingForUs = true;
        }

        if (action && action.type == 'accept') {
          tx.statusForUs = 'accepted';
        } else if (action && action.type == 'reject') {
          tx.statusForUs = 'rejected';
        } else {
          tx.statusForUs = 'pending';
        }

        if (!tx.deleteLockTime)
          tx.canBeRemoved = true;
      });

      return txps;
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
          } // TODO
          if (status.pendingTxps && status.pendingTxps[0]) {
            txps = txps.concat(status.pendingTxps);
          }
          if (--i == 0) {
            txps = formatPendingTxps(txps);
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
        if (status.pendingTxps && status.pendingTxps[0]) {
          var txps = lodash.filter($scope.txps, function(x) {
            return x.walletId != wallet.id;
          });
          txps = txps.concat(status.pendingTxps);
          txps = formatPendingTxps(txps);
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
      $rootScope.$on('Local/TxAction', function(e, walletId, type, n) {
        var wallet = profileService.getWallet(walletId);
        self.updateWallet(wallet);
      }),
    ];

    $scope.$on('$destroy', function() {
      lodash.each(listeners, function(x){
        x();
      });
    });

    var config = configService.getSync().wallet;

    var GLIDERA_LOCK_TIME = 6 * 60 * 60;

    var glideraActive = true; // TODO TODO TODO
    // isGlidera flag is a security measure so glidera status is not
    // only determined by the tx.message
    $scope.openTxpModal = function(tx) {
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

    $scope.init = function() {
      var config = configService.getSync();
      var isWindowsPhoneApp = platformInfo.isWP && isCordova;
      var glideraEnabled = config.glidera.enabled;
      var coinbaseEnabled = config.coinbase.enabled;
      $scope.buyAndSellEnabled = !isWindowsPhoneApp && (glideraEnabled || coinbaseEnabled);
    }

  });
