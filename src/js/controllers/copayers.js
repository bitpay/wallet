'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $rootScope, $timeout, $log, $modal, profileService, go, notification, platformInfo, gettext, gettextCatalog, animationService) {
    var self = this;
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    // Note that this is ONLY triggered when the page is opened
    // IF a wallet is incomplete and copay is at /#copayers 
    // and the user switch to an other complete wallet
    // THIS IS NOT TRIGGERED.
    //
    self.init = function() {
      var fc = profileService.focusedClient;
      if (fc.isComplete()) {
        $log.debug('Wallet Complete...redirecting')
        go.walletHome();
        return;
      }
    };

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, gettext) {
        $scope.title = delete_msg;
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close(accept_msg);

        };
        $scope.cancel = function() {
          $modalInstance.dismiss(cancel_msg);
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: animationService.modalAnimated.slideUp,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          _deleteWallet();
        }
      });
    };

    var _deleteWallet = function() {
      var fc = profileService.focusedClient;
      var walletName = fc.credentials.walletName;
      profileService.deleteWalletFC({}, function(err) {
        if (err) {
          self.error = err.message || err;
          $timeout(function() {
            $scope.$digest();
          });
        } else {
          go.walletHome();
          $timeout(function() {
            notification.success(
                gettextCatalog.getString('Success'), 
                gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {walletName: walletName})
            );
          });
        }
      });
    };

    self.deleteWallet = function() {
      var fc = profileService.focusedClient;
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              _deleteWallet();
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };

    self.copySecret = function(secret) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    self.shareSecret = function(secret) {
      if (isCordova) {
        if (isAndroid || isWP) {
          window.ignoreMobilePause = true;
        }
        var message = gettextCatalog.getString('Join my Copay wallet. Here is the invitation code: {{secret}} You can download Copay for your phone or desktop at https://copay.io', {secret: secret});
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a Copay Wallet'), null, null);
      }
    };

  });
