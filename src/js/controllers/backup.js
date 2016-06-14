'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, go, lodash, profileService, gettext, bwcService, bwsError, walletService, ongoingProcess) {

    var fc = profileService.focusedClient;
    $scope.customWords = [];
    $scope.walletName = fc.credentials.walletName;

    var handleEncryptedWallet = function(client, cb) {
      if (!walletService.isEncrypted(client)) return cb();
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
    };

    if (fc.isPrivKeyEncrypted() && !isDeletedSeed()) {
      $scope.credentialsEncrypted = true;
      passwordRequest();
    } else {
      if (!isDeletedSeed())
        initWords();
    }

    $scope.init = function() {
      $scope.passphrase = '';
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.customWords = [];
      $scope.step = 1;
      $scope.deleted = isDeletedSeed();
      $scope.credentialsEncrypted = false;
      $scope.selectComplete = false;
      $scope.backupError = false;
    };

    function isDeletedSeed() {
      if (lodash.isEmpty(fc.credentials.mnemonic) && lodash.isEmpty(fc.credentials.mnemonicEncrypted))
        return true;
      return false;
    };

    $scope.backTo = function(state) {
      if (state == 'walletHome')
        go.walletHome();
      else
        go.preferences();
    };

    $scope.goToStep = function(n) {
      if (n == 1)
        $scope.init();
      if (n == 2)
        $scope.step = 2;
      if (n == 3) {
        if (!$scope.mnemonicHasPassphrase)
          finalStep();
        else
          $scope.step = 3;
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
            $scope.step = 4;
            return;
          }, 1);
        });
      };
    };

    function initWords() {
      var words = fc.getMnemonic();
      $scope.xPrivKey = fc.credentials.xPrivKey;
      walletService.lock(fc);
      $scope.mnemonicWords = words.split(/[\u3000\s]+/);
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
      $scope.useIdeograms = words.indexOf("\u3000") >= 0;
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

    $scope.toggle = function() {
      $scope.error = "";

      if ($scope.credentialsEncrypted)
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
              $scope.error = bwsError.msg(err, gettext('Could not decrypt'));
              $log.warn('Error decrypting credentials:', $scope.error); //TODO
              return;
            }

            $scope.credentialsEncrypted = false;
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
      $scope.customWords.push(newWord);
      $scope.shuffledMnemonicWords[index].selected = true;
      $scope.shouldContinue();
    };

    $scope.removeButton = function(index, item) {
      if ($scope.loading) return;
      $scope.customWords.splice(index, 1);
      $scope.shuffledMnemonicWords[item.prevIndex].selected = false;
      $scope.shouldContinue();
    };

    $scope.shouldContinue = function() {
      if ($scope.customWords.length == 12)
        $scope.selectComplete = true;
      else
        $scope.selectComplete = false;
    };

    function confirm(cb) {
      $scope.backupError = false;

      var customWordList = lodash.pluck($scope.customWords, 'word');

      if (!lodash.isEqual($scope.mnemonicWords, customWordList)) {
        return cb('Mnemonic string mismatch');
      }

      $timeout(function() {
        if ($scope.mnemonicHasPassphrase) {
          var walletClient = bwcService.getClient();
          var separator = $scope.useIdeograms ? '\u3000' : ' ';
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

          if (walletClient.credentials.xPrivKey != $scope.xPrivKey) {
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
      $scope.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
  });
