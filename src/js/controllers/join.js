'use strict';

angular.module('copayApp.controllers').controller('joinController',
  function($scope, $rootScope, $timeout, $state, $ionicHistory, $ionicScrollDelegate, profileService, configService, storageService, applicationService, gettextCatalog, lodash, ledger, trezor, intelTEE, derivationPathHelper, ongoingProcess, walletService, $log, $stateParams, popupService, appConfigService) {

    $scope.init = function() {
      var defaults = configService.getDefaults();
      $scope.bwsurl = defaults.bws.url;
      $scope.derivationPath = derivationPathHelper.default;
      $scope.account = 1;
      $scope.formData = {};
      resetPasswordFields();
      updateSeedSourceSelect();
      $scope.setSeedSource();
    };

    $scope.showAdvChange = function() {
      $scope.showAdv = !$scope.showAdv;
      $scope.encrypt = null;
      $scope.resizeView();
    };

    $scope.checkPassword = function(pw1, pw2) {
      if (pw1 && pw1.length > 0) {
        if (pw2 && pw2.length > 0) {
          if (pw1 == pw2) $scope.result = 'correct';
          else {
            $scope.formData.passwordSaved = null;
            $scope.result = 'incorrect';
          }
        } else
          $scope.result = null;
      } else
        $scope.result = null;
    };

    $scope.resizeView = function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 10);
      resetPasswordFields();
    };

    function resetPasswordFields() {
      $scope.formData.passphrase = $scope.formData.createPassphrase = $scope.formData.passwordSaved = $scope.formData.repeatpassword = $scope.result = null;
      $timeout(function() {
        $scope.$apply();
      });
    };

    $scope.onQrCodeScannedJoin = function(data) {
      $scope.secret = data;
      if ($scope.formData) {
        $scope.formData.secret.$setViewValue(data);
        $scope.formData.secret.$render();
      }
    };

    if ($stateParams.url) {
      var data = $stateParams.url;
      data = data.replace('copay:', '');
      $scope.onQrCodeScannedJoin(data);
    }

    function updateSeedSourceSelect() {
      $scope.seedOptions = [{
        id: 'new',
        label: gettextCatalog.getString('Random'),
      }, {
        id: 'set',
        label: gettextCatalog.getString('Specify Recovery Phrase...'),
      }];
      $scope.seedSource = $scope.seedOptions[0];
      /*

      Disable Hardware Wallets

      */

      if (appConfigService.name == 'copay') {
        if (walletService.externalSource.ledger.supported) {
          $scope.seedOptions.push({
            id: walletService.externalSource.ledger.id,
            label: walletService.externalSource.ledger.longName
          });
        }

        if (walletService.externalSource.trezor.supported) {
          $scope.seedOptions.push({
            id: walletService.externalSource.trezor.id,
            label: walletService.externalSource.trezor.longName
          });
        }

        if (walletService.externalSource.intelTEE.supported) {
          $scope.seedOptions.push({
            id: walletService.externalSource.intelTEE.id,
            label: walletService.externalSource.intelTEE.longName
          });
        }
      }
    };

    $scope.setSeedSource = function() {
      $scope.seedSourceId = $scope.seedSource.id;

      $timeout(function() {
        $rootScope.$apply();
      });
    };

    $scope.join = function() {

      if ($scope.formData && $scope.formData.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the required fields'));
        return;
      }

      var opts = {
        secret: $scope.formData.secret.$modelValue,
        myName: $scope.formData.myName.$modelValue,
        bwsurl: $scope.bwsurl
      }

      var setSeed = $scope.seedSourceId == 'set';
      if (setSeed) {
        var words = $scope.formData.privateKey.$modelValue;
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = $scope.formData.passphrase ? $scope.formData.passphrase.$modelValue : null;

        var pathData = derivationPathHelper.parse($scope.derivationPath);
        if (!pathData) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
          return;
        }
        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;
      } else {
        opts.passphrase = $scope.formData.createPassphrase ? $scope.formData.createPassphrase.$modelValue : null;
      }

      opts.walletPrivKey = $scope._walletPrivKey; // Only for testing


      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase'));
        return;
      }

      if ($scope.seedSourceId == walletService.externalSource.ledger.id || $scope.seedSourceId == walletService.externalSource.trezor.id || $scope.seedSourceId == walletService.externalSource.intelTEE.id) {
        var account = $scope.account;
        if (!account || account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
          return;
        }

        if ($scope.seedSourceId == walletService.externalSource.trezor.id || $scope.seedSourceId == walletService.externalSource.intelTEE.id)
          account = account - 1;

        opts.account = account;
        opts.isMultisig = true;
        ongoingProcess.set('connecting' + $scope.seedSourceId, true);

        var src;
        switch ($scope.seedSourceId) {
          case walletService.externalSource.ledger.id:
            src = ledger;
            break;
          case walletService.externalSource.trezor.id:
            src = trezor;
            break;
          case walletService.externalSource.intelTEE.id:
            src = intelTEE;
            break;
          default:
            popupService.showAlert(gettextCatalog.getString('Error'), 'Invalid seed source id');
            return;
        }

        // TODO: cannot currently join an intelTEE testnet wallet (need to detect from the secret)
        src.getInfoForNewWallet(true, account, 'livenet', function(err, lopts) {
          ongoingProcess.set('connecting' + $scope.seedSourceId, false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          opts = lodash.assign(lopts, opts);
          _join(opts);
        });
      } else {

        _join(opts);
      }
    };

    function _join(opts) {
      ongoingProcess.set('joiningWallet', true);
      $timeout(function() {
        profileService.joinWallet(opts, function(err, client) {
          ongoingProcess.set('joiningWallet', false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client);
          $ionicHistory.removeBackView();

          if (!client.isComplete()) {
            $ionicHistory.nextViewOptions({
              disableAnimate: true
            });
            $state.go('tabs.home');
            $timeout(function() {
              $state.transitionTo('tabs.copayers', {
                walletId: client.credentials.walletId
              });
            });
          } else $state.go('tabs.home');
        });
      });
    };
  });
