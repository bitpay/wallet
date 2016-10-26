'use strict';

angular.module('copayApp.controllers').controller('createController',
  function($scope, $rootScope, $timeout, $log, lodash, $state, $ionicScrollDelegate, $ionicHistory, profileService, configService, gettext, gettextCatalog, ledger, trezor, platformInfo, derivationPathHelper, ongoingProcess, walletService, storageService, popupService) {

    var isChromeApp = platformInfo.isChromeApp;
    var isCordova = platformInfo.isCordova;
    var isDevel = platformInfo.isDevel;

    /* For compressed keys, m*73 + n*34 <= 496 */
    var COPAYER_PAIR_LIMITS = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 4,
      6: 4,
      7: 3,
      8: 3,
      9: 2,
      10: 2,
      11: 1,
      12: 1,
    };

    $scope.init = function(tc) {
      $scope.formData = {};
      var defaults = configService.getDefaults();
      $scope.formData.account = 1;
      $scope.formData.bwsurl = defaults.bws.url;
      $scope.TCValues = lodash.range(2, defaults.limits.totalCopayers + 1);
      $scope.formData.totalCopayers = defaults.wallet.totalCopayers;
      $scope.formData.derivationPath = derivationPathHelper.default;
      $scope.setTotalCopayers(tc);
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
    };

    $scope.showAdvChange = function() {
      $scope.showAdv = !$scope.showAdv;
      $scope.resizeView();
    };

    $scope.resizeView = function() {
      $timeout(function() {
        $ionicScrollDelegate.resize();
      });
      checkPasswordFields();
    };

    function checkPasswordFields() {
      if (!$scope.encrypt) {
        $scope.formData.passphrase = $scope.formData.createPassphrase = $scope.formData.passwordSaved = null;
        $timeout(function() {
          $scope.$apply();
        });
      }
    };

    function updateRCSelect(n) {
      $scope.formData.totalCopayers = n;
      var maxReq = COPAYER_PAIR_LIMITS[n];
      $scope.RCValues = lodash.range(1, maxReq + 1);
      $scope.formData.requiredCopayers = Math.min(parseInt(n / 2 + 1), maxReq);
    };

    function updateSeedSourceSelect(n) {
      var seedOptions = [{
        id: 'new',
        label: gettext('Random'),
      }, {
        id: 'set',
        label: gettext('Specify Recovery Phrase...'),
      }];

      $scope.seedSource = seedOptions[0];

      if (n > 1 && isChromeApp)
        seedOptions.push({
          id: 'ledger',
          label: 'Ledger Hardware Wallet',
        });

      if (isChromeApp || isDevel) {
        seedOptions.push({
          id: 'trezor',
          label: 'Trezor Hardware Wallet',
        });
      }
      $scope.seedOptions = seedOptions;
    };

    $scope.setTotalCopayers = function(tc) {
      $scope.formData.totalCopayers = tc;
      updateRCSelect(tc);
      updateSeedSourceSelect(tc);
    };

    $scope.create = function(form) {
      if (form && form.$invalid) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the required fields'));
        return;
      }

      var opts = {
        name: $scope.formData.walletName,
        m: $scope.formData.requiredCopayers,
        n: $scope.formData.totalCopayers,
        myName: $scope.formData.totalCopayers > 1 ? $scope.formData.myName : null,
        networkName: $scope.formData.testnetEnabled ? 'testnet' : 'livenet',
        bwsurl: $scope.formData.bwsurl,
        singleAddress: $scope.formData.singleAddressEnabled,
        walletPrivKey: $scope.formData._walletPrivKey, // Only for testing
      };

      var setSeed = $scope.seedSource.id == 'set';
      if (setSeed) {

        var words = $scope.formData.privateKey || '';
        if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108) {
          opts.extendedPrivateKey = words;
        } else {
          opts.mnemonic = words;
        }
        opts.passphrase = $scope.formData.passphrase;

        var pathData = derivationPathHelper.parse($scope.formData.derivationPath);
        if (!pathData) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid derivation path'));
          return;
        }

        opts.account = pathData.account;
        opts.networkName = pathData.networkName;
        opts.derivationStrategy = pathData.derivationStrategy;

      } else {
        opts.passphrase = $scope.formData.createPassphrase;
      }

      if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Please enter the wallet recovery phrase'));
        return;
      }

      if ($scope.seedSource.id == 'ledger' || $scope.seedSource.id == 'trezor') {
        var account = $scope.formData.account;
        if (!account || account < 1) {
          popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid account number'));
          return;
        }

        if ($scope.seedSource.id == 'trezor')
          account = account - 1;

        opts.account = account;
        ongoingProcess.set('connecting' + $scope.seedSource.id, true);

        var src = $scope.seedSource.id == 'ledger' ? ledger : trezor;

        src.getInfoForNewWallet(opts.n > 1, account, function(err, lopts) {
          ongoingProcess.set('connecting' + $scope.seedSource.id, false);
          if (err) {
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }
          opts = lodash.assign(lopts, opts);
          _create(opts);
        });
      } else {
        _create(opts);
      }
    };

    function _create(opts) {
      ongoingProcess.set('creatingWallet', true);
      $timeout(function() {
        profileService.createWallet(opts, function(err, client) {
          ongoingProcess.set('creatingWallet', false);
          if (err) {
            $log.warn(err);
            popupService.showAlert(gettextCatalog.getString('Error'), err);
            return;
          }

          walletService.updateRemotePreferences(client, {}, function() {
            $log.debug('Remote preferences saved for:' + client.credentials.walletId)
          });

          if ($scope.seedSource.id == 'set') {
            profileService.setBackupFlag(client.credentials.walletId);
          }

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
            }, 100);
          } else $state.go('tabs.home');
        });
      }, 100);
    }
  });
