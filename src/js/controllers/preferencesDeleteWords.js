'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWordsController', function(confirmDialog, lodash, notification, profileService, go, gettext) {
  var self = this;
  var fc = profileService.focusedClient;
  var msg = gettext('Are you sure you want to delete the recovery phrase?');
  var successMsg = gettext('Recovery phrase deleted');

  if (lodash.isEmpty(fc.credentials.mnemonic) && lodash.isEmpty(fc.credentials.mnemonicEncrypted))
    self.deleted = true;

  self.delete = function() {
    confirmDialog.show(msg, function(ok) {
      if (ok) {
        fc.clearMnemonic();
        profileService.updateCredentialsFC(function() {
          notification.success(successMsg);
          go.walletHome();
        });
      }
    });
  };
});
