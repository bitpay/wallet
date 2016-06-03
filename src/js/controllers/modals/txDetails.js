'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($rootScope, $log, $scope, $filter, $ionicPopup, gettextCatalog, profileService, configService) {

  var self = $scope.self;
  var fc = profileService.focusedClient;
  var config = configService.getSync();
  var configWallet = config.wallet;
  var walletSettings = configWallet.settings;

  $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
  $scope.color = fc.backgroundColor;
  $scope.copayerId = fc.credentials.copayerId;
  $scope.isShared = fc.credentials.n > 1;

console.log('[txDetails.js.16:btx:]',$scope.btx); //TODO
  // if ($scope.btx.txid) {
  //   fc.getTxNote({
  //     txid: $scope.btx.txid
  //   }, function(err, note) {
  //     if (err || !note) {
  //       $log.debug(gettextCatalog.getString('Could not fetch transaction note'));
  //       return;
  //     }
  //     $scope.comment = note.body;
  //     $scope.editedBy = gettextCatalog.getString('Edited by') + ' ' + note.editedByName;
  //     $scope.createdOn = note.createdOn;
  //   });
  // }
  //
  $scope.showCommentPopup = function() {
    $scope.data = {
      comment: ''
    };

    var commentPopup = $ionicPopup.show({
      templateUrl: "views/includes/note.html",
      scope: $scope,
    });

    $scope.commentPopupClose = function() {
      commentPopup.close();
    };

    $scope.commentPopupSave = function() {
      fc.editTxNote({
        txid: $scope.btx.txid,
        body: $scope.data.comment
      }, function(err) {
        if (err) {
          $log.debug('Could not save tx comment');
          return;
        }
        $scope.comment = $scope.data.comment;
        $scope.editedBy = gettextCatalog.getString('Edited by') + ' ' + fc.credentials.copayerName;
        $scope.createdOn = Math.floor(Date.now() / 1000);
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
        $scope.alternativeAmountStr = $filter('noFractionNumber')(alternativeAmountBtc * res.rate, 2) + ' ' + $scope.alternativeIsoCode;
        $scope.$apply();
      }
    });
  };

  $scope.getShortNetworkName = function() {
    var n = fc.credentials.network;
    return n.substring(0, 4);
  };

  $scope.copyToClipboard = function(addr) {
    if (!addr) return;
    self.copyToClipboard(addr);
  };

  $scope.cancel = function() {
    $scope.txDetailsModal.hide();
  };

});
