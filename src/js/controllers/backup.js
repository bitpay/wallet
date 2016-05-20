'use strict';

angular.module('copayApp.controllers').controller('backupController',
<<<<<<< HEAD
  function($rootScope, $scope, $timeout, $log, $state, $compile, go, lodash, profileService, gettext, bwcService, bwsError) {
=======
  function($rootScope, $scope, $timeout, $document, $log, $state, $compile, go, lodash, profileService, gettext, bwcService, bwsError, walletService) {
>>>>>>> Add controller tests (#4205)

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

    if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic)
      self.deleted = true;

    if (fc.isPrivKeyEncrypted() && !self.deleted) {
      self.credentialsEncrypted = true;
      passwordRequest();
    } else {
      if (!self.deleted)
        initWords();
    }

    init();

    function init() {
      $scope.passphrase = '';
      self.shuffledMnemonicWords = shuffledWords(self.mnemonicWords);
      self.customWords = [];
      self.step = 1;
      self.deleted = false;
      self.credentialsEncrypted = false;
      self.selectComplete = false;
      self.backupError = false;
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
    };

    function initWords() {
      var words = fc.getMnemonic();
      self.xPrivKey = fc.credentials.xPrivKey;
      profileService.lockFC();
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

          profileService.unlockFC({}, function(err) {
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
<<<<<<< HEAD
    };
=======
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
>>>>>>> Add controller tests (#4205)

    $scope.addButton = function(index, item) {
      var newWord = {
        word: item.word,
        prevIndex: index
      };
<<<<<<< HEAD
      self.customWords.push(newWord);
      self.shuffledMnemonicWords[index].selected = true;
=======
      $document.getElementById(index + word).disabled = true;
      customWords.push(element);
      self.addButton(index, word);
    }

    self.addButton = function(index, word) {
      var btnhtml = '<button class="button radius tiny words" ng-disabled="wordsC.disableButtons"' +
        'data-ng-click="wordsC.removeButton($event)" id="_' + index + word + '" > ' + word + ' </button>';
      var temp = $compile(btnhtml)($scope);
      angular.element($document.getElementById('addWord')).append(temp);
>>>>>>> Add controller tests (#4205)
      self.shouldContinue();
    };

<<<<<<< HEAD
    $scope.removeButton = function(index, item) {
      self.customWords.splice(index, 1);
      self.shuffledMnemonicWords[item.prevIndex].selected = false;
=======
    self.removeButton = function(event) {
      var id = (event.target.id);
      $document.getElementById(id).remove();
      self.enableButton(id.substring(1));
      lodash.remove(customWords, function(d) {
        return d.index == id.substring(1, 3);
      });
>>>>>>> Add controller tests (#4205)
      self.shouldContinue();
    };

    self.shouldContinue = function() {
      if (self.customWords.length == 12)
        self.selectComplete = true;
      else
        self.selectComplete = false;
    };

    function confirm() {
      self.backupError = false;

      var walletClient = bwcService.getClient();
      var separator = self.useIdeograms ? '\u3000' : ' ';
      var customSentence = lodash.pluck(self.customWords, 'word').join(separator);
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
    };

    function backupError(err) {
      $log.debug('Failed to verify backup: ', err);
      self.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
  });
