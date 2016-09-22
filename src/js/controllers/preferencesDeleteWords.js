'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWordsController', function($scope, $ionicHistory, $stateParams, gettextCatalog, confirmDialog, lodash, profileService, gettext) {
  var wallet = profileService.getWallet($stateParams.walletId);
  var msg = gettext('Are you sure you want to delete the recovery phrase?');
  var successMsg = gettext('Recovery phrase deleted');
  $scope.needsBackup = wallet.needsBackup;

  if (lodash.isEmpty(wallet.credentials.mnemonic) && lodash.isEmpty(wallet.credentials.mnemonicEncrypted))
    $scope.deleted = true;

  $scope.delete = function() {
    confirmDialog.show(msg, function(ok) {
      if (ok) {
        wallet.clearMnemonic();
        profileService.updateCredentials(JSON.parse(wallet.export()), function() {
          $ionicHistory.goBack();
        });
      }
    });
  };
});
