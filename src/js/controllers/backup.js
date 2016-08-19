'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, $state, $stateParams, lodash, fingerprintService, platformInfo, configService, profileService, gettext, bwcService, walletService, ongoingProcess) {

    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.customWords = [];
    $scope.walletName = wallet.credentials.walletName;
    $scope.credentialsEncrypted = wallet.isPrivKeyEncrypted;

    $scope.init = function() {
      $scope.step = 1;
      $scope.deleted = isDeletedSeed();
      if ($scope.deleted) return;

      fingerprintService.check(wallet, function(err) {
        if (err) {
          $state.go('preferences');
          return;
        }

        handleEncryptedWallet(wallet, function(err) {
          if (err) {
            $log.warn('Error decrypting credentials:', $scope.error);
            $state.go('preferences');
            return;
          }
          $scope.credentialsEncrypted = false;
          $scope.initFlow();
        });
      });
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

    $scope.initFlow = function() {
      var words = wallet.getMnemonic();
      $scope.xPrivKey = wallet.credentials.xPrivKey;
      $scope.mnemonicWords = words.split(/[\u3000\s]+/);
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.mnemonicHasPassphrase = wallet.mnemonicHasPassphrase();
      $scope.useIdeograms = words.indexOf("\u3000") >= 0;
      $scope.passphrase = '';
      $scope.customWords = [];
      $scope.step = 1;
      $scope.selectComplete = false;
      $scope.backupError = false;

      $timeout(function() {
        $scope.$apply();
      }, 10);
    };

    function isDeletedSeed() {
      if (lodash.isEmpty(wallet.credentials.mnemonic) && lodash.isEmpty(wallet.credentials.mnemonicEncrypted))
        return true;
      return false;
    };

    $scope.$on('$destroy', function() {
      walletService.lock(wallet);
    });

    $scope.goToStep = function(n) {
      if (n == 1)
        $scope.initFlow();
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
      if ($scope.customWords.length == $scope.shuffledMnemonicWords.length)
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
              network: wallet.credentials.network,
              passphrase: passphrase,
              account: wallet.credentials.account
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

    function handleEncryptedWallet(client, cb) {
      if (!walletService.isEncrypted(client)) {
        $scope.credentialsEncrypted = false;
        return cb();
      }

      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(client, password));
      });
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
