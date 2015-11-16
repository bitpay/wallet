'use strict';

angular.module('copayApp.controllers').controller('securityPreferencesController',
  function($scope, profileService) {
    var self = this;
    var fc = profileService.focusedClient;
    self.deleted = false;
    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
      self.deleted = true;
    }

  });
