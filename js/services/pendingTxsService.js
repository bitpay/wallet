
'use strict';

angular.module('copayApp.services')
  .factory('pendingTxsService', function($rootScope, $sce, $location, $filter, notification, $timeout, rateService) {
    var root = {};
    root.update = function(w) {
      var w = $rootScope.wallet;
      if (!w) return;

      var ret = w.getPendingTxProposalsCount();
      $rootScope.pendingTxCount = ret.pendingForUs;
    };
    return root;
  });
