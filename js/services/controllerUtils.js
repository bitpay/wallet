'use strict';

angular.module('copay.controllerUtils')
  .factory('controllerUtils', function($rootScope, $sce, $location, Socket, video) {
    var root = {};

    root.getVideoMutedStatus = function(copayer) {
      var vi = $rootScope.videoInfo[copayer]
      if (!vi) {
        return;
      }
      return vi.muted;
    };

    root.logout = function() {
      $rootScope.wallet = null;
      delete $rootScope['wallet'];
      video.close();
      // Clear rootScope
      for (var i in $rootScope) {
        if (i.charAt(0) != '$') {
          delete $rootScope[i];
        }
      }

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
        console.log('## RECEIVED READY.');
        video.setOwnPeer(myPeerID, w, handlePeerVideo);
        $rootScope.wallet = w;
        $location.path('addresses');
        $rootScope.$digest();
      });
      w.on('publicKeyRingUpdated', function() {
        root.setSocketHandlers();
        root.updateAddressList();
        $rootScope.$digest();
      });
      w.on('txProposalsUpdated', function() {
        root.updateTxs();
        root.updateBalance(function(){
          $rootScope.$digest();
        });
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

    root.updateAddressList = function() {
      var w = $rootScope.wallet;
      $rootScope.addrInfos = w.getAddressesInfo();
    };

    root.updateBalance = function(cb) {
      console.log('Updating balance...');
      root.updateAddressList();
      var w = $rootScope.wallet;
      if ($rootScope.addrInfos.length === 0) return;

      $rootScope.balanceByAddr = {};
      $rootScope.updatingBalance = true;
      w.getBalance(function(balance, balanceByAddr, safeBalance) {
        $rootScope.totalBalance = balance;
        $rootScope.balanceByAddr = balanceByAddr;
        $rootScope.selectedAddr = $rootScope.addrInfos[0].address.toString();
        $rootScope.availableBalance = safeBalance;
        $rootScope.updatingBalance = false;
        console.log('Done updating balance.'); //TODO
        if (cb) cb();
      });
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
        $rootScope.txAlertCount = pending;
      }
      $rootScope.pendingTxCount = pending;
      w.removeListener('txProposalsUpdated',root.updateTxs)
      w.once('txProposalsUpdated',root.updateTxs);
    };    

    root.setSocketHandlers = function() {
      if (!$rootScope.wallet) return;

      var currentAddrs=  Socket.getListeners();
      var addrs = $rootScope.wallet.getAddressesStr();

      var newAddrs=[];
      for(var i in addrs){
        var a=addrs[i];
        if (!currentAddrs[a])
          newAddrs.push(a);
      }
      for (var i = 0; i < newAddrs.length; i++) {
        console.log('### SUBSCRIBE TO', newAddrs[i]);
        Socket.emit('subscribe', newAddrs[i]);
      }
      newAddrs.forEach(function(addr) {
        Socket.on(addr, function(txid) {
          console.log('Received!', txid);
          root.updateBalance(function(){
            $rootScope.$digest();
          });
        });
      });
    };
    return root;
  });
