'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $log, $ionicNavBarDelegate, $timeout, $stateParams, $state, $rootScope, lodash, profileService, walletService, popupService, platformInfo, gettextCatalog, ongoingProcess) {
    if (!$stateParams.walletId) {
      $log.debug('No wallet provided...back to home');
      return $state.go('tabs.home');
    }

    var wallet = profileService.getWallet($stateParams.walletId);
    $ionicNavBarDelegate.title(wallet.name);

    var secret;
    try {
      secret = wallet.status.wallet.secret;
    } catch (e) {};

    $scope.wallet = wallet;
    $scope.secret = secret;
    $scope.copayers = wallet.status.wallet.copayers;
    $scope.isCordova = platformInfo.isCordova;

    $scope.showDeletePopup = function() {
      popupService.showConfirm(gettextCatalog.getString('Confirm'), gettextCatalog.getString('Are you sure you want to delete this wallet?'), null, null, function(res) {
        if (res) deleteWallet();
      });
    };

    function deleteWallet() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient(wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          $state.go('tabs.home');
        }
      });
    };

    $scope.copySecret = function() {
      if ($scope.isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    $scope.shareSecret = function() {
      if ($scope.isCordova) {
        var message = gettextCatalog.getString('Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io', {
          secret: secret
        });
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a Copay Wallet'), null, null);
      }
    };

    $rootScope.$on('bwsEvent', function() {
      updateWallet();
    });

    var updateWallet = function() {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err); //TODO
          return;
        }
        wallet.status = status;
        $scope.copayers = wallet.status.wallet.copayers;
        $timeout(function() {
          $scope.$apply();
        });
      });
    };
  });
