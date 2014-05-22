'use strict';

angular.module('copay.controllerUtils')
  .factory('controllerUtils', function($rootScope, $sce, $location, $notification, Socket, video) {
    var root = {};
    var bitcore = require('bitcore');

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

      $notification.enableHtml5Mode(); // for chrome: if support, enable it

      w.on('badMessage', function(peerId) {
        $rootScope.$flashMessage = {
          type: 'error',
          message: 'Received wrong message from peer id:' + peerId
        };
      });
      w.on('ready', function(myPeerID) {
        $rootScope.wallet = w;
        $location.path('addresses');
        video.setOwnPeer(myPeerID, w, handlePeerVideo);
        console.log('# Done ready handler'); 
      });

      w.on('publicKeyRingUpdated', function(dontDigest) {
        console.log('[start publicKeyRing handler]'); //TODO
        root.setSocketHandlers();
        root.updateAddressList();
        if (!dontDigest) {
          console.log('[pkr digest]');
          $rootScope.$digest();
          console.log('[done digest]');
        }
      });
      w.on('txProposalsUpdated', function(dontDigest) {
        root.updateTxs({onlyPending:true});
        root.updateBalance(function(){
          if (!dontDigest) {
            console.log('[txp digest]');
            $rootScope.$digest();
            console.log('[done digest]');
          }
        });
      });
      w.on('openError', root.onErrorDigest);
      w.on('connect', function(peerID) {
        if (peerID) {
          video.callPeer(peerID, handlePeerVideo);
        }
        console.log('[digest]');
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
      var w = $rootScope.wallet;

      $rootScope.balanceByAddr = {};
      $rootScope.updatingBalance = true;
      w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
        if (err) {
          $rootScope.$flashMessage = {
            type: 'error',
            message: 'Error: ' + err.message
          };

          $rootScope.$digest();
          console.error('Error: ' + err.message); //TODO

          return null;
        }

        $rootScope.totalBalance = balance;
        $rootScope.balanceByAddr = balanceByAddr;
        $rootScope.availableBalance = safeBalance;
        root.updateAddressList();
        $rootScope.updatingBalance = false;
        console.log('Done updating balance.'); //TODO
        return cb?cb():null;
      });
    };

    root.updateTxs = function(opts) {
      var w = $rootScope.wallet;
      if (!w) return;
      opts = opts || {};
      
      console.log('## updating tx proposals', opts); //TODO
      var myCopayerId = w.getMyCopayerId();
      var pendingForUs = 0;
      var inT = w.getTxProposals().sort(function(t1, t2) { return t1.createdTs < t2.createdTs });
      var txs  = [];

      console.log('[START LOOP]'); //TODO
      inT.forEach(function(i, index){
        if (opts.skip && (index < opts.skip[0] || index >= opts.skip[1])) {
          return txs.push(null);
        }

        if (myCopayerId != i.creator && !i.finallyRejected && !i.sentTs && !i.rejectedByUs && !i.signedByUs) {
          pendingForUs++;
        }
        if (!i.finallyRejected && !i.sentTs) {
          i.isPending=1;
        }
        if (!opts.onlyPending || i.isPending) {
          console.log('tx:',i); //TODO
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
        }
      });
      
      $rootScope.txs = txs; //.some(function(i) {return i.isPending; } );
      if ($rootScope.pendingTxCount < pendingForUs) {
        $rootScope.txAlertCount = pendingForUs;
      }
      $rootScope.pendingTxCount = pendingForUs;
      console.log('## Done updating tx proposals'); //TODO
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
          $rootScope.receivedFund = [txid, addr];
          root.updateBalance(function(){
            $rootScope.$digest();
          });
        });
      });
    };
    return root;
  });
