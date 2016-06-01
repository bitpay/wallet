'use strict';

angular.module('copayApp.controllers').controller('txController',
  function($rootScope, $scope, $timeout, $filter, lodash, profileService, platformInfo, nodeWebkit, configService, animationService, gettextCatalog) {

    var isCordova = platformInfo.isCordova;
    var fc = profileService.focusedClient;
    var config = configService.getSync();
    var configWallet = config.wallet;
    var walletSettings = configWallet.settings;
    var m = angular.element(document.getElementsByClassName('txModal'));
    m.addClass(animationService.modalAnimated.slideRight);

    this.alternativeIsoCode = walletSettings.alternativeIsoCode;
    this.color = fc.backgroundColor;
    this.copayerId = fc.credentials.copayerId;
    this.isShared = fc.credentials.n > 1;

    if (isCordova) {
      $rootScope.modalOpened = true;
      var self = this;
      var disableCloseModal = $rootScope.$on('closeModal', function() {
        self.cancel();
      });
    }

    this.getAlternativeAmount = function(btx) {
      var self = this;
      var satToBtc = 1 / 100000000;
      fc.getFiatRate({
        code: self.alternativeIsoCode,
        ts: btx.time * 1000
      }, function(err, res) {
        if (err) {
          $log.debug('Could not get historic rate');
          return;
        }
        if (res && res.rate) {
          var alternativeAmountBtc = (btx.amount * satToBtc).toFixed(8);
          $scope.rateDate = res.fetchedOn;
          $scope.rateStr = res.rate + ' ' + self.alternativeIsoCode;
          $scope.alternativeAmountStr = $filter('noFractionNumber')(alternativeAmountBtc * res.rate, 2) + ' ' + self.alternativeIsoCode;
          $scope.$apply();
        }
      });
    };

    this.getShortNetworkName = function() {
      var n = fc.credentials.network;
      return n.substring(0, 4);
    };

    this.copyToClipboard = function(value) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(value);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      } else if (platformInfo.isNW) {
        nodeWebkit.writeToClipboard(value);
      }
    };

    this.cancel = lodash.debounce(function() {
      m.addClass(animationService.modalAnimated.slideOutRight);
      if (isCordova) {
        $rootScope.modalOpened = false;
        disableCloseModal();
        $timeout(function() {
          $rootScope.$emit('Local/TxModal', null);
        }, 350);
      } else {
        $rootScope.$emit('Local/TxModal', null);
      }
    }, 0, 1000);

  });
