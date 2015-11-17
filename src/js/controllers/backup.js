'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, $log, $compile, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var msg = gettext('Are you sure you want to delete the backup words?');
    var successMsg = gettext('Backup words deleted');
    var self = this;
    self.show = false;
    self.sorted = false;
    $scope.seed = '';
    var customSortWords = [];
    var fc = profileService.focusedClient;

    if (fc.isPrivKeyEncrypted()) self.credentialsEncrypted = true;
    else {
      setWords(fc.getMnemonic());
    }
    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
      self.deleted = true;
    }

    self.toggle = function() {
      self.error = "";
      if (!self.credentialsEncrypted) {
        if (!self.show)
          $rootScope.$emit('Local/BackupDone');
        self.show = !self.show;
      }

      if (self.credentialsEncrypted)
        self.passwordRequest();

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    self.delete = function() {
      confirmDialog.show(msg, function(ok) {
        if (ok) {
          fc.clearMnemonic();
          profileService.updateCredentialsFC(function() {
            self.deleted = true;
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

    self.passwordRequest = function() {
      try {
        setWords(fc.getMnemonic());
      } catch (e) {
        if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
          self.credentialsEncrypted = true;

          $timeout(function() {
            $scope.$apply();
          }, 1);

          profileService.unlockFC(function(err) {
            if (err) {
              self.error = bwsError.msg(err, gettext('Could not decrypt'));
              $log.warn('Error decrypting credentials:', self.error); //TODO
              return;
            }
            if (!self.show && self.credentialsEncrypted)
              self.show = !self.show;
            self.credentialsEncrypted = false;
            setWords(fc.getMnemonic());
            $rootScope.$emit('Local/BackupDone');
          });
        }
      }
    }

    self.disableButton = function(word) {
      document.getElementById(word).disabled = true;
      $scope.seed += word + ' ';
      customSortWords.push(word);

      if (customSortWords.length == 12)
        self.shouldContinue(customSortWords);

      self.addButton(word);
    }

    self.addButton = function(word) {
      var btnhtml = '<button class="button radius tiny" style="white-space:nowrap" ' +
        'ng - click = "wordsC.removeButton(' + word + ')" id = "{{' + word + '_}}" > ' + word + ' </button>';
      var temp = $compile(btnhtml)($scope);
      angular.element(document.getElementById('addWord')).append(temp);
    }

    self.removeButton = function(word) {

    }

    self.shouldContinue = function(customSortWords) {
      if (lodash.isEqual(self.mnemonicWords, customSortWords))
        self.sorted = true;
    }
  });
