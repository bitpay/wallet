'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($rootScope, $log, $scope, $filter, $ionicPopup, gettextCatalog, profileService, configService, lodash) {

  var self = $scope.self;
  var fc = profileService.focusedClient;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;

  $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
  $scope.color = fc.backgroundColor;
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;

  $scope.btx.amountStr = profileService.formatAmount($scope.btx.amount, true) + ' ' + walletSettings.unitName;
  $scope.btx.feeStr = profileService.formatAmount($scope.btx.fees, true) + ' ' + walletSettings.unitName;

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

      if (!lodash.isEmpty($scope.data.comment)) {
        args.body = $scope.data.comment;
      };

      fc.editTxNote(args, function(err) {
        if (err) {
          $log.debug('Could not save tx comment');
          return;
        }
        // This is only to refresh the current screen data
        $scope.btx.note = null;
        if (args.body) {
          $scope.btx.note = {};
          $scope.btx.note.body = $scope.data.comment;
          $scope.btx.note.editedByName = fc.credentials.copayerName;
          $scope.btx.note.editedOn = Math.floor(Date.now() / 1000);
        }
        $scope.btx.searcheableString = null;
        commentPopup.close();
      });
    };
  };

  $scope.getAlternativeAmount = function() {
    var satToBtc = 1 / 100000000;

    fc.getFiatRate({
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

  $scope.getShortNetworkName = function() {
    var n = fc.credentials.network;
    return n.substring(0, 4);
  };

  $scope.copyToClipboard = function(addr, $event) {
    if (!addr) return;
    self.copyToClipboard(addr, $event);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
  };

});
