'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, profileService, go, gettext, confirmDialog, notification, bwsError, $log) {

    var msg = gettext('Are you sure you want to delete the backup words?');
    var successMsg = gettext('Backup words deleted');
    this.show = false;

    var self = this;

    this.toggle = function() {
      this.show = !this.show;

      if (this.show) 
        $rootScope.$emit('Local/BackupDone');

      $timeout(function(){
        $scope.$apply();
      }, 1);
    };

    this.delete = function() {
      var fc = profileService.focusedClient;
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


    $scope.$on('$destroy', function() {
      profileService.lockFC();
    });


    function setWords(words) {
      if (words) {
        self.mnemonicWords = words.split(/[\u3000\s]+/);
        self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
        self.useIdeograms = words.indexOf("\u3000") >= 0;
      }
    };

    var fc = profileService.focusedClient;
    try {
      setWords(fc.getMnemonic());
    } catch (e) {
      if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
        self.credentialsEncrypted = true;

        $timeout(function(){
          $scope.$apply();
        }, 1);

        profileService.unlockFC(function(err) {
          if (err) {
            self.error = bwsError.msg(err, gettext('Could not decrypt'));
            $log.warn('Error decrypting credentials:',self.error); //TODO
            return;
          }
          self.credentialsEncrypted = false;
          setWords(fc.getMnemonic());
        });
      } 
    }
  });
