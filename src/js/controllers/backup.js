'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, $compile, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var self = this;
    var fc = profileService.focusedClient;

    if (fc.isPrivKeyEncrypted()) {
      self.credentialsEncrypted = true;
      passwordRequest();
    } else
      setWords(fc.getMnemonic());

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    function passwordRequest() {
      try {
        setWords(fc.getMnemonic());
      } catch (e) {
        if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {

          $timeout(function() {
            $scope.$apply();
          }, 1);

          profileService.unlockFC(function(err) {
            if (err) {
              self.error = bwsError.msg(err, gettext('Could not decrypt'));
              $log.warn('Error decrypting credentials:', self.error); //TODO
              return;
            }

            self.credentialsEncrypted = false;
            setWords(fc.getMnemonic());
          });
        }
      }
    }
  });
