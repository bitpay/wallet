'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.services')
  .factory('controllerUtils', function($rootScope, $sce, $location, $notification, $timeout, Socket, video) {
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

    root.onErrorDigest = function(scope, msg) {
      root.onError(scope);
      if (msg) $rootScope.$flashMessage = {
        type: 'error',
        message: msg 
      };
      $rootScope.$digest();
    };

    root.installStartupHandlers = function(wallet, $scope) {
      wallet.on('serverError', function(msg) {
          $rootScope.$flashMessage = { 
            message: 'There was an error connecting to the PeerJS server.'
              +(msg||'Check you settings and Internet connection.'),
            type: 'error',
          };
          root.onErrorDigest($scope);
          $location.path('addresses');
      });
      wallet.on('connectionError', function() {
        var message = "Looks like you are already connected to this wallet, please logout from it and try importing it again.";
        $rootScope.$flashMessage = { message: message, type: 'error'};
        root.onErrorDigest($scope);
      });
      wallet.on('serverError', function() {
        $rootScope.$flashMessage = { message: 'The PeerJS server is not responding, please try again', type: 'error'};
        root.onErrorDigest($scope);
      });
      wallet.on('ready', function() {
        $scope.loading = false;
      });
    };


    root.startNetwork = function(w, $scope) {

      root.installStartupHandlers(w, $scope);

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
        if (!config.disableVideo)
          video.setOwnPeer(myPeerID, w, handlePeerVideo);
      });

      w.on('publicKeyRingUpdated', function(dontDigest) {
        root.setSocketHandlers();
        root.updateAddressList();
        if (!dontDigest) {
          $rootScope.$digest();
        }
      });
      w.on('txProposalsUpdated', function(dontDigest) {
        root.updateTxs({onlyPending:true});
        // give sometime to the tx to propagate.
        $timeout(function() {
          root.updateBalance(function(){
            if (!dontDigest) {
              $rootScope.$digest();
            }
          });
        },3000);
      });
      w.on('connectionError', function(msg) {
        root.onErrorDigest(null, msg);
      });
      w.on('connect', function(peerID) {
        if (peerID && !config.disableVideo) {
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
      var w = $rootScope.wallet;
      if (!w) return root.onErrorDigest();

      $rootScope.balanceByAddr = {};
      $rootScope.updatingBalance = true;
      w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
        if (err) {
          console.error('Error: ' + err.message); //TODO
          root._setCommError();
          return null;
        }
        else {
          root._clearCommError();
        }
        
        $rootScope.totalBalance = balance;
        $rootScope.totalBalanceBTC = (balance / 1e6).toFixed(3) ;
        $rootScope.availableBalance = safeBalance;
        $rootScope.availableBalanceBTC = (safeBalance / 1e6).toFixed(3);
        $rootScope.balanceByAddr = balanceByAddr;
        root.updateAddressList();
        $rootScope.updatingBalance = false;
        return cb?cb():null;
      });
    };

    root.updateTxs = function(opts) {
      var w = $rootScope.wallet;
      if (!w) return;
      opts = opts || {};
      
      var myCopayerId = w.getMyCopayerId();
      var pendingForUs = 0;
      var inT = w.getTxProposals().sort(function(t1, t2) { return t2.createdTs - t1.createdTs });
      var txs  = [];

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
          var tx  = i.builder.build();
          var outs = [];
          tx.outs.forEach(function(o) {
            var addr = bitcore.Address.fromScriptPubKey(o.getScript(), config.networkName)[0].toString();
            if (!w.addressIsOwn(addr, {excludeMain:true})) {
              outs.push({
                address: addr, 
                value: bitcore.util.valueToBigInt(o.getValue())/bitcore.util.BIT,
              });
            }
          });
          // extra fields
          i.outs = outs;
          i.fee = i.builder.feeSat/bitcore.util.BIT;
          i.missingSignatures = tx.countInputMissingSignatures(0);
          txs.push(i);
        }
      });
      
      $rootScope.txs = txs; //.some(function(i) {return i.isPending; } );
      if ($rootScope.pendingTxCount < pendingForUs) {
        $rootScope.txAlertCount = pendingForUs;
      }
      $rootScope.pendingTxCount = pendingForUs;
    };    

    root._setCommError = function(e) {
      if ($rootScope.insightError<0) 
        $rootScope.insightError=0;
      $rootScope.insightError++;
    };


    root._clearCommError = function(e) {
      if ($rootScope.insightError>0)
        $rootScope.insightError=-1;
      else
        $rootScope.insightError=0;
    };

    root.setSocketHandlers = function() {
      if (!Socket.sysEventsSet) {
        Socket.sysOn('error', root._setCommError);
        Socket.sysOn('reconnect_error', root._setCommError);
        Socket.sysOn('reconnect_failed', root._setCommError);
        Socket.sysOn('connect', root._clearCommError);
        Socket.sysOn('reconnect', root._clearCommError);
        Socket.sysEventsSet=true;
      }
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
        Socket.emit('subscribe', newAddrs[i]);
      }
      newAddrs.forEach(function(addr) {
        Socket.on(addr, function(txid) {
          $rootScope.receivedFund = [txid, addr];
          root.updateBalance(function(){
            $rootScope.$digest();
          });
        });
      });
    };
    return root;
  });
