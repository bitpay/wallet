'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log) {
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


    var setPendingTxps = function(txps) {
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

        if (tx.creatorId != tx.wallet.copayerId) {
          $scope.pendingTxProposalsCountForUs = $scope.pendingTxProposalsCountForUs + 1;
        }
      });
      $scope.txps = txps;
    };

    self.updateAllClients = function() {
      var txps = [];
      var wallets = profileService.getWallets();
      var l = wallets.length,
        i = 0;

      lodash.each(wallets, function(wallet) {
        walletService.updateStatus(wallet, {}, function(err) {
          var status = wallet.status;
          if (err) {
            console.log('[tab-home.js.35:err:]',$log.error(err)); //TODO
            return; 
          } // TODO
          if (status.pendingTxps && status.pendingTxps[0]) {
            txps = txps.concat(status.pendingTxps);
          }
          if (++i == l) {
            setPendingTxps(txps);
          }
        });
      });
    }

    self.setWallets();
    self.updateAllClients();
    $scope.bitpayCardEnabled = true; // TODO


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

    //    $state.transitionTo('confirm', {toAmount:555500, toAddress: 'mvfAwUJohJWibGzBZgAUGsDarsr4Z4NovU', toName: 'bla bla'});
  });
