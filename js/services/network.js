'use strict';

angular.module('copay.network')
  .factory('Network', function($rootScope, Storage) {
    var peer;


    var _refreshUx = function() {
      var cp = $rootScope.cp;
      console.log('*** UPDATING UX'); //TODO
      $rootScope.peerId = cp.peerId;
      $rootScope.connectedPeers = cp.connectedPeers;
      $rootScope.$digest();
    };

    var _store = function() {
      Storage.set($rootScope.walletId, 'peerData', {
        peerId: $rootScope.peerId,
        connectedPeers: $rootScope.connectedPeers
      });
    };

    // set new inbound connections
    var _setNewPeer = function(newPeer) {
      var cp = $rootScope.cp;
      console.log('#### Setting new PEER:', newPeer);
      sendPublicKeyRing(newPeer);
      sendTxProposals(newPeer);
 
    };

    var _handleNetworkChange = function(newPeer) {
      var cp = $rootScope.cp;

      if (newPeer) 
        _setNewPeer(newPeer);
     
      _store();
      _refreshUx();
    };

    // TODO -> probably not in network.js
    var storeOpenWallet = function() {
      var id = $rootScope.walletId;
      Storage.addWalletId(id);
      Storage.set(id, 'wallet',$rootScope.wallet.toObj());
      console.log('\t### Wallet %s Stored', id);
    };

    // TODO -> probably not in network.js
    var createWallet = function(walletId) {

      var w = new copay.Wallet.create(config, {walletId: walletId});

      // Store it on rootScope
      $rootScope.wallet   = w;
      $rootScope.walletId = w.id; 
      w.store();
    };

    var openWallet = function (walletId) {


      var w = Wallet.read(walletId);

      if (w && w.publicKeyRing.copayersExtPubKeys.length && w.privateKey) {
        console.log('### WALLET OPENED:', w.walletId);
        $rootScope.walletId = walletId; 
        $rootScope.wallet   = w;
      }
    };
    var closeWallet = function() {
      console.log('### CLOSING WALLET');
      $rootScope.delete('walletId');
      $rootScope.delete('w');
    };

    var _checkWallet = function(walletId, allowChange) {
      console.log('[network.js.79:_checkWallet:]',walletId); //TODO

      if ($rootScope.walletId && $rootScope.walletId === walletId) 
          return;

      if ($rootScope.walletId && $rootScope.walletId !== walletId) {
          throw new Error('message to wrong walletID');
      }

     
      if (!openWallet(walletId)) {
        createWallet(walletId);
      }
    };


    var sendTxProposals = function(recipients) {
      var cp  = $rootScope.cp;
      console.log('### SENDING txProposals TO:', recipients||'All', $rootScope.txProposals);
      cp.send( recipients, { 
        type: 'txProposals', 
        txProposals: $rootScope.txProposals.toObj(),
        walletId: $rootScope.walletId,
      });
    };
    var sendPublicKeyRing = function(recipients) {
      var cp  = $rootScope.cp;
      console.log('### SENDING publicKeyRing TO:', recipients||'All');
 
      cp.send(recipients, { 
        type: 'publicKeyRing', 
        publicKeyRing: $rootScope.publicKeyRing.toObj(),
      });
    };

    var _handlePublicKeyRing = function(senderId, data, isInbound) {
      var cp  = $rootScope.cp;
      _checkWallet(data.publicKeyRing.id);
      var shouldSend = false;

      var recipients, pkr = $rootScope.publicKeyRing;
      var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);
console.log('[network.js.176:inPKR:]',inPKR); //TODO
console.log('[network.js.178:pkr:]',pkr); //TODO
      if (pkr.merge(inPKR, true)  && !data.isBroadcast) { 
        console.log('### BROADCASTING PKR');
        recipients = null;
        shouldSend = true;
      }
      else if (isInbound  && !data.isBroadcast) {
        // always replying  to connecting peer
        console.log('### REPLYING PKR TO:', senderId);
        recipients = senderId;
        shouldSend = true;
      }

      console.log('[network.js.189:shouldSend:]',shouldSend); //TODO
      if (shouldSend) {
        sendPublicKeyRing(recipients);
      }
      _refreshUx();
    };
    var _handleTxProposals = function(senderId, data, isInbound) {
      var cp  = $rootScope.cp;
      _checkWallet(data.txProposals.walletId);

      var shouldSend = false;
      console.log('RECV TXPROPOSAL:',data); //TODO
      var recipients, pkr = $rootScope.txProposals;

      var inTxProposals = copay.TxProposals.fromObj(data.txProposals);
      var mergeInfo = pkr.merge(inTxProposals, true);
      if ( mergeInfo.merged  && !data.isBroadcast) { 
        console.log('### BROADCASTING txProposals');
        recipients = null;
        shouldSend = true;
      }
      else if (isInbound  && !data.isBroadcast) {
        // always replying  to connecting peer
        console.log('### REPLYING txProposals TO:', senderId);
        recipients = senderId;
        shouldSend = true;
      }

      if (shouldSend) {
        sendTxProposals(recipients);
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
    var _setupHandlers = function () {
      var cp = $rootScope.cp;
      cp.on('networkChange', _handleNetworkChange);
      cp.on('data', _handleData);
    };

    // public methods
    var init = function(cb) {
      var cp = $rootScope.cp = new copay.Network({
        apiKey: config.p2pApiKey,
        debug:  config.p2pDebug,
        maxPeers: config.maxPeers,    // TODO: This should be on wallet configuration
      }); 
      _setupHandlers();

      cp.start(function(peerId) {
        return cb();
      });
    };

    var disconnect = function() {
      if ($rootScope.cp) {
        $rootScope.cp.disconnect();
      }
      closeWallet();
      Storage.remove('peerData'); 
      $rootScope.isLogged = false;
    };

    var connect = function(peerId, openCallback, failCallback) {
      if ($rootScope.cp) {
        $rootScope.cp.connectTo(peerId, openCallback, function () {
          disconnect();
          failCallback();
        });
      }
      else
        return failCallback();
    };

    return {
      init: init,
      connect: connect,
      disconnect: disconnect,
      sendTxProposals: sendTxProposals,

// TODO Move to Wallet.
      createWallet: createWallet,
      openWallet: openWallet,
      storeOpenWallet: storeOpenWallet,
    } 
  });

