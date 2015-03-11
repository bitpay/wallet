'use strict';

angular.module('copayApp.services')
  .factory('balanceService', function($rootScope, $filter, $timeout, bwcService) {
    var root = {};
    var _balanceCache = {};
    root.clearBalanceCache = function(w) {
      w.clearUnspentCache();
      delete _balanceCache[w.getId()];
    };

    root._fetchBalance = function(w, cb) {
      cb = cb || function() {};
      var satToUnit = 1 / w.settings.unitToSatoshi;
      var COIN = bwcService.Bitcore.util.COIN;
      w.getBalance(function(err, balanceSat, balanceByAddrSat, safeBalanceSat, safeUnspentCount) {
        if (err) return cb(err);

        var r = {};
        r.totalBalance = $filter('noFractionNumber')(balanceSat * satToUnit);
        r.totalBalanceBTC = (balanceSat / COIN);
        var availableBalanceNr = safeBalanceSat * satToUnit;
        r.availableBalance = $filter('noFractionNumber')(safeBalanceSat * satToUnit);
        r.availableBalanceBTC = (safeBalanceSat / COIN);
        r.safeUnspentCount = safeUnspentCount;

        var lockedBalance = (balanceSat - safeBalanceSat) * satToUnit;
        r.lockedBalance = lockedBalance ? $filter('noFractionNumber')(lockedBalance) : null;
        r.lockedBalanceBTC = (balanceSat - safeBalanceSat) / COIN;


        if (r.safeUnspentCount) {
          var estimatedFee = copay.Wallet.estimatedFee(r.safeUnspentCount);
          r.topAmount = (((availableBalanceNr * w.settings.unitToSatoshi).toFixed(0) - estimatedFee) / w.settings.unitToSatoshi);
        }

        var balanceByAddr = {};
        for (var ii in balanceByAddrSat) {
          balanceByAddr[ii] = balanceByAddrSat[ii] * satToUnit;
        }
        r.balanceByAddr = balanceByAddr;

        r.totalBalanceAlternative = $filter('noFractionNumber')(totalBalanceAlternative, 2);
        r.lockedBalanceAlternative = $filter('noFractionNumber')(lockedBalanceAlternative, 2);
        r.alternativeConversionRate = $filter('noFractionNumber')(alternativeConversionRate, 2);

        r.alternativeBalanceAvailable = true;
        r.alternativeIsoCode = w.settings.alternativeIsoCode;

        r.updatingBalance = false;

        return cb(null, r)
      });
    };

    root.update = function(w, cb, isFocused) {
      w = w || $rootScope.wallet;
      if (!w || !w.isComplete()) return;

      copay.logger.debug('Updating balance of:', w.getName(), isFocused);
      var wid = w.getId();


      // cache available? Set the cached values until we updated them
      if (_balanceCache[wid]) {
        w.balanceInfo = _balanceCache[wid];
      } else {
        if (isFocused)
          $rootScope.updatingBalance = true;
      }

      w.balanceInfo = w.balanceInfo || {};
      w.balanceInfo.updating = true;

      root._fetchBalance(w, function(err, res) {
        if (err) throw err;
        w.balanceInfo = _balanceCache[wid] = res;
        w.balanceInfo.updating = false;

        if (isFocused) {
          $rootScope.updatingBalance = false;
        }
        // we alwalys calltimeout because if balance is cached, we are still on the same
        // execution path
        if (cb) $timeout(function() {
          return cb();
        }, 1);
      });
    };

    return root;
  });
