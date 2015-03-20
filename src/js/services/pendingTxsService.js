'use strict';

angular.module('copayApp.services')
  .factory('pendingTxsService', function($rootScope, $filter) {
    var root = {};

    root.setAlternativeAmount = function(w, tx, cb) {
      var alternativeIsoCode = w.settings.alternativeIsoCode;
      if (cb) return cb(tx);
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
      if (!w) return;
      //pendingTxCount
      var ret = w.getPendingTxProposalsCount();
      w.pendingTxProposalsCountForUs = ret.pendingForUs;
      w.pendingTxProposals = root.getDecoratedTxProposals(w);
    };

    return root;
  });
