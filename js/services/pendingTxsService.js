'use strict';

angular.module('copayApp.services')
  .factory('pendingTxsService', function($rootScope, $filter, rateService) {
    var root = {};

    root.setAlternativeAmount = function(w, tx, cb) {
      var alternativeIsoCode = w.settings.alternativeIsoCode;
      rateService.whenAvailable(function() {
        _.each(tx.outs, function(out) {
          var valueSat = out.valueSat * w.settings.unitToSatoshi;
          out.alternativeAmount = $filter('noFractionNumber')(
            rateService.toFiat(valueSat, alternativeIsoCode), 2);
          out.alternativeIsoCode = alternativeIsoCode;
        });
        if (cb) return cb(tx);
      });
    };

    root.getDecoratedTxProposals = function(w) {
      var txps = w.getPendingTxProposals();

      _.each(txps, function(tx) {
        root.setAlternativeAmount(w, tx);
        if (tx.outs) {
          _.each(tx.outs, function(out) {
            out.valueSat = out.value;
            out.value = $filter('noFractionNumber')(out.value);
          });
        }
      });
      return txps;
    };

    /**
     * @desc adds 2 fields to wallet: pendingTxProposalsCountForUs, pendingTxProposals.
     *
     * @param w wallet
     */
    root.update = function(w) {
      var w = $rootScope.wallet;
      if (!w) return;

      //pendingTxCount
      var ret = w.getPendingTxProposalsCount();
      w.pendingTxProposalsCountForUs = ret.pendingForUs;
      w.pendingTxProposals = root.getDecoratedTxProposals(w);
    };

    return root;
  });
