'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, $stateParams, $ionicHistory, $ionicNavBarDelegate, gettextCatalog, configService, profileService, fingerprintService, walletService) {
    $ionicNavBarDelegate.title(gettextCatalog.getString('Preferences'));
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    $scope.wallet = wallet;

    $scope.init = function() {
      $scope.externalSource = null;

      if (!wallet)
        return $ionicHistory.goBack();

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

    $scope.encryptChange = function() {
      if (!wallet) return;
      var val = $scope.encryptEnabled;

      if (val && !walletService.isEncrypted(wallet)) {
        $log.debug('Encrypting private key for', wallet.name);
        walletService.encrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // ToDo show error?
            $scope.encryptEnabled = false;
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet encrypted');
            return;
          });
        })
      } else if (!val && walletService.isEncrypted(wallet)) {
        walletService.decrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // ToDo show error?
            $scope.encryptEnabled = true;
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet decrypted');
            return;
          });
        })
      }
    };

    $scope.touchIdChange = function() {
      var newStatus = $scope.touchIdEnabled;
      walletService.setTouchId(wallet, !!newStatus, function(err) {
        if (err) {
          $scope.touchIdEnabled = !newStatus;
          $timeout(function() {
            $scope.$apply();
          }, 1);
          return;
        }
        $log.debug('Touch Id status changed: ' + newStatus);
      });
    };
  });
