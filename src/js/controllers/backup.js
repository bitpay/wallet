'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($scope, $timeout, $log, $state, $stateParams, $ionicHistory, lodash, profileService, bwcService, walletService, ongoingProcess, popupService, gettextCatalog, $ionicModal) {
    $scope.wallet = profileService.getWallet($stateParams.walletId);
    $scope.viewTitle = $scope.wallet.name || $scope.wallet.credentials.walletName;
    $scope.n = $scope.wallet.n;
    var keys;

    $scope.credentialsEncrypted = $scope.wallet.isPrivKeyEncrypted();

    var isDeletedSeed = function() {
      if (!$scope.wallet.credentials.mnemonic && !$scope.wallet.credentials.mnemonicEncrypted)
        return true;

      return false;
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

    $scope.setFlow = function(step) {
      if (!keys) return;

      var words = keys.mnemonic;
      $scope.data = {};

      $scope.mnemonicWords = words.split(/[\u3000\s]+/);
      $scope.shuffledMnemonicWords = shuffledWords($scope.mnemonicWords);
      $scope.mnemonicHasPassphrase = $scope.wallet.mnemonicHasPassphrase();
      $scope.useIdeograms = words.indexOf("\u3000") >= 0;
      $scope.data.passphrase = null;
      $scope.customWords = [];
      $scope.step = step || 1;
      $scope.selectComplete = false;
      $scope.backupError = false;

      words = lodash.repeat('x', 300);
      $timeout(function() {
        $scope.$apply();
      }, 10);
    };

    var backupError = function(err) {
      ongoingProcess.set('validatingWords', false);
      $log.debug('Failed to verify backup: ', err);
      $scope.backupError = true;

      $timeout(function() {
        $scope.$apply();
      }, 1);
    };

    function openConfirmBackupModal() {
      $ionicModal.fromTemplateUrl('views/includes/confirmBackupPopup.html', {
        scope: $scope,
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function(modal) {
        $scope.confirmBackupModal = modal;
        $scope.confirmBackupModal.show();
      });
    };

    var showBackupResult = function() {
      if ($scope.backupError) {
        var title = gettextCatalog.getString('Uh oh...');
        var message = gettextCatalog.getString("It's important that you write your backup phrase down correctly. If something happens to your wallet, you'll need this backup to recover your money. Please review your backup and try again.");
        popupService.showAlert(title, message, function() {
          $scope.setFlow(2);
        })
      } else {
        openConfirmBackupModal();
      }
    };

    $scope.closeBackupResultModal = function() {
      $scope.confirmBackupModal.hide();
      $scope.confirmBackupModal.remove();

      profileService.isDisclaimerAccepted(function(val) {
        if (val) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
        } else $state.go('onboarding.disclaimer', {
          walletId: $stateParams.walletId,
          backedUp: true
        });
      });
    };

    $scope.copyRecoveryPhrase = function() {
      if ($scope.wallet.network == 'livenet') return null;
      else if (!$scope.wallet.credentials.mnemonic) return null;
      else return $scope.wallet.credentials.mnemonic;
    };

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
          var passphrase = $scope.data.passphrase || '';

          try {
            walletClient.seedFromMnemonic(customSentence, {
              network: $scope.wallet.credentials.network,
              passphrase: passphrase,
              account: $scope.wallet.credentials.account
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

        profileService.setBackupFlag($scope.wallet.credentials.walletId);
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
          showBackupResult();
          return;
        }, 1);
      });
    };

    $scope.goToStep = function(n) {
      if (n == 1)
        $scope.setFlow();
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

    $scope.$on("$ionicView.enter", function(event, data) {
      $scope.deleted = isDeletedSeed();
      if ($scope.deleted) {
        $log.debug('no mnemonics');
        return;
      }

      walletService.getKeys($scope.wallet, function(err, k) {
        if (err || !k) {
          $log.error('Could not get keys: ', err);
          $ionicHistory.goBack();
          return;
        }
        $scope.credentialsEncrypted = false;
        keys = k;
        $scope.setFlow();
      });
    });

  });
