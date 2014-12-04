'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope, $timeout, $filter, rateService) {
  $scope.init = function() {
    $rootScope.title = 'Home'; 

    $scope.rateService = rateService;
    $scope.isRateAvailable = false;

    var w = $rootScope.wallet; 
    w.on('txProposalEvent', function() { _updateTxs()});
    $timeout(function() {
      _updateTxs();
    }, 1);

    rateService.whenAvailable(function() {
      $scope.isRateAvailable = true;
      $scope.$digest();
    }); 
  }; 

  // This is necesarry, since wallet can change in homeWallet, without running init() again.
  var removeWatch = $rootScope.$watch('wallet.id', function(newWallet, oldWallet) {
    if ($rootScope.wallet && $rootScope.wallet.isComplete() && newWallet !== oldWallet) {
      var w = $rootScope.wallet; 
      $rootScope.pendingTxCount = 0; 
      w.on('txProposalEvent', function() { _updateTxs()});
      _updateTxs();
    }
  });
  
  $scope.$on("$destroy", function(){
    var w = $rootScope.wallet;
    removeWatch();
    w.removeListener('txProposalEvent', function() {_updateTxs()} );
  });

  $scope.setAlternativeAmount = function(w, tx, cb) {
    rateService.whenAvailable(function() {
      _.each(tx.outs, function(out) {
        var valueSat = out.valueSat * w.settings.unitToSatoshi;
        out.alternativeAmount =  $filter('noFractionNumber')(rateService.toFiat(valueSat, $scope.alternativeIsoCode), 2);
        out.alternativeIsoCode = $scope.alternativeIsoCode;
      });
      if (cb) return cb(tx);
    });
  };

  var _updateTxs = _.throttle(function() {
    var w = $rootScope.wallet;
    if (!w) return;

    $scope.alternativeIsoCode = w.settings.alternativeIsoCode;
    $scope.myId = w.getMyCopayerId();
    
    var res = w.getPendingTxProposals();
    _.each(res.txs, function(tx) {
      $scope.setAlternativeAmount(w, tx);
      if (tx.merchant) {
        var url = tx.merchant.request_url;
        var domain = /^(?:https?)?:\/\/([^\/:]+).*$/.exec(url)[1];
        tx.merchant.domain = domain;
      }
      if (tx.outs) {
        _.each(tx.outs, function(out) {
          out.valueSat = out.value;
          out.value = $filter('noFractionNumber')(out.value);
        });
      }        
    });
    $scope.txps = res.txs;
    console.log('[homeWallet.js:45]',$scope.txps); //TODO
  }, 100); 

  

  $scope.sign = function(ntxid) {
    var w = $rootScope.wallet;
    $scope.loading = true;
    $scope.error = $scope.success = null;
    w.signAndSend(ntxid, function(err, id, status) {
      $scope.loading = false;
      $scope.notifyStatus(status);
      _updateTxs();
    });
  };

  $scope.reject = function(ntxid) {
    var w = $rootScope.wallet;
    w.reject(ntxid);
    notification.warning('Transaction rejected', 'You rejected the transaction successfully');
    _updateTxs();
  };

});
