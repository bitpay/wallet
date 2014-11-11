'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.services')
  .factory('controllerUtils', function($rootScope, $sce, $location, $filter, notification, $timeout, uriHandler, rateService) {
    var root = {};


    root.redirIfNotComplete = function() {
      var w = $rootScope.wallet;
      if (w) {
        if (!w.isReady()) {
          $location.path('/copayers');
        }
      } else {
        $location.path('/');
      }
    };


    root.redirIfLogged = function() {
      var w = $rootScope.wallet;
      if (w) {
        if (!w.isReady()) {
          $location.path('/copayers');
        } else {
          $location.path('homeWallet');
        }
      }
    };

    root.logout = function() {

      if ($rootScope.iden) {
        $rootScope.iden.store(null, function() {
          $rootScope.iden.close();

          delete $rootScope['wallet'];
          delete $rootScope['iden'];

          // Go home reloading the application
          var hashIndex = window.location.href.indexOf('#!/');
          window.location = window.location.href.substr(0, hashIndex);
        });
      }
    };

    root.onError = function(scope) {
      if (scope) scope.loading = false;
    }

    root.onErrorDigest = function(scope, msg) {
      root.onError(scope);
      if (msg) {
        notification.error('Error', msg);
      }
    };


    root.isFocusedWallet = function(wid) {
      return $rootScope.wallet && wid === $rootScope.wallet.getId();
    };


    root.updateTxsAndBalance = function(w) {
      root.updateTxs();
      root.updateBalance(w, function() {
        $rootScope.$digest();
      });
    };

    root.installWalletHandlers = function($scope, w) {

      var wid = w.getId();
      w.on('connectionError', function() {
        if (root.isFocusedWallet(wid)) {
          var message = "Could not connect to the Insight server. Check your settings and network configuration";
          notification.error('Networking Error', message);
          root.onErrorDigest($scope);
        }
      });

      w.on('corrupt', function(peerId) {
        if (root.isFocusedWallet(wid)) {
          notification.error('Error', $filter('translate')('Received corrupt message from ') + peerId);
        }
      });
      w.on('ready', function(myPeerID) {
        $scope.loading = false;
        if ($rootScope.initialConnection) {
          $rootScope.initialConnection = false;
          if ($rootScope.pendingPayment) {
            $location.path('paymentIntent');
          } else {
            root.redirIfLogged();
          }
        }
      });

      w.on('tx', function(address, isChange) {
        if (!isChange) {
          notification.funds('Funds received on ' + w.getName(), address);
        }
        root.updateBalance(w, function() {
          $rootScope.$digest();
        });
      });

      w.on('balanceUpdated', function() {
        root.updateBalance(w, function() {
          $rootScope.$digest();
        });
      });

      w.on('insightReconnected', function() {
        $rootScope.reconnecting = false;
        root.updateAddressList(w.getId());
        root.updateBalance(w, function() {
          $rootScope.$digest();
        });
      });

      w.on('insightError', function() {
        if (root.isFocusedWallet(wid)) {
          $rootScope.reconnecting = true;
          $rootScope.$digest();
        }
      });
      w.on('newAddresses', function() {
        root.updateTxsAndBalance(w);
      });

      w.on('txProposalsUpdated', function() {
        root.updateTxsAndBalance(w);
      });

      w.on('txProposalEvent', function(e) {

        root.updateTxsAndBalance(w);
        // TODO: add wallet name notification
        var user = w.publicKeyRing.nicknameForCopayer(e.cId);
        var name = w.getName();
        switch (e.type) {
          case 'new':
            notification.info('['+ name +'] New Transaction', 
              $filter('translate')('You received a transaction proposal from') + ' ' + user);
            break;
          case 'signed':
            notification.info('['+ name +'] Transaction Signed', 
              $filter('translate')('A transaction was signed by') + ' ' + user);
            break;
          case 'rejected':
            notification.info('['+ name +'] Transaction Rejected', 
              $filter('translate')('A transaction was rejected by') + ' ' + user);
            break;
          case 'corrupt':
            notification.error('['+ name +'] Transaction Error', 
                $filter('translate')('Received corrupt transaction from') + ' ' + user);
            break;
        }
        $rootScope.$digest();
      });
      w.on('addressBookUpdated', function(dontDigest) {
        if (root.isFocusedWallet(wid)) {
          if (!dontDigest) {
            $rootScope.$digest();
          }
        }
      });
      w.on('connect', function(peerID) {
        $rootScope.$digest();
      });
      w.on('close', root.onErrorDigest);
      w.on('locked', root.onErrorDigest.bind(this));

    };

    root.setupGlobalVariables = function(iden) {
      notification.enableHtml5Mode(); // for chrome: if support, enable it
      uriHandler.register();
      $rootScope.unitName = config.unitName;
      $rootScope.txAlertCount = 0;
      $rootScope.initialConnection = true;
      $rootScope.reconnecting = false;
      $rootScope.isCollapsed = true;

      $rootScope.iden = iden;

      // TODO
      // $rootScope.$watch('txAlertCount', function(txAlertCount) {
      //   if (txAlertCount && txAlertCount > 0) {
      //
      //     notification.info('New Transaction', ($rootScope.txAlertCount == 1) ? 'You have a pending transaction proposal' : $filter('translate')('You have') + ' ' + $rootScope.txAlertCount + ' ' + $filter('translate')('pending transaction proposals'), txAlertCount);
      //   }
      // });
    };


    root.rebindWallets = function($scope, iden) {
      _.each(iden.listWallets(), function(wallet) {
        preconditions.checkState(wallet);
        root.installWalletHandlers($scope, wallet);
      });
    };

    root.setPaymentWallet = function(w) {
      root.setFocusedWallet(w);
      $location.path('/send');
    };

    root.setFocusedWallet = function(w) {
      if (!_.isObject(w))
        w = $rootScope.iden.getWalletById(w);

      preconditions.checkState(w && _.isObject(w));

      $rootScope.wallet = w;
      w.updateFocusedTimestamp(Date.now());
      root.redirIfLogged();
      root.updateTxs();
      root.updateBalance(w, function() {
        $rootScope.$digest();
      })
    };

    root.bindProfile = function($scope, iden, w) {
      root.setupGlobalVariables(iden);
      root.rebindWallets($scope, iden);
      if (w) {
        root.setFocusedWallet(w);
      } else {
        $location.path('/createWallet');
      }
      $timeout(function() {
        $rootScope.$digest()
      }, 1);
    };

    // On the focused wallet
    root.updateAddressList = function(wid) {

      if (!wid || root.isFocusedWallet(wid)) {
        var w = $rootScope.wallet;

        if (w && w.isReady()) {
          $rootScope.addrInfos = w.getAddressesInfo();
        }
      }
    };

    var _balanceCache = {};
    root.clearBalanceCache = function(w) {
      delete _balanceCache[w.getId()];
    };


    root._fetchBalance = function(w, cb) {
      cb = cb || function() {};
      var satToUnit = 1 / w.settings.unitToSatoshi;
      var COIN = bitcore.util.COIN;

      w.getBalance(function(err, balanceSat, balanceByAddrSat, safeBalanceSat, safeUnspentCount) {
        if (err) return cb(err);

        var r = {};
        r.totalBalance = balanceSat * satToUnit;
        r.totalBalanceBTC = (balanceSat / COIN);
        r.availableBalance = safeBalanceSat * satToUnit;
        r.safeUnspentCount = safeUnspentCount;
        r.availableBalanceBTC = (safeBalanceSat / COIN);

        r.lockedBalance = (balanceSat - safeBalanceSat) * satToUnit;
        r.lockedBalanceBTC = (balanceSat - safeBalanceSat) / COIN;

        var balanceByAddr = {};
        for (var ii in balanceByAddrSat) {
          balanceByAddr[ii] = balanceByAddrSat[ii] * satToUnit;
        }
        r.balanceByAddr = balanceByAddr;
        root.updateAddressList();

        if (rateService.isAvailable()) {
          r.totalBalanceAlternative = rateService.toFiat(balanceSat, w.settings.alternativeIsoCode);
          r.alternativeIsoCode = w.settings.alternativeIsoCode;
          r.lockedBalanceAlternative = rateService.toFiat(balanceSat - safeBalanceSat, w.settings.alternativeIsoCode);
          r.alternativeConversionRate = rateService.toFiat(100000000, w.settings.alternativeIsoCode);
          r.alternativeBalanceAvailable = true;
        };

        r.updatingBalance = false;

        return cb(null, r)
      });
    };

    root._updateScope = function(w, data, scope, cb) {
      _.each(data, function(v, k) {
        scope[k] = data[k];
      })
      if (cb) return cb();
    };

    root.updateBalance = function(w, cb, refreshAll) {
      w = w || $rootScope.wallet;
      if (!w) return root.onErrorDigest();
      if (!w.isReady()) return;

      w.balanceInfo = {};
      var scope = root.isFocusedWallet(w.id) && !refreshAll ? $rootScope : w.balanceInfo;

      root.updateAddressList();

      var wid = w.getId();

      if (_balanceCache[wid]) {
        root._updateScope(w, _balanceCache[wid], scope, function() {
          if (root.isFocusedWallet(w.id) && !refreshAll) {
            setTimeout(function() {
              $rootScope.$digest();
            }, 1);
          }
        });
      } else {
        scope.updatingBalance = true;
      }

      root._fetchBalance(w, function(err, res) {
        if (err) throw err;
        _balanceCache[wid] = res;
        root._updateScope(w, _balanceCache[wid], scope, function() {
          scope.updatingBalance = false;
          if (cb) cb();
        });
      });
    };

    root.computeAlternativeAmount = function(w, tx, cb) {
      rateService.whenAvailable(function() {
        _.each(tx.outs, function(out) {
          var valueSat = out.value * w.settings.unitToSatoshi;
          out.alternativeAmount = rateService.toFiat(valueSat, w.settings.alternativeIsoCode);
          out.alternativeIsoCode = w.settings.alternativeIsoCode;
        });
        if (cb) return cb(tx);
      });
    };

    root.updateTxs = function() {
      var w = $rootScope.wallet;
      if (!w) return root.onErrorDigest(); 
      var res = w.getPendingTxProposals();
      _.each(res.txs, function(tx) {
        root.computeAlternativeAmount(w, tx);
      });
      $rootScope.txps = res.txs;
      if ($rootScope.pendingTxCount < res.pendingForUs) {
        $rootScope.txAlertCount = res.pendingForUs;
      }
      $rootScope.pendingTxCount = res.pendingForUs;
    };

    root.deleteWallet = function($scope, w, cb) {
      if (!w) return root.onErrorDigest(); 
      var name = w.getName();
      $rootScope.iden.deleteWallet(w.id, function() {
        notification.info(name + ' deleted', $filter('translate')('This wallet was deleted'));
        return cb();
      });
    };

    return root;
  });
