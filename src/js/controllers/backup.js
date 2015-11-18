'use strict';

angular.module('copayApp.controllers').controller('wordsController',
  function($rootScope, $scope, $timeout, $log, $compile, lodash, profileService, go, gettext, confirmDialog, notification, bwsError) {

    var msg = gettext('Are you sure you want to delete the backup words?');
    var successMsg = gettext('Backup words deleted');
    var self = this;
    var customSortWords = [];
    var fc = profileService.focusedClient;
    self.show = false;
    self.sorted = false;

    if (fc.isPrivKeyEncrypted())
      self.credentialsEncrypted = true;
    else
      setWords(fc.getMnemonic());

    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic)
      self.deleted = true;

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

    self.enableButton = function(word) {
      document.getElementById(word).disabled = false;
      lodash.remove(customSortWords, function(v) {
        return v == word;
      });
    }

    self.disableButton = function(word) {
      document.getElementById(word).disabled = true;
      customSortWords.push(word);
      self.addButton(word);
    }

    self.addButton = function(word) {
      var asd = 'apospodk';
      var btnhtml = '<button class="button radius tiny" style="white-space:nowrap" ' +
        'data-ng-click="wordsC.removeButton($event)" id="_' + word + '" > ' + word + ' </button>';
      var temp = $compile(btnhtml)($scope);
      angular.element(document.getElementById('addWord')).append(temp);
      self.shouldContinue(customSortWords);
    }

    self.removeButton = function(event) {
      var id = (event.target.id);
      var element = document.getElementById(id);
      element.remove();
      self.enableButton(id.substring(1));
      self.shouldContinue(customSortWords);
    }

    self.shouldContinue = function(customSortWords) {
      if (lodash.isEqual(self.mnemonicWords, customSortWords))
        self.sorted = true;
      else
        self.sorted = false;
    }
  });
