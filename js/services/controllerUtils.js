'use strict';

angular.module('copay.controllerUtils')
  .factory('controllerUtils', function($rootScope, $sce, $location, Socket, video) {
    var root = {};
    $rootScope.videoInfo = {};
    $rootScope.loading = false;

    $rootScope.getVideoURL = function(copayer) {
      var vi = $rootScope.videoInfo[copayer]
      if (!vi) return;
      var encoded = vi.url;
      var url = decodeURI(encoded);
      var trusted = $sce.trustAsResourceUrl(url);
      return trusted;
    };

    $rootScope.getVideoMutedStatus = function(copayer) {
      var vi = $rootScope.videoInfo[copayer]
      if (!vi) {
        return;
      }
      return vi.muted;
    };

    $rootScope.getWalletDisplay = function() {
      var w = $rootScope.wallet;
      return w && (w.name || w.id);
    };

    root.logout = function() {
      $rootScope.wallet = null;
      delete $rootScope['wallet'];
      $rootScope.totalBalance = 0;
      video.close();
      $rootScope.videoInfo = {};
      $location.path('signin');
    };

    root.onError = function(scope) {
      if (scope) scope.loading = false;
      root.logout();
    }

    root.onErrorDigest = function(scope) {
      root.onError(scope);
      $rootScope.$digest();
    }

    root.startNetwork = function(w) {
      var handlePeerVideo = function(err, peerID, url) {
        if (err) {
          delete $rootScope.videoInfo[peerID];
          return;
        }
        $rootScope.videoInfo[peerID] = {
          url: encodeURI(url),
          muted: peerID === w.network.peerId
        };
        $rootScope.$digest();
      };
      w.on('badMessage', function(peerId) {
        $rootScope.flashMessage = {
          type: 'error',
          message: 'Received wrong message from peer id:' + peerId
        };
      });
      w.on('created', function(myPeerID) {
        video.setOwnPeer(myPeerID, w, handlePeerVideo);
        $rootScope.wallet = w;
        $location.path('addresses');
      });
      w.on('refresh', function() {
        root.updateBalance(function() {
          $rootScope.$digest();
        });
        $rootScope.$digest();
      });
      w.on('publicKeyRingUpdated', function() {
        root.updateBalance(function() {
          $rootScope.$digest();
        });
      });
      w.on('openError', root.onErrorDigest);
      w.on('peer', function(peerID) {
        video.callPeer(peerID, handlePeerVideo);
      });
      w.on('close', root.onErrorDigest);
      w.netStart();
    };

    root.updateBalance = function(cb) {
      root.setSocketHandlers();
      $rootScope.balanceByAddr = {};
      var w = $rootScope.wallet;
      $rootScope.addrInfos = w.getAddressesInfo();
      if ($rootScope.addrInfos.length === 0) return;
      $rootScope.loading = true;
      w.getBalance(false, function(balance, balanceByAddr) {
        console.log('New total balance:', balance);
        $rootScope.totalBalance = balance;
        $rootScope.balanceByAddr = balanceByAddr;
        $rootScope.selectedAddr = $rootScope.addrInfos[0].address.toString();
        $rootScope.loading = false;
        if (cb) cb();
      });
      w.getBalance(true, function(balance) {
        console.log('New available balance:', balance);
        $rootScope.availableBalance = balance;
        $rootScope.loading = false;
        if (cb) cb();
      });
    };

    root.setSocketHandlers = function() {
      // TODO: optimize this?
      Socket.removeAllListeners();
      if (!$rootScope.wallet) return;

      var addrs = $rootScope.wallet.getAddressesStr();
      for (var i = 0; i < addrs.length; i++) {
        console.log('### SUBSCRIBE TO', addrs[i]);
        Socket.emit('subscribe', addrs[i]);
      }
      addrs.forEach(function(addr) {
        Socket.on(addr, function(txid) {
          console.log('Received!', txid);
          root.updateBalance(function() {
            $rootScope.$digest();
          });
        });
      });
    };
    return root;
  });
