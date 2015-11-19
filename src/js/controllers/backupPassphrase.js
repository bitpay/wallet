'use strict';

angular.module('copayApp.controllers').controller('backupPassphraseController',
  function($rootScope, $scope, $timeout, $log, $compile, bwcService, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var self = this;
    var fc = profileService.focusedClient;
    self.passphraseSuccess = false;
    self.checkingPassphrase = false;
    self.error = "";

    setWords(fc.getMnemonic());
    var words = fc.getMnemonic();

    self.changePassphrase = function() {
      self.passphraseSuccess = false;
      $timeout(function() {
        $rootScope.$apply();
      }, 1);
    }

    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    self.confirm = function() {
      self.checkingPassphrase = true;
      self.error = "";

      var walletClient = bwcService.getClient();

      walletClient.importFromMnemonic(words, {
        network: 'livenet',
        passphrase: $scope.passphrase,
        account: 0,
      }, function(err) {
        self.checkingPassphrase = false;
        if (err) {
          self.error = err.message;
          $timeout(function() {
            $rootScope.$apply();
          }, 1);
          return;
        }

        self.passphraseSuccess = true;
        $timeout(function() {
          $rootScope.$apply();
        }, 1);
      });
    }
  });
