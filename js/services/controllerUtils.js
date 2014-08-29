'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.services')
  .factory('controllerUtils', function($rootScope, $sce, $location, notification, $timeout, video, uriHandler) {
    var root = {};
    root.getVideoMutedStatus = function(copayer) {
      if (!$rootScope.videoInfo) return;

      var vi = $rootScope.videoInfo[copayer]
      if (!vi) {
        return;
      }
      return vi.muted;
    };

    root.redirIfLogged = function() {
      if ($rootScope.wallet) {
        $location.path('receive');
      }
    };

    root.logout = function() {
      if ($rootScope.wallet)
        $rootScope.wallet.close();

      $rootScope.wallet = null;
      delete $rootScope['wallet'];

      video.close();
      // Clear rootScope
      for (var i in $rootScope) {
        if (i.charAt(0) != '$') {
          delete $rootScope[i];
        }
      }

      $location.path('/');
    };

    root.onError = function(scope) {
      if (scope) scope.loading = false;
      root.logout();
    }

    root.onErrorDigest = function(scope, msg) {
      root.onError(scope);
      if (msg) {
        notification.error('Error', msg);
      }
      $rootScope.$digest();
    };

    root.installStartupHandlers = function(wallet, $scope) {
      wallet.on('connectionError', function() {
        var message = "Looks like you are already connected to this wallet, please logout and try importing it again.";
        notification.error('PeerJS Error', message);
        root.onErrorDigest($scope);
      });
      wallet.on('ready', function() {
        $scope.loading = false;
      });
    };

    root.setupRootVariables = function() {
      uriHandler.register();
      $rootScope.unitName = config.unitName;
      $rootScope.txAlertCount = 0;
      $rootScope.reconnecting = false;
      $rootScope.isCollapsed = true;
      $rootScope.$watch('txAlertCount', function(txAlertCount) {
        if (txAlertCount && txAlertCount > 0) {

          notification.info('New Transaction', ($rootScope.txAlertCount == 1) ? 'You have a pending transaction proposal' : 'You have ' + $rootScope.txAlertCount + ' pending transaction proposals', txAlertCount);
        }
      });


      $rootScope.$watch('receivedFund', function(receivedFund) {
        if (receivedFund) {
          var currentAddr;
          for (var i = 0; i < $rootScope.addrInfos.length; i++) {
            var addrinfo = $rootScope.addrInfos[i];
            if (addrinfo.address.toString() == receivedFund[1] && !addrinfo.isChange) {
              currentAddr = addrinfo.address.toString();
              break;
            }
          }
          if (currentAddr) {
            //var beep = new Audio('sound/transaction.mp3');
            notification.funds('Received fund', currentAddr, receivedFund);
            //beep.play();
          }
        }
      });

    };


    root.startNetwork = function(w, $scope) {
      root.setupRootVariables();
      root.installStartupHandlers(w, $scope);
      root.updateGlobalAddresses();

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

      notification.enableHtml5Mode(); // for chrome: if support, enable it

      w.on('corrupt', function(peerId) {
        notification.error('Error', 'Received corrupt message from ' + peerId);
      });
      w.on('ready', function(myPeerID) {
        $rootScope.wallet = w;
        root.setConnectionListeners($rootScope.wallet);

        if ($rootScope.pendingPayment) {
          $location.path('send');
        } else {
          $location.path('receive');
        }
        if (!config.disableVideo)
          video.setOwnPeer(myPeerID, w, handlePeerVideo);
      });

      w.on('publicKeyRingUpdated', function(dontDigest) {
        root.updateGlobalAddresses();
        if (!dontDigest) {
          $rootScope.$digest();
        }
      });
      w.on('txProposalsUpdated', function(dontDigest) {
        root.updateTxs();
        // give sometime to the tx to propagate.
        $timeout(function() {
          root.updateBalance(function() {
            if (!dontDigest) {
              $rootScope.$digest();
            }
          });
        }, 3000);
      });
      w.on('txProposalEvent', function(e) {
        var user = w.publicKeyRing.nicknameForCopayer(e.cId);
        switch (e.type) {
          case 'signed':
            notification.info('Transaction Update', 'A transaction was signed by ' + user);
            break;
          case 'rejected':
            notification.info('Transaction Update', 'A transaction was rejected by ' + user);
            break;
          case 'corrupt':
            notification.error('Transaction Error', 'Received corrupt transaction from ' + user);
            break;
        }
      });
      w.on('addressBookUpdated', function(dontDigest) {
        if (!dontDigest) {
          $rootScope.$digest();
        }
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
      w.on('close', root.onErrorDigest);
      w.on('locked', root.onErrorDigest.bind(this));
      w.netStart();
    };

    root.updateAddressList = function() {
      var w = $rootScope.wallet;
      if (w && w.isReady())
        $rootScope.addrInfos = w.getAddressesInfo();
    };

    root.updateBalance = function(cb) {
      var w = $rootScope.wallet;
      if (!w) return root.onErrorDigest();
      if (!w.isReady()) return;

      $rootScope.balanceByAddr = {};
      $rootScope.updatingBalance = true;

      w.getBalance(function(err, balanceSat, balanceByAddrSat, safeBalanceSat) {
        if (err) throw err;

        var satToUnit = 1 / config.unitToSatoshi;
        var COIN = bitcore.util.COIN;

        $rootScope.totalBalance = balanceSat * satToUnit;
        $rootScope.totalBalanceBTC = (balanceSat / COIN);
        $rootScope.availableBalance = safeBalanceSat * satToUnit;
        $rootScope.availableBalanceBTC = (safeBalanceSat / COIN);

        $rootScope.lockedBalance = (balanceSat - safeBalanceSat) * satToUnit;
        $rootScope.lockedBalanceBTC = (balanceSat - safeBalanceSat) / COIN;

        var balanceByAddr = {};
        for (var ii in balanceByAddrSat) {
          balanceByAddr[ii] = balanceByAddrSat[ii] * satToUnit;
        }
        $rootScope.balanceByAddr = balanceByAddr;
        root.updateAddressList();
        $rootScope.updatingBalance = false;
        return cb ? cb() : null;
      });
    };

    root.updateTxs = function(opts) {
      var w = $rootScope.wallet;
      if (!w) return;
      opts = opts || $rootScope.txsOpts || {};

      var satToUnit = 1 / config.unitToSatoshi;
      var myCopayerId = w.getMyCopayerId();
      var pendingForUs = 0;
      var inT = w.getTxProposals().sort(function(t1, t2) {
        return t2.createdTs - t1.createdTs
      });
      var txs = [];

      inT.forEach(function(i, index) {
        if (opts.skip && (index < opts.skip[0] || index >= opts.skip[1])) {
          return txs.push(null);
        }

        if (myCopayerId != i.creator && !i.finallyRejected && !i.sentTs && !i.rejectedByUs && !i.signedByUs) {
          pendingForUs++;
        }
        if (!i.finallyRejected && !i.sentTs) {
          i.isPending = 1;
        }

        if (!!opts.pending == !!i.isPending) {
          var tx = i.builder.build();
          var outs = [];
          tx.outs.forEach(function(o) {
            var addr = bitcore.Address.fromScriptPubKey(o.getScript(), config.networkName)[0].toString();
            if (!w.addressIsOwn(addr, {
              excludeMain: true
            })) {
              outs.push({
                address: addr,
                value: bitcore.util.valueToBigInt(o.getValue()) * satToUnit,
              });
            }
          });
          // extra fields
          i.outs = outs;
          i.fee = i.builder.feeSat * satToUnit;
          i.missingSignatures = tx.countInputMissingSignatures(0);
          i.actionList = getActionList(i.peerActions);
          txs.push(i);
        }
      });

      $rootScope.txs = txs;
      $rootScope.txsOpts = opts;
      if ($rootScope.pendingTxCount < pendingForUs) {
        $rootScope.txAlertCount = pendingForUs;
      }
      $rootScope.pendingTxCount = pendingForUs;
    };

    function getActionList(actions) {
      var peers = Object.keys(actions).map(function(i) {
        return {
          cId: i,
          actions: actions[i]
        }
      });

      return peers.sort(function(a, b) {
        return !!b.actions.create - !!a.actions.create;
      });
    }

    root.setConnectionListeners = function(wallet) {
      wallet.blockchain.on('connect', function(attempts) {
        if (attempts == 0) return;
        notification.success('Networking restored', 'Connection to Insight re-established');
        $rootScope.reconnecting = false;
        root.updateBalance(function() {
          $rootScope.$digest();
        });
      });

      wallet.blockchain.on('disconnect', function() {
        notification.error('Networking problem', 'Connection to Insight lost, trying to reconnect...');
        $rootScope.reconnecting = true;
        $rootScope.$digest();
      });

      wallet.blockchain.on('tx', function(tx) {
        notification.funds('Funds received!', tx.address);
        root.updateBalance(function() {
          $rootScope.$digest();
        });
      });

      if (!$rootScope.wallet.spendUnconfirmed) {
        wallet.blockchain.on('block', function(block) {
          root.updateBalance(function() {
            $rootScope.$digest();
          });
        });
      }
    }

    root.updateGlobalAddresses = function() {
      if (!$rootScope.wallet) return;

      root.updateAddressList();
      var currentAddrs = $rootScope.wallet.blockchain.getSubscriptions();
      var allAddrs = $rootScope.addrInfos;

      var newAddrs = [];
      for (var i in allAddrs) {
        var a = allAddrs[i];
        if (!currentAddrs[a.addressStr] && !a.isChange)
          newAddrs.push(a.addressStr);
      }

      $rootScope.wallet.blockchain.subscribe(newAddrs);
    };
    return root;
  });
