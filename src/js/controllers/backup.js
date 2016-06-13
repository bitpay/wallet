'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, lodash, profileService, gettext, bwcService, bwsError, walletService, ongoingProcess) {

    var self = this;
    var fc = profileService.focusedClient;
    self.customWords = [];
    self.walletName = fc.credentials.walletName;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    if (fc.isPrivKeyEncrypted() && !isDeletedSeed()) {
      self.credentialsEncrypted = true;
      passwordRequest();
    } else {
      if (!isDeletedSeed())
        initWords();
    }

    init();

    function init() {
      $scope.passphrase = '';
      self.shuffledMnemonicWords = shuffledWords(self.mnemonicWords);
      self.customWords = [];
      self.step = 1;
      self.deleted = isDeletedSeed();
      self.credentialsEncrypted = false;
      self.selectComplete = false;
      self.backupError = false;
    };

    function isDeletedSeed() {
      if (lodash.isEmpty(fc.credentials.mnemonic) && lodash.isEmpty(fc.credentials.mnemonicEncrypted))
        return true;
      return false;
    };

    self.backTo = function(state) {
      console.log(state);
      if (state == 'walletHome')
        go.walletHome();
      else
        go.preferences();
    };

    self.goToStep = function(n) {
      if (n == 1)
        init();
      if (n == 2)
        self.step = 2;
      if (n == 3) {
        if (!self.mnemonicHasPassphrase)
          finalStep();
        else
          self.step = 3;
      }
      if (n == 4)
        finalStep();

      function finalStep() {
        ongoingProcess.set('validatingWords', true);
        confirm(function(err) {
          ongoingProcess.set('validatingWords', false);
          if (err) {
            backupError(err);
          }
          $timeout(function() {
            self.step = 4;
            return;
          }, 1);
        });
      };
    };

    function initWords() {
      var words = fc.getMnemonic();
      self.xPrivKey = fc.credentials.xPrivKey;
      walletService.lock(fc);
      self.mnemonicWords = words.split(/[\u3000\s]+/);
      self.shuffledMnemonicWords = shuffledWords(self.mnemonicWords);
      self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
      self.useIdeograms = words.indexOf("\u3000") >= 0;
    };

    function shuffledWords(words) {
      var sort = lodash.sortBy(words);

      return lodash.map(sort, function(w) {
        return {
          word: w,
          selected: false
        };
      });
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
    };

    $scope.addButton = function(index, item) {
      var newWord = {
        word: item.word,
        prevIndex: index
      };
      self.customWords.push(newWord);
      self.shuffledMnemonicWords[index].selected = true;
      self.shouldContinue();
    };

    $scope.removeButton = function(index, item) {
      self.customWords.splice(index, 1);
      self.shuffledMnemonicWords[item.prevIndex].selected = false;
      self.shouldContinue();
    };

    self.shouldContinue = function() {
      if (self.customWords.length == 12)
        self.selectComplete = true;
      else
        self.selectComplete = false;
    };

    function confirm(cb) {
      self.backupError = false;

      var customWordList = lodash.pluck(self.customWords, 'word');

      if (!lodash.isEqual(self.mnemonicWords, customWordList)) {
        return cb('Mnemonic string mismatch');
      }

      $timeout(function() {
        if (self.mnemonicHasPassphrase) {
          var walletClient = bwcService.getClient();
          var separator = self.useIdeograms ? '\u3000' : ' ';
          var customSentence = customWordList.join(separator);
          var passphrase = $scope.passphrase || '';

          try {
            walletClient.seedFromMnemonic(customSentence, {
              network: fc.credentials.network,
              passphrase: passphrase,
              account: fc.credentials.account
            });
          } catch (err) {
            return cb(err);
          }

          if (walletClient.credentials.xPrivKey != self.xPrivKey) {
            return cb('Private key mismatch');
          }
        }

        $rootScope.$emit('Local/BackupDone');
        return cb();
      }, 1);
    };

    function backupError(err) {
      ongoingProcess.set('validatingWords', false);
      $log.debug('Failed to verify backup: ', err);
      self.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
  });
