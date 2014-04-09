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
      console.log('#### SENDING PKR 1111 ');
      cp.send(newPeer, { 
        type: 'publicKeyRing', 
        publicKeyRing: $rootScope.publicKeyRing.toObj(),
      });
    };

    var _handleNetworkChange = function(newPeer) {
      var cp = $rootScope.cp;

      if (newPeer) 
        _setNewPeer(newPeer);
     
      _store();
      _refreshUx();
    };

    // TODO -> probably not in network.js
    var createWallet = function(walletId) {
      console.log('### CREATING WALLET. ID:' + walletId);

      //TODO create a wallet and WalletId, not only pkr
      var pkr = new copay.PublicKeyRing({
         network: config.networkName,
         id: walletId,
      });
      pkr.addCopayer();
      console.log('\t### PublicKeyRing Initialized:');
      Storage.addWalletId(pkr.id);
      Storage.set(pkr.id, 'publicKeyRing', pkr.toObj());

      $rootScope.walletId = pkr.id; 
      $rootScope.publicKeyRing = pkr;
    };

    var openWallet = function (walletId) {
      var ret = false;
      var pkr = Storage.get(walletId, 'publicKeyRing');

      if (pkr) {
        console.log('### WALLET OPENED:', walletId, pkr);
        $rootScope.walletId = walletId; 
        $rootScope.publicKeyRing = new copay.PublicKeyRing.fromObj(pkr);
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

    var _checkWallet = function(walletId) {
      console.log('[network.js.79:_checkWallet:]',walletId); //TODO

      if ($rootScope.walletId && $rootScope.walletId !== walletId) 
        closeWallet();
      
      if ($rootScope.walletId) 
        return;

      if (!openWallet(walletId)) {
        createWallet(walletId);
      }
    };

    var _handleData = function(senderId, data, isInbound) {
      var cp  = $rootScope.cp;

      switch(data.type) {
        case 'publicKeyRing':

          console.log('[network.js.91:data:]',data); //TODO

          _checkWallet(data.publicKeyRing.id);
          var shouldSend = false;

          var recipients, pkr = $rootScope.publicKeyRing;
          console.log('### RECEIVED PKR FROM:', senderId); 
          if (pkr.merge(data.publicKeyRing, true)  && !data.isBroadcast) { 
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

console.log('[network.js.126] END'); //TODO
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

      var cp = $rootScope.cp = new copay.CopayPeer({
        apiKey: config.p2pApiKey,
        debug:  config.p2pDebug,
      }); 
      _setupHandlers();

      // inicia session
      cp.start(function(peerId) {
        return cb();
      });
    };

    var connect = function(peerId, cb) {
      if ($rootScope.cp) {
        $rootScope.cp.connectTo(peerId, cb);
      }
      else
        return cb();
    };

    var disconnect = function(cb) {
      if ($rootScope.cp) {
        $rootScope.cp.disconnect();
      }
      Storage.remove('peerData'); 
    };

    return {
      init: init,
      connect: connect,
      disconnect: disconnect,
      createWallet: createWallet,
      openWallet: openWallet,
    } 
  });

