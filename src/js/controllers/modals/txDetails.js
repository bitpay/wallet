'use strict';

angular.module('copayApp.controllers').controller('txDetailsController', function($rootScope, $scope, $filter, profileService, nodeWebkit, configService,  gettextCatalog) {

    var self = $scope.self;
    var fc = profileService.focusedClient;
    var config = configService.getSync();
    var configWallet = config.wallet;
    var walletSettings = configWallet.settings;

    $scope.alternativeIsoCode = walletSettings.alternativeIsoCode;
    $scope.color = fc.backgroundColor;
    $scope.copayerId = fc.credentials.copayerId;
    $scope.isShared = fc.credentials.n > 1;

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
