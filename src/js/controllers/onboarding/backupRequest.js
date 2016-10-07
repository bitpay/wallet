'use strict';

angular.module('copayApp.controllers').controller('backupRequestController', function($scope, $state, $stateParams, popupService, gettextCatalog) {

  $scope.walletId = $stateParams.walletId;

  $scope.openPopup = function() {

    var title = gettextCatalog.getString('Without a backup, you could lose money.');
    var message = gettextCatalog.getString('If this device is replaced or this app is deleted, neither you nor BitPay can recover your funds without a backup.');
    var okText = gettextCatalog.getString('I understand');
    var cancelText = gettextCatalog.getString('Go back');
    popupService.showConfirm(title, message, okText, cancelText, function(val) {
      if (val) {
        var title = gettextCatalog.getString('Are you sure you want to skip the backup?');
        var message = gettextCatalog.getString('You can create a backup later from your wallet settings.');
        var okText = gettextCatalog.getString('Yes, skip backup');
        var cancelText = gettextCatalog.getString('Go back');
        popupService.showConfirm(title, message, okText, cancelText, function(val) {
          if (val) {
            $state.go('onboarding.disclaimer', {walletId: $scope.walletId, backedUp: false});
          }
        });
      }
    });
  }

});
