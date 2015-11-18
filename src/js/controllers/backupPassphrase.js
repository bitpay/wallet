'use strict';

angular.module('copayApp.controllers').controller('backupPassphraseController',
  function($rootScope, $scope, $timeout, $log, $compile, bwcService, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var self = this;
    var fc = profileService.focusedClient;
    self.passphraseSuccess = false;
    self.error = "";

    setWords(fc.getMnemonic());
    var words = fc.getMnemonic();

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    self.confirm = function() {
      var walletClient = bwcService.getClient();

      walletClient.importFromMnemonic(words, {
        network: 'livenet',
        passphrase: $scope.passphrase,
        account: 0,
      }, function(err) {
        if (err)
          self.error = err.message;
      });
    }
  });
