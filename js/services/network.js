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

    // set new inbound connections
    var _setNewPeer = function(newPeer) {
      var w   = $rootScope.wallet;
      log('#### Setting new PEER:', newPeer);
      w.sendPublicKeyRing(newPeer);
      w.sendTxProposals(newPeer);
    };

    var _handleNetworkChange = function(newPeer) {
      var cp = $rootScope.cp;

      if (newPeer) 
        _setNewPeer(newPeer);
     
      _refreshUx();
    };

    // TODO -> probably not in network.js
    var storeOpenWallet = function() {
      var w   = $rootScope.wallet;
      w.store();
      log('\t### Wallet %s Stored', w.id);
    };

      // TODO -> probably not in network.js
      var createWallet = function(walletId) {
        var w =  $rootScope.wallet || new copay.Wallet(config);
        w.create({id: walletId});
        w.store();
        $rootScope.wallet   = w;
        log('createWallet ENDED'); //TODO
      };

      var openWallet = function (walletId) {
        var w = $rootScope.wallet || new copay.Wallet(config);
        w.load(walletId);
        if (w && w.publicKeyRing && w.privateKey) {
          log('### WALLET OPENED:', w.walletId);
          $rootScope.wallet   = w;
        }
      };


      var closeWallet = function() {
        var w   = $rootScope.wallet;
        if (w && w.id)
          w.store();

        log('### CLOSING WALLET');
        delete $rootScope['wallet'];
      };

      var _checkWallet = function(walletId) {
        log('[network.js.79:_checkWallet:]',walletId); //TODO

        if ($rootScope.wallet && $rootScope.wallet.id === walletId) 
            return;

        if ($rootScope.wallet && $rootScope.wallet.id  && $rootScope.wallet.id !== walletId) {
            throw new Error('message to wrong walletID');
        }
      
        if (!openWallet(walletId)) {
          createWallet(walletId);
        }
      };

      var _handlePublicKeyRing = function(senderId, data, isInbound) {
        _checkWallet(data.walletId);
        var shouldSend = false;

        var w   = $rootScope.wallet;
        var recipients, pkr = w.publicKeyRing;
        var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);
        if (pkr.merge(inPKR, true)  && !data.isBroadcast) { 
          log('### BROADCASTING PKR');
          recipients = null;
          shouldSend = true;
        }
        else if (isInbound  && !data.isBroadcast) {
          // always replying  to connecting peer
          log('### REPLYING PKR TO:', senderId);
          recipients = senderId;
          shouldSend = true;
        }

        if (shouldSend) {
          w.sendPublicKeyRing(recipients);
        }
        _refreshUx();
      };

      var _handleTxProposals = function(senderId, data, isInbound) {
        _checkWallet(data.walletId);

        var shouldSend = false;
        var w   = $rootScope.wallet;
        log('RECV TXPROPOSAL:',data); //TODO

        var recipients;
        var inTxProposals = copay.TxProposals.fromObj(data.txProposals);
        var mergeInfo = w.txProposals.merge(inTxProposals, true);

        var addSeen = w.addSeenToTxProposals();
        if ((mergeInfo.merged  && !data.isBroadcast) || addSeen) { 
          log('### BROADCASTING txProposals. ' );
          recipients = null;
          shouldSend = true;
        }
        else if (isInbound  && !data.isBroadcast) {
          // always replying  to connecting peer
          log('### REPLYING txProposals TO:', senderId);
          recipients = senderId;
          shouldSend = true;
        }

        if (shouldSend) {
          w.sendTxProposals(recipients);
        }
      };

      var _handleData = function(senderId, data, isInbound) {

        switch(data.type) {
          case 'publicKeyRing':
            _handlePublicKeyRing(senderId, data, isInbound);
            break;
          case 'txProposals':
            _handleTxProposals(senderId, data, isInbound);
            break;
          case 'abort':
            disconnect();
            _refreshUx();
            break;
        }
      };

      // public methods
      var init = function(cb) {
        if (!$rootScope.wallet) {
          // create an empty Wallet
          $rootScope.wallet = new copay.Wallet(config);
        }
        var net = $rootScope.wallet.network;
        net.on('networkChange', _handleNetworkChange);
        net.on('data', _handleData);
        net.start(function(peerId) {
          return cb();
        });
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
      if ($rootScope.wallet.network) {
        $rootScope.wallet.network.connectTo(peerId, openCallback, function () {
          disconnect();
          failCallback();
        });
      }
      else
        return failCallback();
    };

    var sendTxProposals = function(recipients) {
      var w   = $rootScope.wallet;
      w.sendTxProposals(recipients);
    };

    return {
      init: init,
      connect: connect,
      disconnect: disconnect,

      createWallet: createWallet,
      openWallet: openWallet,
      storeOpenWallet: storeOpenWallet,

      sendTxProposals: sendTxProposals,
    } 
  });

