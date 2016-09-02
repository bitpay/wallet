'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $ionicPopup, $stateParams, $ionicNavBarDelegate, $ionicHistory, gettextCatalog, lodash, profileService, $state, ongoingProcess, popupService) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('Delete Wallet'));
    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.alias = lodash.isEqual(wallet.name, wallet.credentials.walletName) ? null : wallet.name + ' ';
    $scope.walletName = '[' + wallet.credentials.walletName + ']';

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
          $ionicHistory.clearHistory();
          $state.go('tabs.home');
        }
      });
    };
  });
