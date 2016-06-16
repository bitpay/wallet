'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $rootScope, $filter, $timeout, $log, $ionicModal, storageService, notification, profileService, platformInfo, go, gettext, gettextCatalog, applicationService, ongoingProcess) {
    var isCordova = platformInfo.isCordova;
    $scope.isCordova = isCordova;
    $scope.error = null;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    var _modalDeleteWallet = function() {
      $scope.title = delete_msg;
      $scope.accept_msg = accept_msg;
      $scope.cancel_msg = cancel_msg;
      $scope.confirm_msg = confirm_msg;
      $scope.okAction = doDeleteWallet;
      $scope.loading = false;

      $ionicModal.fromTemplateUrl('views/modals/confirmation.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.confirmationModal = modal;
        $scope.confirmationModal.show();
      });
    };

    var doDeleteWallet = function() {
      ongoingProcess.set('deletingWallet', true);
      var fc = profileService.focusedClient;
      var name = fc.credentials.walletName;
      var walletName = (fc.alias || '') + ' [' + name + ']';

      profileService.deleteWalletClient(fc, function(err) {
        ongoingProcess.set('deletingWallet', false);
        if (err) {
          $scope.error = err.message || err;
        } else {
          go.walletHome();
          notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
            walletName: walletName
          }));
        }
      });
    };

    $scope.deleteWallet = function() {
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              doDeleteWallet();
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };
  });
