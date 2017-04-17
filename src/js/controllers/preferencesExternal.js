'use strict';

angular.module('copayApp.controllers').controller('preferencesExternalController', function($scope, $stateParams, lodash, gettextCatalog, popupService, profileService, walletService) {
  var wallet = profileService.getWallet($stateParams.walletId);

  $scope.externalSource = lodash.find(walletService.externalSource, function(source) {
    return source.id == wallet.getPrivKeyExternalSourceName();
  });

  if ($scope.externalSource.isEmbeddedHardware) {
    $scope.hardwareConnected = $scope.externalSource.version.length > 0;

    $scope.showMneumonicFromHardwarePopup = function() {
      var title = gettextCatalog.getString('Warning!');
      var message = gettextCatalog.getString('Are you being watched? Anyone with your recovery phrase can access or spend your bitcoin.');
      popupService.showConfirm(title, message, null, null, function(res) {
        if (res) {
          walletService.showMneumonicFromHardware(wallet, function(err) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), err.message || err);
            }
          });
        }
      });
    };    
  }

});