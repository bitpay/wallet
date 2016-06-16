'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWordsController', function($scope, confirmDialog, lodash, notification, profileService, go, gettext) {
  var fc = profileService.focusedClient;
  var msg = gettext('Are you sure you want to delete the recovery phrase?');
  var successMsg = gettext('Recovery phrase deleted');

  if (lodash.isEmpty(fc.credentials.mnemonic) && lodash.isEmpty(fc.credentials.mnemonicEncrypted))
    $scope.deleted = true;

  $scope.delete = function() {
    confirmDialog.show(msg, function(ok) {
      if (ok) {
        fc.clearMnemonic();
        profileService.updateCredentials(JSON.parse(fc.export()), function() {
          notification.success(successMsg);
          go.walletHome();
        });
      }
    });
  };
});
