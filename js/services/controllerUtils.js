'use strict';

angular.module('copay.controllerUtils')
  .factory('controllerUtils', function($rootScope, $sce, $location, Socket, video) {
    var root = {};
    $rootScope.videoSrc = {};
    $rootScope.getVideoURL = function(copayer) {
      var encoded = $rootScope.videoSrc[copayer];
      if (!encoded) return;
      var url = decodeURI(encoded);
      var trusted = $sce.trustAsResourceUrl(url);
      return trusted;
    };

    $rootScope.getWalletDisplay = function() {
      var w = $rootScope.wallet;
      return w && (w.name || w.id);
    };

    root.logout = function() {
      console.log('### DELETING WALLET'); //TODO
      $rootScope.wallet = null;
      delete $rootScope['wallet'];
      $rootScope.totalBalance = 0;
      video.close();
      $rootScope.videoSrc = {};
      $location.path('signin');
    };

    root.onError = function(scope) {
      if (scope) scope.loading = false;
      $rootScope.flashMessage = {
        type: 'error',
        message: 'Could not connect to peer: ' +
          scope
      };
      root.logout();
    }

    root.onErrorDigest = function(scope) {
      root.onError(scope);
      $rootScope.$digest();
    }

    root.startNetwork = function(w) {
      var handlePeerVideo = function(err, peerID, url) {
        if (err) {
          delete $rootScope.videoSrc[peerID];
          return;
        }
        $rootScope.videoSrc[peerID] = encodeURI(url);
        $rootScope.$apply();
      };
      w.on('badMessage', function(peerId) {
        $rootScope.flashMessage = {
          type: 'error',
          message: 'Received wrong message from peer id:' + peerId
        };
      });
      w.on('created', function(myPeerID) {
        video.setOwnPeer(myPeerID, w, handlePeerVideo);
        $location.path('addresses');
        $rootScope.wallet = w;
        root.updateBalance();
      });
      w.on('refresh', function() {
        root.updateBalance();
      });
      w.on('publicKeyRingUpdated', function() {
        root.setSocketHandlers();
      });
      w.on('openError', root.onErrorDigest);
      w.on('peer', function(peerID) {
        video.callPeer(peerID, handlePeerVideo);
      });
      w.on('close', root.onErrorDigest);
      w.netStart();
    };

    root.updateBalance = function() {
      var w = $rootScope.wallet;
      if (!w) return;
      w.getBalance(false, function(balance, balanceByAddr) {
        $rootScope.totalBalance = balance;
        $rootScope.balanceByAddr = balanceByAddr;
        console.log('New balance:', balance);
        w.getBalance(true, function(balance) {
          $rootScope.availableBalance = balance;
          $rootScope.$digest();
        });
      });
    };

    root.setSocketHandlers = function() {
      Socket.removeAllListeners();

      var addrs = $rootScope.wallet.getAddressesStr();
      for (var i = 0; i < addrs.length; i++) {
        console.log('### SUBSCRIBE TO', addrs[i]);
        Socket.emit('subscribe', addrs[i]);
      }
      addrs.forEach(function(addr) {
        Socket.on(addr, function(txid) {
          console.log('Received!', txid);
          root.updateBalance();
        });
      });
    };

    return root;
  });
