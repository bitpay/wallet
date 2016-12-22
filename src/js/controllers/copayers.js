'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $log, $timeout, $stateParams, $state, $rootScope, $ionicHistory, $window, lodash, profileService, walletService, popupService, platformInfo, gettextCatalog, ongoingProcess) {

    var appName = $window.appConfig.userVisibleName;
    var appUrl = $window.appConfig.url;

    $scope.isCordova = platformInfo.isCordova;
    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.wallet = profileService.getWallet(data.stateParams.walletId);
      updateWallet();
    });

    $rootScope.$on('bwsEvent', function() {
      updateWallet();
    });

    var updateWallet = function() {
      $log.debug('Updating wallet:' + $scope.wallet.name)
      walletService.getStatus($scope.wallet, {}, function(err, status) {
        if (err) {
          $log.error(err); //TODO
          return;
        }
        $scope.wallet.status = status;
        $scope.copayers = $scope.wallet.status.wallet.copayers;
        $scope.secret = $scope.wallet.status.wallet.secret;
        $timeout(function() {
          $scope.$apply();
        });
        if (status.wallet.status == 'complete') {
          $scope.wallet.openWallet(function(err, status) {
            if (err) $log.error(err);
            $scope.goHome();
          });
        }
      });
    };

    $scope.showDeletePopup = function() {
      var title = gettextCatalog.getString('Confirm');
      var msg = gettextCatalog.getString('Are you sure you want to cancel and delete this wallet?');
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) deleteWallet();
      });
    };

    function deleteWallet() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient($scope.wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          $scope.goHome();
        }
      });
    };

    $scope.copySecret = function() {
      if ($scope.isCordova) {
        window.cordova.plugins.clipboard.copy($scope.secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    $scope.shareSecret = function() {
      if ($scope.isCordova) {
        var message = gettextCatalog.getString('Join my {{appName}} Wallet. Here is the invitation code: {{secret}} You can download {{appName}} for your phone or desktop at {{appUrl}}', {
          secret: $scope.secret,
          appName: appName,
          appUrl: appUrl
        });
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a {{appName}} Wallet', {
          appName: appName
        }), null, null);
      }
    };

    $scope.goHome = function() {
      $state.go('tabs.home');
      $ionicHistory.clearHistory();
    };

  });
