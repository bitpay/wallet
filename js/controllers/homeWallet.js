'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope, $timeout, $filter, $location, rateService, notification, identityService) {
  $scope.init = function() {
    $rootScope.title = 'Home';

    // fix for Safari and mobile devices
    var walletId = $location.hash();
    if (walletId) {
      $location.hash('');
      identityService.setFocusedWallet(walletId);
    }

    $scope.rateService = rateService;
    $scope.isRateAvailable = false;

    var w = $rootScope.wallet;
    w.on('txProposalEvent', _updateTxs);
    _updateTxs();

    rateService.whenAvailable(function() {
      $scope.isRateAvailable = true;
      $scope.$digest();
    });
  };

  // This is necesarry, since wallet can change in homeWallet, without running init() again.
  var removeWatch;
  removeWatch = $rootScope.$watch('wallet.id', function(newWallet, oldWallet) {
    if ($rootScope.wallet && $rootScope.wallet.isComplete() && newWallet !== oldWallet) {

      if (removeWatch)
        removeWatch();

      if (oldWallet) {
        var oldw = $rootScope.iden.getWalletById(oldWallet);
        if (oldw)
          oldw.removeListener('txProposalEvent', _updateTxs);
      }


      var w = $rootScope.wallet;
      $rootScope.pendingTxCount = 0;
      w.on('txProposalEvent', _updateTxs);
      _updateTxs();
    }
  });


  // TODO duplicated on controller send. move to a service.
  $scope.notifyStatus = function(status) {
    if (status == copay.Wallet.TX_BROADCASTED)
      notification.success('Success', 'Transaction broadcasted!');
    else if (status == copay.Wallet.TX_PROPOSAL_SENT)
      notification.info('Success', 'Transaction proposal created');
    else if (status == copay.Wallet.TX_SIGNED)
      notification.success('Success', 'Transaction proposal was signed');
    else if (status == copay.Wallet.TX_SIGNED_AND_BROADCASTED)
      notification.success('Success', 'Transaction signed and broadcasted!');
    else
      notification.error('Error', 'Unknown error occured');
  };


  $scope.$on("$destroy", function() {
    var w = $rootScope.wallet;
    if (w) {
      removeWatch();
      w.removeListener('txProposalEvent', _updateTxs);
    };
  }); 

  $scope.setAlternativeAmount = function(w, tx, cb) {
    rateService.whenAvailable(function() {
      _.each(tx.outs, function(out) {
        var valueSat = out.valueSat * w.settings.unitToSatoshi;
        out.alternativeAmount = $filter('noFractionNumber')(rateService.toFiat(valueSat, $scope.alternativeIsoCode), 2);
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
    $timeout(function(){
      $scope.$digest();
    },1)
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
