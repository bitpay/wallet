'use strict';

angular.module('copayApp.controllers').controller('txController',
  function($rootScope, $scope, $timeout, profileService, notification, go, gettext, isCordova, nodeWebkit) {

    var fc = profileService.focusedClient;
    this.color = fc.backgroundColor;
    this.copayerId = fc.credentials.copayerId;
    this.isShared = fc.credentials.n > 1;

    if (isCordova) {
      $scope.modalOpening = true;
      $timeout(function() {
        $scope.modalOpening = false; 
      }, 300);
    }

    this.getAlternativeAmount = function(btx) {
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

    this.copyAddress = function(addr) {
      if (!addr) return;
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(addr);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      } else if (nodeWebkit.isDefined()) {
        nodeWebkit.writeToClipboard(addr);
      }
    };   

    this.cancel = function() {
      if (isCordova) {
        $scope.modalClosing = true;
        $timeout(function() {
          $scope.modalClosing = false;
          $rootScope.$emit('Local/TxModal', null);
        }, 300);
      } else {
        $rootScope.$emit('Local/TxModal', null);
      }
    };

  });
