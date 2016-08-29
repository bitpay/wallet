'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, $stateParams, configService, profileService, fingerprintService, walletService, $state) {

    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    $scope.wallet = wallet;

    $scope.init = function() {
      $scope.externalSource = null;

      if (!wallet) 
        return $state.go('tabs.home');

      var config = configService.getSync();
      config.aliasFor = config.aliasFor || {};
      $scope.alias = config.aliasFor[walletId] || wallet.credentials.walletName;
      $scope.color = config.colorFor[walletId] || '#4A90E2';

      $scope.encryptEnabled = walletService.isEncrypted(wallet);
      if (wallet.isPrivKeyExternal)
        $scope.externalSource = wallet.getPrivKeyExternalSourceName() == 'ledger' ? 'Ledger' : 'Trezor';

      $scope.touchIdAvailable = fingerprintService.isAvailable();
      $scope.touchIdEnabled = config.touchIdFor ? config.touchIdFor[walletId] : null;

      $scope.deleted = false;
      if (wallet.credentials && !wallet.credentials.mnemonicEncrypted && !wallet.credentials.mnemonic) {
        $scope.deleted = true;
      }
    };

    var handleEncryptedWallet = function(cb) {
      $rootScope.$emit('Local/NeedsPassword', false, function(err, password) {
        if (err) return cb(err);
        return cb(walletService.unlock(wallet, password));
      });
    };

    $scope.encryptChange = function() {
      if (!wallet) return;
      var val = $scope.encryptEnabled;

      var setPrivateKeyEncryption = function(password, cb) {
        $log.debug('Encrypting private key for', wallet.credentials.walletName);

        wallet.setPrivateKeyEncryption(password);
        wallet.lock();
        profileService.updateCredentials(JSON.parse(wallet.export()), function() {
          $log.debug('Wallet encrypted');
          return cb();
        });
      };

      var disablePrivateKeyEncryption = function(cb) {
        $log.debug('Disabling private key encryption for', wallet.credentials.walletName);

        try {
          wallet.disablePrivateKeyEncryption();
        } catch (e) {
          return cb(e);
        }
        profileService.updateCredentials(JSON.parse(wallet.export()), function() {
          $log.debug('Wallet encryption disabled');
          return cb();
        });
      };

      if (val && !walletService.isEncrypted(wallet)) {
        $rootScope.$emit('Local/NeedsPassword', true, function(err, password) {
          if (err || !password) {
            $scope.encryptEnabled = false;
            return;
          }
          setPrivateKeyEncryption(password, function() {
            $rootScope.$emit('Local/NewEncryptionSetting');
            $scope.encryptEnabled = true;
          });
        });
      } else {
        if (!val && walletService.isEncrypted(wallet)) {
          handleEncryptedWallet(function(err) {
            if (err) {
              $scope.encryptEnabled = true;
              return;
            }
            disablePrivateKeyEncryption(function(err) {
              $rootScope.$emit('Local/NewEncryptionSetting');
              if (err) {
                $scope.encryptEnabled = true;
                $log.error(err);
                return;
              }
              $scope.encryptEnabled = false;
            });
          });
        }
      }
    };

    $scope.touchIdChange = function() {
      var newStatus = $scope.touchIdEnabled;
      walletService.setTouchId(wallet, newStatus, function(err) {
        if (err) {
          $log.warn(err);
          $scope.touchIdEnabled = !newStatus;
          return;
        }
        $log.debug('Touch Id status changed: ' + newStatus);
      });
    };
  });
