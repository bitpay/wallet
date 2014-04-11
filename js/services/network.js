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
      Storage.set(id, 'publicKeyRing',$rootScope.publicKeyRing.toObj());
      Storage.set(id, 'privateKey',   $rootScope.privateKey.toObj());
      Storage.set(id, 'txProposals',  $rootScope.txProposals.toObj());
      console.log('\t### Wallet Stored');
    };

    // TODO -> probably not in network.js
    var createWallet = function(walletId) {

      console.log('### CREATING WALLET. ID:' + walletId);

      var priv = new copay.PrivateKey({networkName: config.networkName});
      console.log('\t### PrivateKey Initialized');
//TODO
console.log('[PRIVATE]',priv.toObj()); //TODO
      
      //TODO create a wallet and WalletId, not only pkr
      var pkr = new copay.PublicKeyRing({
         networkName: config.networkName,
         id: walletId,
         requiredCopayers: config.requiredCopayers || 3,  // TODO set per wallet
         totalCopayers: config.totalCopayers || 5,
      });

console.log('[network.js.70] WALLET ID IS:', pkr.id); //TODO

      // Add self to the ring.
      pkr.addCopayer(priv.getBIP32().extendedPublicKeyString());

      console.log('\t### PublicKeyRing Initialized');

      var txp = new copay.TxProposals({
          networkName: config.networkName,
          publicKeyRing: pkr,
          walletId: pkr.id,
      });
      console.log('\t### TxProposals Initialized');

      // Store it on rootScope
      $rootScope.walletId       = pkr.id; 
      $rootScope.privateKey     = priv;             // TODO secure this.
      $rootScope.publicKeyRing  = pkr;
      $rootScope.txProposals    = txp;

      storeOpenWallet();
    };

    var openWallet = function (walletId) {
console.log('[network.js.90:openWallet:]',walletId); //TODO

      var ret = false;
      var pkr  = Storage.get(walletId, 'publicKeyRing');
      var priv = Storage.get(walletId, 'privateKey');
      var txp  = Storage.get(walletId, 'txProposals');

console.log('[network.js.96:pkr:]',pkr); //TODO
console.log('[network.js.97:priv:]',priv); //TODO


      if (pkr && pkr.copayersExtPubKeys.length && priv) {
        console.log('### WALLET OPENED:', walletId, pkr);
        $rootScope.walletId      = walletId; 
        $rootScope.publicKeyRing = new copay.PublicKeyRing.fromObj(pkr);
        $rootScope.txProposals   = new copay.TxProposals.fromObj(txp);
        $rootScope.PrivateKey    = new copay.PrivateKey.fromObj(priv); //TODO secure

        // Add our key JIC
        try {
          $rootScope.publicKeyRing.addCopayer(
                $rootScope.PrivateKey.getBIP32().extendedPublicKeyString()
          );
        } catch (e) {
console.log('[network.js.103]', e); //TODO
        };
        ret = true;
      }
      return ret;
    };

    var closeWallet = function() {
      console.log('### CLOSING WALLET');
      $rootScope.walletId = null;
      $rootScope.publicKeyRing = null;
      //TODO
    };

    var _checkWallet = function(walletId, allowChange) {
      console.log('[network.js.79:_checkWallet:]',walletId); //TODO

      if ($rootScope.walletId && $rootScope.walletId === walletId) 
          return;

      if ($rootScope.walletId && $rootScope.walletId !== walletId) {
        if (allowChange)  
          closeWallet();
        else 
          throw new Error('message to wrong walletID');
      }

     
      if (!openWallet(walletId)) {
        createWallet(walletId);
      }
    };


    var _handlePublicKeyRing = function(senderId, data, isInbound) {
      var cp  = $rootScope.cp;
      _checkWallet(data.publicKeyRing.id, true);
      var shouldSend = false;

      var recipients, pkr = $rootScope.publicKeyRing;
      var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);
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

      if (shouldSend) {
        console.log('### SENDING PKR TO:', recipients);
        cp.send( recipients, { 
          type: 'publicKeyRing', 
          publicKeyRing: $rootScope.publicKeyRing.toObj(),
        });
      }
    };

    var sendTxProposals = function(recipients) {
      var cp  = $rootScope.cp;
      console.log('### SENDING txProposals TO:', recipients||'All');
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

    var _handleTxProposals = function(senderId, data, isInbound) {
      var cp  = $rootScope.cp;
      _checkWallet(data.txProposals.walletId, false);

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
        this.sendTxProposals(recipients);
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
 
      }
      _refreshUx();
    };
    var _setupHandlers = function () {
      var cp = $rootScope.cp;
      cp.on('networkChange', _handleNetworkChange);
      cp.on('data', _handleData);
    };

    // public methods
    var init = function(cb) {
      var cp = $rootScope.cp = new copay.CopayPeer({
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
      Storage.remove('peerData'); 
      $rootScope.isLogged = false;
      _refreshUx();
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

