'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.services')
  .factory('controllerUtils', function($rootScope, $sce, $location, notification, $timeout, uriHandler, rateService) {
    var root = {};

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
    };

    root.installWalletHandlers = function(w, $scope) {
      w.on('connectionError', function() {
        var message = "Could not connect to the Insight server. Check your settings and network configuration";
        notification.error('Networking Error', message);
        root.onErrorDigest($scope);
      });
      w.on('ready', function() {
        $scope.loading = false;
      });


      w.on('corrupt', function(peerId) {
        notification.error('Error', 'Received corrupt message from ' + peerId);
      });
      w.on('ready', function(myPeerID) {
        $rootScope.wallet = w;
        if ($rootScope.pendingPayment) {
          $location.path('send');
        } else {
          $location.path('receive');
        }
      });

      w.on('publicKeyRingUpdated', function(dontDigest) {
        root.updateAddressList();
        if (!dontDigest) {
          $rootScope.$digest();
        }
      });

      w.on('tx', function(address) {
        notification.funds('Funds received!', address);
        root.updateBalance(function() {
          $rootScope.$digest();
        });
      });

      w.on('balanceUpdated', function() {
        root.updateBalance(function() {
          $rootScope.$digest();
        });
      });

      w.on('insightReconnected', function() {
        $rootScope.reconnecting = false;
        root.updateAddressList();
        root.updateBalance(function() {
          $rootScope.$digest();
        });
      });

      w.on('insightError', function() {
        $rootScope.reconnecting = true;
        $rootScope.$digest();
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
      w.on('connect', function(peerID) {
        $rootScope.$digest();
      });
      w.on('close', root.onErrorDigest);
      w.on('locked', root.onErrorDigest.bind(this));
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
    };

    root.startNetwork = function(w, $scope) {
      root.setupRootVariables();
      root.installWalletHandlers(w, $scope);
      root.updateAddressList();
      notification.enableHtml5Mode(); // for chrome: if support, enable it
      w.netStart();
    };

    // TODO movie this to wallet
    root.updateAddressList = function() {
      var w = $rootScope.wallet;
      if (w && w.isReady())
        $rootScope.addrInfos = w.getAddressesInfo();
    };

    root.updateBalance = function(cb) {
      var w = $rootScope.wallet;
      if (!w) return root.onErrorDigest();
      if (!w.isReady()) return;

      w.removeTxWithSpentInputs();

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

        rateService.whenAvailable(function() {
          $rootScope.totalBalanceAlternative = rateService.toFiat(balanceSat, config.alternativeIsoCode);
          $rootScope.alternativeIsoCode = config.alternativeIsoCode;
          $rootScope.lockedBalanceAlternative = rateService.toFiat(balanceSat - safeBalanceSat, config.alternativeIsoCode);


          return cb ? cb() : null;
        });
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

    return root;
  });
