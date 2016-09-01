'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $log, $ionicPopup, profileService, platformInfo, gettextCatalog, $stateParams, ongoingProcess, $state) {
    if (!$stateParams.walletId) {
      $log.debug('No wallet provided...back to home');
      return $state.transitionTo('tabs.home');
    }

    var wallet = profileService.getWallet($stateParams.walletId);
    var secret;
    try {
      secret = wallet.status.wallet.secret;
    } catch (e) {};

    $scope.wallet = wallet;
    $scope.secret = secret;
    $scope.isCordova = platformInfo.isCordova;

    $scope.showDeletePopup = function() {
      var popup = $ionicPopup.show({
        template: '<span>' + gettextCatalog.getString('Are you sure you want to delete this wallet?') + '</span>',
        title: gettextCatalog.getString('Confirm'),
        buttons: [
          {
            text: gettextCatalog.getString('Cancel'),
            onTap: function(e) {
              popup.close();
            }
          },
          {
            text: gettextCatalog.getString('Accept'),
            type: 'button-positive',
            onTap: function(e) {
              deleteWallet();
              popup.close();
            }
          }
        ]
      });
    };

    function deleteWallet() {
      ongoingProcess.set('deletingWallet', true);
      profileService.deleteWalletClient(wallet, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
        } else {
          $state.transitionTo('tabs.home');
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
  });
