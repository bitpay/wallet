'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope) {
    var peer;

    var _refreshUx = function() {
      var net   = $rootScope.wallet.network;
      log('*** UPDATING UX'); //TODO
      $rootScope.peedId = net.peerId;
      $rootScope.connectedPeers = net.connectedPeers;
      $rootScope.$digest();
    };

    var closeWallet = function() {
      var w   = $rootScope.wallet;
      if (w && w.id) w.store();

      log('### CLOSING WALLET');
      delete $rootScope['wallet'];
    };

    // public methods
    var init = function(walletId, cb) {
      if (!$rootScope.wallet) {
        // create an empty Wallet
        $rootScope.wallet = new copay.Wallet(config);
      }
      var w = $rootScope.wallet;
console.log('[network.js.30:walletId:]',walletId); //TODO
      if (!walletId) w.openWalletId();
      w.on('created', _refreshUx);
      w.on('txProposals', _refreshUx);
      w.on('publicKeyRing', _refreshUx);
      w.on('abort', function() {
        disconnect();
        _refreshUx();
      });
      w.netStart(cb);
    };

    var disconnect = function() {
      var w   = $rootScope.wallet;
      var net = w.network;

      if (net) {
        net.disconnect();
      }
      closeWallet();
    };

    var connect = function(peerId, openCallback, failCallback) {
      $rootScope.wallet.connectTo(peerId);
      $rootScope.wallet.on('open', openCallback);
      $rootScope.wallet.on('close', failCallback);
    };

    var sendTxProposals = function(recipients) {
      var w   = $rootScope.wallet;
      w.sendTxProposals(recipients);
    };

    return {
      init: init,
      connect: connect,
      disconnect: disconnect,
      sendTxProposals: sendTxProposals,
    } 
  });

