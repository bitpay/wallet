'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($log, $timeout, $scope, $filter, $stateParams, walletService, lodash, gettextCatalog, profileService, configService, txFormatService, externalLinkService, popupService) {
  var self = $scope.self;
  var wallet = profileService.getWallet($stateParams.walletId || $scope.walletId);
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;

  $scope.init = function() {
    findTx($scope.txid, function(err, tx) {
      if (err) {
        $log.error(err);
        return;
      }
      console.log('TX FOUND', tx);
      $scope.btx = lodash.cloneDeep(tx);
      $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
      $scope.color = wallet.color;
      $scope.copayerId = wallet.credentials.copayerId;
      $scope.isShared = wallet.credentials.n > 1;
      // $scope.btx.amountStr = txFormatService.formatAmount($scope.btx.amount, true) + ' ' + walletSettings.unitName;
      // $scope.btx.feeStr = txFormatService.formatAmount($scope.btx.fees, true) + ' ' + walletSettings.unitName;
      $scope.btx.feeLevel = walletSettings.feeLevel;

      if ($scope.btx.action != 'invalid') {
        if ($scope.btx.action == 'sent') $scope.title = gettextCatalog.getString('Sent Funds');
        if ($scope.btx.action == 'received') $scope.title = gettextCatalog.getString('Received Funds');
        if ($scope.btx.action == 'moved') $scope.title = gettextCatalog.getString('Moved Funds');
      }

      initActionList();
      getAlternativeAmount();

      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  };

  function findTx(txid, cb) {
    walletService.getTxHistory(wallet, {}, function(err, txHistory) {
      if (err) return cb(err);

      var tx = lodash.find(txHistory, {
        txid: txid
      });

      if (tx) return cb(null, tx);
      else return cb();
    });
  };

  function initActionList() {
    $scope.actionList = [];
    if ($scope.btx.action != 'sent' || !$scope.isShared) return;

    var actionDescriptions = {
      created: gettextCatalog.getString('Proposal Created'),
      accept: gettextCatalog.getString('Accepted'),
      reject: gettextCatalog.getString('Rejected'),
      broadcasted: gettextCatalog.getString('Broadcasted'),
    };

    $scope.actionList.push({
      type: 'created',
      time: $scope.btx.createdOn,
      description: actionDescriptions['created'],
      by: $scope.btx.creatorName
    });

    lodash.each($scope.btx.actions, function(action) {
      $scope.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    $scope.actionList.push({
      type: 'broadcasted',
      time: $scope.btx.time,
      description: actionDescriptions['broadcasted'],
    });
  };

  $scope.showCommentPopup = function() {
    popupService.showPrompt(gettextCatalog.getString('Memo'), ' ', {}, function(res) {
      $log.debug('Saving memo');

      var args = {
        txid: $scope.btx.txid,
        body: res
      };

      wallet.editTxNote(args, function(err) {
        if (err) {
          $log.debug('Could not save tx comment');
          return;
        }
        // This is only to refresh the current screen data
        $scope.btx.note = null;
        if (args.body) {
          $scope.btx.note = {};
          $scope.btx.note.body = res;
          $scope.btx.note.editedByName = wallet.credentials.copayerName;
          $scope.btx.note.editedOn = Math.floor(Date.now() / 1000);
        }
        $scope.btx.searcheableString = null;

        $timeout(function() {
          $scope.$apply();
        }, 200);
      });
    });
  };

  var getAlternativeAmount = function() {
    var satToBtc = 1 / 100000000;

    wallet.getFiatRate({
      code: $scope.alternativeIsoCode,
      ts: $scope.btx.time * 1000
    }, function(err, res) {
      if (err) {
        $log.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        var alternativeAmountBtc = ($scope.btx.amount * satToBtc).toFixed(8);
        $scope.rateDate = res.fetchedOn;
        $scope.rateStr = res.rate + ' ' + $scope.alternativeIsoCode;
        $scope.alternativeAmountStr = $filter('formatFiatAmount')(alternativeAmountBtc * res.rate) + ' ' + $scope.alternativeIsoCode;
        $scope.$apply();
      }
    });
  };

  $scope.openExternalLink = function(url, target) {
    externalLinkService.open(url, target);
  };

  $scope.getShortNetworkName = function() {
    var n = wallet.credentials.network;
    return n.substring(0, 4);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
  };
});
