'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($rootScope, $log, $scope, $filter, $stateParams, $ionicPopup, gettextCatalog, profileService, configService, lodash, txFormatService, platformInfo, externalLinkService) {

  var self = $scope.self;
  var wallet = profileService.getWallet($stateParams.walletId);
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;

  $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
  $scope.color = wallet.color;
  $scope.copayerId = wallet.credentials.copayerId;
  $scope.isShared = wallet.credentials.n > 1;

  $scope.btx.amountStr = txFormatService.formatAmount($scope.btx.amount, true) + ' ' + walletSettings.unitName;
  $scope.btx.feeStr = txFormatService.formatAmount($scope.btx.fees, true) + ' ' + walletSettings.unitName;
  $scope.btx.feeLevel = walletSettings.feeLevel;

  if ($scope.btx.action != 'invalid') {
    if ($scope.btx.action == 'sent') $scope.title = gettextCatalog.getString('Sent Funds');
    if ($scope.btx.action == 'received') $scope.title = gettextCatalog.getString('Received Funds');
    if ($scope.btx.action == 'moved') $scope.title = gettextCatalog.getString('Moved Funds');
  }

  $scope.showCommentPopup = function() {
    $scope.data = {
      comment: $scope.btx.note ? $scope.btx.note.body : '',
    };

    var commentPopup = $ionicPopup.show({
      templateUrl: "views/includes/note.html",
      scope: $scope,
    });

    $scope.commentPopupClose = function() {
      commentPopup.close();
    };

    $scope.commentPopupSave = function() {
      $log.debug('Saving note');
      var args = {
        txid: $scope.btx.txid,
      };

      if ($scope.data.comment) {
        args.body = $scope.data.comment;
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
          $scope.btx.note.body = $scope.data.comment;
          $scope.btx.note.editedByName = wallet.credentials.copayerName;
          $scope.btx.note.editedOn = Math.floor(Date.now() / 1000);
        }
        $scope.btx.searcheableString = null;
        commentPopup.close();
      });
    };
  };

  $scope.getAlternativeAmount = function() {
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
