'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $ionicHistory, gettextCatalog, lodash, profileService, $state, ongoingProcess, popupService) {
    
    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      if (!data.stateParams || !data.stateParams.walletId) {
        popupService.showAlert(null, gettextCatalog.getString('Bad param'), function() {
          $ionicHistory.goBack();
        });
        return;
      }
      $scope.wallet = profileService.getWallet(data.stateParams.walletId);
      $scope.alias = lodash.isEqual($scope.wallet.name, $scope.wallet.credentials.walletName) ? null : $scope.wallet.name + ' ';
      $scope.walletName = $scope.wallet.credentials.walletName;
    });

    $scope.showDeletePopup = function() {
      var title = gettextCatalog.getString('Warning!');
      var message = gettextCatalog.getString('Are you sure you want to delete this wallet?');
      popupService.showConfirm(title, message, null, null, function(res) {
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
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            historyRoot: true
          });
          $ionicHistory.clearHistory();
          $state.go('tabs.settings').then(function() {
            $state.transitionTo('tabs.home');
          });
        }
      });
    };
  });
