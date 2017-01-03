'use strict';

angular.module('copayApp.controllers').controller('coinbaseController', function($rootScope, $scope, $timeout, $ionicModal, $log, profileService, configService, storageService, coinbaseService, lodash, platformInfo, ongoingProcess, popupService, gettextCatalog, externalLinkService) {

  var isNW = platformInfo.isNW;
  var isCordova = platformInfo.isCordova;

  var init = function() {
    ongoingProcess.set('connectingCoinbase', true);
    coinbaseService.init(function(err, data) {
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
    $log.debug('Getting transactions...');
    $scope.pendingTransactions = { data: {} };
    coinbaseService.getPendingTransactions($scope.pendingTransactions);
  };

  this.openAuthenticateWindow = function() {
    var oauthUrl = this.getAuthenticateUrl();
    if (!isNW) {
      externalLinkService.open(oauthUrl);
    } else {
      var self = this;
      var gui = require('nw.gui');
      gui.Window.open(oauthUrl, {
        focus: true,
        position: 'center'
      }, function(new_win) {
        new_win.on('loaded', function() {
          var title = new_win.window.document.title;
          $timeout(function() {
            if (title.indexOf('Coinbase') == -1) {
              $scope.code = title;
              self.submitOauthCode($scope.code);
              new_win.close();
            }
          }, 100);
        });
      });
    }
  }

  this.getAuthenticateUrl = function() {
    $scope.showOauthForm = isCordova || isNW ? false : true;
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

  var self = this;
  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    coinbaseService.setCredentials();
    if (data.stateParams && data.stateParams.code) {
      self.submitOauthCode(data.stateParams.code);
    } else {
      init();
    }
  });
});
