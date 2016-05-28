'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $document, $log, $state, $compile, go, lodash, profileService, gettext, bwcService, bwsError, walletService) {

    var self = this;
    var fc = profileService.focusedClient;
    var customWords = [];
    self.walletName = fc.credentials.walletName;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    function init() {
      $scope.passphrase = '';
      resetAllButtons();
      customWords = [];
      self.step = 1;
      self.deleted = false;
      self.credentialsEncrypted = false;
      self.selectComplete = false;
      self.backupError = false;
    }

    init();

    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic)
      self.deleted = true;

    if (fc.isPrivKeyEncrypted() && !self.deleted) {
      self.credentialsEncrypted = true;
      passwordRequest();
    } else {
      if (!self.deleted)
        initWords();
    }

    self.backTo = function(prevState) {
      if (prevState == 'walletHome')
        go.receive();

      if (prevState == 'preferences')
        go.preferences();
    };

    self.goToStep = function(n) {
      self.step = n;
      if (self.step == 1)
        init();
      if (self.step == 3 && !self.mnemonicHasPassphrase)
        self.step++;
      if (self.step == 4) {
        confirm();
      }
    }

    function initWords() {
      var words = fc.getMnemonic();
      self.xPrivKey = fc.credentials.xPrivKey;
      walletService.lock(fc);
      self.mnemonicWords = words.split(/[\u3000\s]+/);
      self.shuffledMnemonicWords = lodash.sortBy(self.mnemonicWords);;
      self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
      self.useIdeograms = words.indexOf("\u3000") >= 0;
    };

    self.toggle = function() {
      self.error = "";

      if (self.credentialsEncrypted)
        passwordRequest();

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    function passwordRequest() {
      try {
        initWords();
      } catch (e) {
        if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {

          $timeout(function() {
            $scope.$apply();
          }, 1);

          handleEncryptedWallet(fc, function(err) {
            if (err) {
              self.error = bwsError.msg(err, gettext('Could not decrypt'));
              $log.warn('Error decrypting credentials:', self.error); //TODO
              return;
            }

            self.credentialsEncrypted = false;
            initWords();

            $timeout(function() {
              $scope.$apply();
            }, 1);
          });
        }
      }
    }

    function resetAllButtons() {
      $document.getElementById('addWord').innerHTML = '';
      var nodes = $document.getElementById("buttons").getElementsByTagName('button');
      lodash.each(nodes, function(n) {
        $document.getElementById(n.id).disabled = false;
      });
    }

    self.enableButton = function(word) {
      $document.getElementById(word).disabled = false;
      lodash.remove(customWords, function(v) {
        return v == word;
      });
    }

    self.disableButton = function(index, word) {
      var element = {
        index: index,
        word: word
      };
      $document.getElementById(index + word).disabled = true;
      customWords.push(element);
      self.addButton(index, word);
    }

    self.addButton = function(index, word) {
      var btnhtml = '<button class="button radius tiny words" ng-disabled="wordsC.disableButtons"' +
        'data-ng-click="wordsC.removeButton($event)" id="_' + index + word + '" > ' + word + ' </button>';
      var temp = $compile(btnhtml)($scope);
      angular.element($document.getElementById('addWord')).append(temp);
      self.shouldContinue();
    }

    self.removeButton = function(event) {
      var id = (event.target.id);
      $document.getElementById(id).remove();
      self.enableButton(id.substring(1));
      lodash.remove(customWords, function(d) {
        return d.index == id.substring(1, 3);
      });
      self.shouldContinue();
    }

    self.shouldContinue = function() {
      if (customWords.length == 12)
        self.selectComplete = true;
      else
        self.selectComplete = false;
    }

    function confirm() {
      self.backupError = false;

      var walletClient = bwcService.getClient();
      var separator = self.useIdeograms ? '\u3000' : ' ';
      var customSentence = lodash.pluck(customWords, 'word').join(separator);
      var passphrase = $scope.passphrase || '';

      try {
        walletClient.seedFromMnemonic(customSentence, {
          network: fc.credentials.network,
          passphrase: passphrase,
          account: fc.credentials.account
        })
      } catch (err) {
        return backupError(err);
      }

      if (walletClient.credentials.xPrivKey != self.xPrivKey) {
        return backupError('Private key mismatch');
      }

      $rootScope.$emit('Local/BackupDone');
    }

    function backupError(err) {
      $log.debug('Failed to verify backup: ', err);
      self.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
  });
