'use strict';

angular.module('copayApp.controllers').controller('backupRequestController', function($scope, $state, $stateParams, $ionicConfig, popupService, gettextCatalog) {

  $scope.walletId = $stateParams.walletId;

  $scope.$on("$ionicView.enter", function() {
    $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.openPopup = function() {

    var title = gettextCatalog.getString('Watch out!');
    var message = gettextCatalog.getString('If this device is replaced or this app is deleted, neither you nor BitPay can recover your funds without a backup.');
    var okText = gettextCatalog.getString('I understand');
    var cancelText = gettextCatalog.getString('Go back');
    popupService.showConfirm(title, message, okText, cancelText, function(val) {
      if (val) {
        var title = gettextCatalog.getString('Are you sure you want to skip it?');
        var message = gettextCatalog.getString('You can create a backup later from your wallet settings.');
        var okText = gettextCatalog.getString('Yes, skip');
        var cancelText = gettextCatalog.getString('Go back');
        popupService.showConfirm(title, message, okText, cancelText, function(val) {
          if (val) {
            $state.go('onboarding.disclaimer', {
              walletId: $scope.walletId,
              backedUp: false
            });
          }
        });
      }
    });
  }

});
