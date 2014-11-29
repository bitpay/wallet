'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.services')
  .factory('balanceService', function($rootScope, $sce, $location, $filter, notification, $timeout, rateService) {
    var root = {};
    var _balanceCache = {};
    root.clearBalanceCache = function(w) {
      delete _balanceCache[w.getId()];
    };

    root._fetchBalance = function(w, cb) {
      cb = cb || function() {};
      var satToUnit = 1 / w.settings.unitToSatoshi;
      var COIN = bitcore.util.COIN;

      console.log('[balanceS.js.257] FETCH BALANCE: ', w.getName()); //TODO
      w.getBalance(function(err, balanceSat, balanceByAddrSat, safeBalanceSat, safeUnspentCount) {
        if (err) return cb(err);

        var r = {};
        r.totalBalance = balanceSat * satToUnit;
        r.totalBalanceBTC = (balanceSat / COIN);
        r.availableBalance = safeBalanceSat * satToUnit;
        r.availableBalanceBTC = (safeBalanceSat / COIN);
        r.safeUnspentCount = safeUnspentCount;

        r.lockedBalance = (balanceSat - safeBalanceSat) * satToUnit;
        r.lockedBalanceBTC = (balanceSat - safeBalanceSat) / COIN;


        if (r.safeUnspentCount) {
          var estimatedFee = copay.Wallet.estimatedFee(r.safeUnspentCount);
          r.topAmount = (((r.availableBalance * w.settings.unitToSatoshi).toFixed(0) - estimatedFee) / w.settings.unitToSatoshi);
        }

        var balanceByAddr = {};
        for (var ii in balanceByAddrSat) {
          balanceByAddr[ii] = balanceByAddrSat[ii] * satToUnit;
        }
        r.balanceByAddr = balanceByAddr;

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

    root.update = function(w, cb, isFocused) {
      console.log(' UPDATE BALANCE!!!!', w ? w.getName() : 'current'); //TODO

      w = w || $rootScope.wallet;
      if (!w || !w.isReady()) return;

      console.log('DO UPDATE BALANCE!!!!', w.getName()); //TODO
      var wid = w.getId();

      if (_balanceCache[wid]) {
        w.balanceInfo = _balanceCache[wid];
      } else {
        $rootScope.updatingBalance = true;
      }

      root._fetchBalance(w, function(err, res) {
        if (err) throw err;
        w.balanceInfo=_balanceCache[wid] = res;
        $rootScope.updatingBalance = false;
        if (isFocused) {
          _.extend($rootScope, w.balanceInfo);
        }
        if (cb) cb();
      });
    };

    return root;
  });
