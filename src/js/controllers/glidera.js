'use strict';

angular.module('copayApp.controllers').controller('glideraController',
  function($scope, $timeout, $ionicModal, $log, storageService, glideraService, ongoingProcess, platformInfo, externalLinkService, popupService, lodash) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var init = function() {
      glideraService.init(function(err, data) {
        if (err || lodash.isEmpty(data)) return;

        $scope.account['token'] = data.token;
        $scope.account['status'] = data.status;
        $scope.account['txs'] = data.txs; 

        $timeout(function() {
          $scope.$digest();
          $scope.update();
        });
      });
    };

    $scope.update = function(opts) {
      $log.debug('Updating Glidera...');
      glideraService.updateStatus($scope.account);
    };

    $scope.getAuthenticateUrl = function() {
      return glideraService.getOauthCodeUrl();
    };

    $scope.submitOauthCode = function(code) {
      ongoingProcess.set('connectingGlidera', true);
      glideraService.authorize(code, function(err, data) {
        ongoingProcess.set('connectingGlidera', false);
        if (err) {
          popupService.showAlert('Authorisation error', err);
          return;
        }
        $scope.account['token'] = data.token;
        $scope.account['status'] = data.status;
        init();
      });
    };

    $scope.openTxModal = function(tx) {
      $scope.tx = tx;

      glideraService.getTransaction($scope.account.token, tx.transactionUuid, function(err, tx) {
        if (err) {
          popupService.showAlert('Error getting transaction', 'Could not get transactions');
          return;
        }
        $scope.tx = tx;
      });

      $ionicModal.fromTemplateUrl('views/modals/glidera-tx-details.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.glideraTxDetailsModal = modal;
        $scope.glideraTxDetailsModal.show();
      });
    };

    $scope.openAuthenticateWindow = function() {
      $scope.openExternalLink($scope.getAuthenticateUrl());
      $scope.showOauthForm = true
    }

    $scope.openLoginWindow = function() {
      var glideraUrl = ($scope.network === 'testnet') ? 'https://sandbox.glidera.io/login' : 'https://glidera.io/login';
      $scope.openExternalLink(glideraUrl);
    }

    $scope.openSupportWindow = function() {
      var url = glideraService.getSupportUrl();
      var optIn = true;
      var title = 'Glidera Support';
      var message = 'You can email glidera at support@glidera.io for direct support, or you can contact Glidera on Twitter.';
      var okText = 'Tweet @GlideraInc';
      var cancelText = 'Go Back';
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    }

    $scope.toggleOauthForm = function() {
      $scope.showOauthForm = !$scope.showOauthForm;
    }

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.network = glideraService.getNetwork();
      $scope.currency = glideraService.getCurrency();
      $scope.showOauthForm = false;
      $scope.account = {};
      if (data.stateParams && data.stateParams.code) {
        $scope.submitOauthCode(data.stateParams.code);
      } else {
        init();
      }
    });

  });
