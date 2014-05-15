'use strict';

angular.module('copay.controllerUtils')
  .factory('controllerUtils', function($rootScope, $sce, $location, Socket, video) {
    var root = {};
    $rootScope.videoInfo = {};
    $rootScope.loading = false;

    $rootScope.getVideoURL = function(copayer) {
      var vi = $rootScope.videoInfo[copayer]
      if (!vi) return;

      if ($rootScope.wallet.getOnlinePeerIDs().indexOf(copayer) === -1) {
        // peer disconnected, remove his video
        delete $rootScope.videoInfo[copayer]
        return;
      }

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
      w.on('ready', function(myPeerID) {
        video.setOwnPeer(myPeerID, w, handlePeerVideo);
        $rootScope.wallet = w;
        $location.path('addresses');
        $rootScope.$digest();
      });
      w.on('refresh', function() {
        root.updateBalance();
        $rootScope.$digest();
      });
      w.on('txProposalsUpdated', function() {
        root.updateTxs();
        root.updateBalance();
      });
      w.on('openError', root.onErrorDigest);
      w.on('connect', function(peerID) {
        if (peerID) {
          video.callPeer(peerID, handlePeerVideo);
        }
        $rootScope.$digest();
      });
      w.on('disconnect', function(peerID) {
        $rootScope.$digest();
      });
      w.on('close', root.onErrorDigest);
      w.netStart();
    };

    root.updateBalance = function(cb) {
      $rootScope.balanceByAddr = {};
      var w = $rootScope.wallet;
      $rootScope.addrInfos = w.getAddressesInfo();
      if ($rootScope.addrInfos.length === 0) return;
      $rootScope.loading = true;
      w.getBalance(false, function(balance, balanceByAddr) {
        $rootScope.totalBalance = balance;
        $rootScope.balanceByAddr = balanceByAddr;
        $rootScope.selectedAddr = $rootScope.addrInfos[0].address.toString();
        $rootScope.loading = false;
        $rootScope.$digest();
        if (cb) cb();
      });
      w.getBalance(true, function(balance) {
        $rootScope.availableBalance = balance;
        $rootScope.loading = false;
        $rootScope.$digest();
        if (cb) cb();
      });
      root.setSocketHandlers();
    };

    root.updateTxs = function() {
      var bitcore = require('bitcore');
      var w = $rootScope.wallet;
      if (!w) return;
      
      var myCopayerId = w.getMyCopayerId();
      var pending = 0;
      var inT = w.getTxProposals();
      var txs  = [];

      inT.forEach(function(i){
        var tx  = i.builder.build();
        var outs = [];

        tx.outs.forEach(function(o) {
          var addr = bitcore.Address.fromScriptPubKey(o.getScript(), config.networkName)[0].toString();
          if (!w.addressIsOwn(addr, {excludeMain:true})) {
            outs.push({
              address: addr, 
              value: bitcore.util.valueToBigInt(o.getValue())/bitcore.util.COIN,
            });
          }
        });
        // extra fields
        i.outs = outs;
        i.fee = i.builder.feeSat/bitcore.util.COIN;
        i.missingSignatures = tx.countInputMissingSignatures(0);
        txs.push(i);

        if (myCopayerId != i.creator && !i.finallyRejected && !i.sentTs && !i.rejectedByUs && !i.signedByUs) {
          pending++;
        }

      });
      
      $rootScope.txs = txs;
      if ($rootScope.pendingTxCount < pending) {
        $rootScope.showTxAlert = pending;
      }
      $rootScope.pendingTxCount = pending;
      w.removeListener('txProposalsUpdated',root.updateTxs)
      w.once('txProposalsUpdated',root.updateTxs);
      $rootScope.loading = false;
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
          root.updateBalance();
        });
      });
    };
    return root;
  });
