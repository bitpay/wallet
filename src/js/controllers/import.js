'use strict';

angular.module('copayApp.controllers').controller('importController',
  function($scope, $timeout, $log, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, profileService, configService, sjcl, ledger, trezor, derivationPathHelper, platformInfo, bwcService, ongoingProcess, walletService, popupService, gettextCatalog, appConfigService, hwWallet) {

    var reader = new FileReader();
    var defaults = configService.getDefaults();
    var errors = bwcService.getErrors();

    $scope.init = function() {
      $scope.supportsLedger = platformInfo.supportsLedger;
      $scope.supportsTrezor = platformInfo.supportsTrezor;
      $scope.isCordova = platformInfo.isCordova;
      $scope.formData = {};
      $scope.formData.bwsurl = defaults.bws.url;
      $scope.formData.derivationPath = derivationPathHelper.default;
      $scope.formData.account = 1;
      $scope.importErr = false;
      $scope.isCopay = appConfigService.name == 'copay';
      $scope.fromHardwareWallet = { value: false };

      if ($stateParams.code)
        $scope.processWalletInfo($stateParams.code);

      $scope.seedOptions = [];

      if ($scope.supportsLedger) {
        $scope.seedOptions.push({
          id: walletService.externalSource.ledger.id,
          label: walletService.externalSource.ledger.longName,
        });
      }

      if ($scope.supportsTrezor) {
        $scope.seedOptions.push({
          id: walletService.externalSource.trezor.id,
          label: walletService.externalSource.trezor.longName,
        });
        $scope.formData.seedSource = $scope.seedOptions[0];
      }


      $scope.seedOptionsAll = [];

      $scope.seedOptionsAll.push({
        id: walletService.externalSource.ledger.id,
        label: walletService.externalSource.ledger.longName,
      });

      $scope.seedOptionsAll.push({
        id: walletService.externalSource.trezor.id,
        label: walletService.externalSource.trezor.longName,
      });
      $scope.formData.seedSourceAll = $scope.seedOptionsAll[0];


      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.processWalletInfo = function(code) {
      if (!code) return;

      $scope.importErr = false;
      var parsedCode = code.split('|');

      if (parsedCode.length != 5) {
        /// Trying to import a malformed wallet export QR code
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Incorrect code format'));
        return;
      }

      var info = {
        type: parsedCode[0],
        data: parsedCode[1],
        network: parsedCode[2],
        derivationPath: parsedCode[3],
        hasPassphrase: parsedCode[4] == 'true' ? true : false
      };

      if (info.type == 1 && info.hasPassphrase)
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Password required. Make sure to enter your password in advanced options'));

      $scope.formData.derivationPath = info.derivationPath;
      $scope.formData.testnetEnabled = info.network == 'testnet' ? true : false;

      $timeout(function() {
        $scope.formData.words = info.data;
        $scope.$apply();
      }, 1);
    };

    var _importBlob = function(str, opts) {
      var str2, err;
      try {
        str2 = sjcl.decrypt($scope.formData.password, str);
      } catch (e) {
        err = gettextCatalog.getString('Could not decrypt file, check your password');
        $log.warn(e);
      };

      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }

      ongoingProcess.set('importingWallet', true);
      opts.compressed = null;
      opts.password = null;

      $timeout(function() {
        profileService.importWallet(str2, opts, function(err, client) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;

          }
          finish(client);
        });
      }, 100);
    };

    var _importExtendedPrivateKey = function(xPrivKey, opts) {
      ongoingProcess.set('importingWallet', true);
      $timeout(function() {
        profileService.importExtendedPrivateKey(xPrivKey, opts, function(err, client) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            if (err instanceof errors.NOT_AUTHORIZED) {
              $scope.importErr = true;
            } else {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
            return $timeout(function() {
              $scope.$apply();
            });
          }
          finish(client);
        });
      }, 100);
    };

    /*
      IMPORT FROM PUBLIC KEY - PENDING

    var _importExtendedPublicKey = function(xPubKey, opts) {
      ongoingProcess.set('importingWallet', true);
      $timeout(function() {
        profileService.importExtendedPublicKey(opts, function(err, walletId) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            $scope.error = err;
            return $timeout(function() {
              $scope.$apply();
            });
          }

          profileService.setBackupFlag(walletId);
           if ($stateParams.fromOnboarding) {
             profileService.setDisclaimerAccepted(function(err) {
               if (err) $log.error(err);
             });
           }

          $state.go('tabs.home');
        });
      }, 100);
    };
    */

    var _importMnemonic = function(words, opts) {
      ongoingProcess.set('importingWallet', true);

      $timeout(function() {
        profileService.importMnemonic(words, opts, function(err, client) {

          ongoingProcess.set('importingWallet', false);

          if (err) {
            if (err instanceof errors.NOT_AUTHORIZED) {
              $scope.importErr = true;
            } else {
              popupService.showAlert(gettextCatalog.getString('Error'), err);
            }
            return $timeout(function() {
              $scope.$apply();
            });
          }
          finish(client);
        });
      }, 100);
    };

    $scope.setDerivationPath = function() {
      $scope.formData.derivationPath = $scope.formData.testnetEnabled ? derivationPathHelper.defaultTestnet : derivationPathHelper.default;
    };

    $scope.getFile = function() {
      // If we use onloadend, we need to check the readyState.
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          var opts = {};
          opts.bwsurl = $scope.formData.bwsurl;
          _importBlob(evt.target.result, opts);
        }
      }
    };

    $scope.importBlob = function(form) {
      if (form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('There is an error in the form'));
        return;
      }

      var backupFile = $scope.formData.file;
      var backupText = $scope.formData.backupText;
      var password = $scope.formData.password;

      if (!backupFile && !backupText) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please, select your backup file'));
        return;
      }

      if (backupFile) {
        reader.readAsBinaryString(backupFile);
      } else {
        var opts = {};
        opts.bwsurl = $scope.formData.bwsurl;
        _importBlob(backupText, opts);
      }
    };

    $scope.importMnemonic = function(form) {
      if (form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('There is an error in the form'));
        return;
      }

      var opts = {};

      if ($scope.formData.bwsurl)
        opts.bwsurl = $scope.formData.bwsurl;

      var pathData = derivationPathHelper.parse($scope.formData.derivationPath);

      if (!pathData) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
        return;
      }

      opts.account = pathData.account;
      opts.networkName = pathData.networkName;
      opts.derivationStrategy = pathData.derivationStrategy;

      var words = $scope.formData.words || null;

      if (!words) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the recovery phrase'));
        return;
      } else if (words.indexOf('xprv') == 0 || words.indexOf('tprv') == 0) {
        return _importExtendedPrivateKey(words, opts);
      } else if (words.indexOf('xpub') == 0 || words.indexOf('tpuv') == 0) {
        return _importExtendedPublicKey(words, opts);
      } else {
        var wordList = words.split(/[\u3000\s]+/);

        if ((wordList.length % 3) != 0) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Wrong number of recovery words: ') + wordList.length);
          return;
        }
      }

      opts.passphrase = $scope.formData.passphrase || null;

      if ($scope.fromHardwareWallet.value) {
        $log.debug('Importing seed from hardware wallet');
        $log.warn('This wont work for Intel TEE wallets');

        var id = $scope.formData.seedSourceAll.id;
        var isMultisig = opts.derivationStrategy =='BIP48';
        var account = opts.account;
        opts.entropySourcePath = 'm/' + hwWallet.getEntropyPath(id, isMultisig, account);
      }

      _importMnemonic(words, opts);
    };

    $scope.importTrezor = function(account, isMultisig) {
      trezor.getInfoForNewWallet(isMultisig, account, 'livenet', function(err, lopts) {
        ongoingProcess.clear();
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        lopts.externalSource = walletService.externalSource.trezor.id;
        lopts.bwsurl = $scope.formData.bwsurl;
        lopts.account = account;
        ongoingProcess.set('importingWallet', true);
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, wallet) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          finish(wallet);
        });
      }, 100);
    };

    $scope.importHW = function(form) {
      if (form.$invalid || $scope.formData.account < 0) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('There is an error in the form'));
        return;
      }

      $scope.importErr = false;

      var account = $scope.formData.account;

      if ($scope.formData.seedSource.id == walletService.externalSource.trezor.id) {
        if (account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
          return;
        }
        account = account - 1;
      }

      switch ($scope.formData.seedSource.id) {
        case (walletService.externalSource.ledger.id):
          ongoingProcess.set('connectingledger', true);
          $scope.importLedger(account);
          break;
        case (walletService.externalSource.trezor.id):
          ongoingProcess.set('connectingtrezor', true);
          $scope.importTrezor(account, $scope.formData.isMultisig);
          break;
        default:
          throw ('Error: bad source id');
      };
    };

    $scope.importLedger = function(account) {
      ledger.getInfoForNewWallet(true, account, 'livenet', function(err, lopts) {
        ongoingProcess.clear();
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }

        lopts.externalSource = lopts.externalSource = walletService.externalSource.ledger.id;
        lopts.bwsurl = $scope.formData.bwsurl;
        lopts.account = account;
        ongoingProcess.set('importingWallet', true);
        $log.debug('Import opts', lopts);

        profileService.importExtendedPublicKey(lopts, function(err, wallet) {
          ongoingProcess.set('importingWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          finish(wallet);
        });
      }, 100);
    };

    var finish = function(wallet) {
      walletService.updateRemotePreferences(wallet);

      profileService.setBackupFlag(wallet.credentials.walletId);
      if ($stateParams.fromOnboarding) {
        profileService.setDisclaimerAccepted(function(err) {
          if (err) $log.error(err);
        });
      }
      $ionicHistory.removeBackView();
      $state.go('tabs.home', {
        fromOnboarding: $stateParams.fromOnboarding
      });
    };

    $scope.showAdvChange = function() {
      $scope.showAdv = !$scope.showAdv;
      $timeout(function() {
        $scope.resizeView();
      }, 100);
    };

    $scope.resizeView = function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 10);
    };

    $scope.$on("$ionicView.afterEnter", function(event, data) {
      $scope.showAdv = false;
      $scope.init();
    });

  });
