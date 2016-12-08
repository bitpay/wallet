'use strict';

angular.module('copayApp.controllers').controller('coinbaseController', function($rootScope, $scope, $timeout, $ionicModal, $log, profileService, configService, storageService, coinbaseService, lodash, platformInfo, ongoingProcess, popupService, gettextCatalog, externalLinkService) {

  var isNW = platformInfo.isNW;

  var init = function() {
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init($scope.accessToken, function(err, data) {
console.log('[coinbase.js:9]',data); //TODO)
      ongoingProcess.set('connectingCoinbase', false);
      if (err || lodash.isEmpty(data)) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
        }
        return;
      }
      // Updating accessToken and accountId
      $timeout(function() {
        $scope.accessToken = data.accessToken;
        $scope.accountId = data.accountId;
        $scope.updateTransactions();
        $scope.$apply();
      }, 100);
    });
  };

  $scope.updateTransactions = function() {
    $log.debug('Checking for transactions...');
    coinbaseService.getPendingTransactions($scope.accessToken, $scope.accountId, function(err, txs) {
console.log('[coinbase.js:43]',txs); //TODO)
      $scope.pendingTransactions = txs;
    });

  };

  this.openAuthenticateWindow = function() {
    var oauthUrl = this.getAuthenticateUrl();
    externalLinkService.open(oauthUrl);
    /*
     * Not working (NW bug)
    if (!isNW) {
      externalLinkService.open(oauthUrl);
    } else {
      var self = this;
      var gui = require('nw.gui');
      gui.Window.open(oauthUrl, {
        focus: true,
        position: 'center'
      }, function(win) {
        win.on('loaded', function() {
          var title = win.title;
          if (title.indexOf('Coinbase') == -1) {
            $scope.code = title;
            self.submitOauthCode(title);
            win.close();
          }
        });
      });
    }
    */
  }

  this.getAuthenticateUrl = function() {
    return coinbaseService.getOauthCodeUrl();
  };

  this.submitOauthCode = function(code) {
    var self = this;
    ongoingProcess.set('connectingCoinbase', true);
    $scope.error = null;
    $timeout(function() {
      coinbaseService.getToken(code, function(err, accessToken) {
        ongoingProcess.set('connectingCoinbase', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.accessToken = accessToken;
        init();
      });
    }, 100);
  };

  this.openTxModal = function(tx) {
    $scope.tx = tx;

    $ionicModal.fromTemplateUrl('views/modals/coinbase-tx-details.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.coinbaseTxDetailsModal = modal;
      $scope.coinbaseTxDetailsModal.show();
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    coinbaseService.setCredentials();
    $scope.network = coinbaseService.getEnvironment();
    init();
  });
});
