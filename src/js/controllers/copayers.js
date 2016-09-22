'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $log, $ionicNavBarDelegate, $timeout, $stateParams, $state, $rootScope, $ionicHistory, lodash, profileService, walletService, popupService, platformInfo, gettextCatalog, ongoingProcess) {

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      init();
    });

    var init = function() {
      $scope.isCordova = platformInfo.isCordova;
      $scope.wallet = profileService.getWallet($stateParams.walletId);
      updateWallet();
    };

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
      popupService.showConfirm(gettextCatalog.getString('Confirm'), gettextCatalog.getString('Are you sure you want to delete this wallet?'), null, null, function(res) {
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
        var message = gettextCatalog.getString('Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io', {
          secret: $scope.secret
        });
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a Copay Wallet'), null, null);
      }
    };

    $scope.goHome = function() {
      $ionicHistory.removeBackView();
      $state.go('tabs.home');
    };

  });
