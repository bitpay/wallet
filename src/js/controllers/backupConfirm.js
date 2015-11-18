'use strict';

angular.module('copayApp.controllers').controller('backupConfirmController',
  function($rootScope, $scope, $timeout, $log, $compile, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var self = this;
    var fc = profileService.focusedClient;

    setWords(fc.getMnemonic());

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    self.confirm = function() {
      $rootScope.$emit('Local/BackupDone');
    }
  });
