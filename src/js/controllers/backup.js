'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, $state, $stateParams, $ionicPopup, $ionicNavBarDelegate, uxLanguage, lodash, fingerprintService, platformInfo, configService, profileService, bwcService, walletService, ongoingProcess, storageService, popupService, gettextCatalog, $ionicModal) {
    var wallet = profileService.getWallet($stateParams.walletId);
    $ionicNavBarDelegate.title(wallet.credentials.walletName);
    $scope.n = wallet.n;
    var keys;

    $scope.credentialsEncrypted = wallet.isPrivKeyEncrypted();

    var isDeletedSeed = function() {
      if (!wallet.credentials.mnemonic && !wallet.credentials.mnemonicEncrypted)
        return true;

      return false;
    };

    $scope.init = function() {
      $scope.deleted = isDeletedSeed();
      if ($scope.deleted) {
        $log.debug('no mnemonics');
        return;
      }

      walletService.getKeys(wallet, function(err, k) {
        if (err || !k) {
          $log.error('Could not get keys: ', err);
          $state.go('wallet.preferences');
          return;
        }
        $scope.credentialsEncrypted = false;
        keys = k;
        $scope.initFlow();
      });
    };

    var shuffledWords = function(words) {
      var sort = lodash.sortBy(words);

      return lodash.map(sort, function(w) {
        return {
          word: w,
          selected: false
        };
      });
    };

    $scope.initFlow = function() {
      if (!keys) return;

      var words = keys.mnemonic;

      $scope.mnemonicWords = words.split(/[\u3000\s]+/);
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.mnemonicHasPassphrase = wallet.mnemonicHasPassphrase();
      $scope.useIdeograms = words.indexOf("\u3000") >= 0;
      $scope.passphrase = '';
      $scope.customWords = [];
      $scope.step = 1;
      $scope.selectComplete = false;
      $scope.backupError = false;

      words = lodash.repeat('x', 300);
      $timeout(function() {
        $scope.$apply();
      }, 10);
    };

    $scope.goBack = function() {
      if ($scope.step == 1) {
        if ($stateParams.fromOnboarding) $state.go('onboarding.backupRequest');
        else $state.go('wallet.preferences');
      } else {
        $scope.goToStep($scope.step - 1);
      }
    };

    var backupError = function(err) {
      ongoingProcess.set('validatingWords', false);
      $log.debug('Failed to verify backup: ', err);
      $scope.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    $ionicModal.fromTemplateUrl('views/includes/confirmBackupPopup.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.openModal = function() {
      $scope.modal.show();
    };
    $scope.closeModal = function() {
      $scope.modal.hide();
    };
    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });

    var openPopup = function() {

      if ($scope.backupError) {
        var title = gettextCatalog.getString('uh oh...');
        var message = gettextCatalog.getString("It's importante that you write your backup phrase down correctly. If something happens to your wallet, you'll need this backup to recover your money Please review your backup and try again");
        popupService.showAlert(title, message, function() {
          $scope.goToStep(1);
        })
      }
      else {
        $scope.openModal();
        $scope.closePopup = function() {
          $scope.closeModal();
          if ($stateParams.fromOnboarding) $state.go('onboarding.disclaimer');
          else {
            $ionicHistory.clearHistory();
            $state.go('tabs.home')
          }
        };
      }
    }

    var confirm = function(cb) {
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
            walletClient.credentials.xPrivKey = lodash.repeat('x', 64);
            return cb(err);
          }

          if (walletClient.credentials.xPrivKey.substr(walletClient.credentials.xPrivKey) != keys.xPrivKey) {
            delete walletClient.credentials;
            return cb('Private key mismatch');
          }
        }

        profileService.setBackupFlag(wallet.credentials.walletId);
        return cb();
      }, 1);
    };

    var finalStep = function() {
      ongoingProcess.set('validatingWords', true);
      confirm(function(err) {
        ongoingProcess.set('validatingWords', false);
        if (err) {
          backupError(err);
        }
        $timeout(function() {
          openPopup();
          return;
        }, 1);
      });
    };

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

  });