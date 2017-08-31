'use strict';

angular.module('copayApp.controllers').controller('preferencesController',
  function($scope, $rootScope, $timeout, $log, $ionicHistory, configService, profileService, fingerprintService, walletService, platformInfo, externalLinkService, gettextCatalog) {
    var wallet;
    var walletId;

    $scope.hiddenBalanceChange = function() {
      var opts = {
        balance: {
          enabled: $scope.hiddenBalance.value
        }
      };
      profileService.toggleHideBalanceFlag(walletId, function(err) {
        if (err) $log.error(err);
      });
    };

    $scope.encryptChange = function() {
      if (!wallet) return;
      var val = $scope.encryptEnabled.value;

      if (val && !walletService.isEncrypted(wallet)) {
        $log.debug('Encrypting private key for', wallet.name);
        walletService.encrypt(wallet, function(err) {
          if (err) {
            $log.warn(err);

            // ToDo show error?
            $scope.encryptEnabled.value = false;
            $timeout(function() {
              $scope.$apply();
            });
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
            $scope.encryptEnabled.value = true;
            $timeout(function() {
              $scope.$apply();
            });
            return;
          }
          profileService.updateCredentials(JSON.parse(wallet.export()), function() {
            $log.debug('Wallet decrypted');
            return;
          });
        })
      }
    };

    $scope.openWikiSpendingPassword = function() {
      var url = 'https://github.com/bitpay/copay/wiki/COPAY---FAQ#what-the-spending-password-does';
      var optIn = true;
      var title = null;
      var message = gettextCatalog.getString('Read more in our Wiki');
      var okText = gettextCatalog.getString('Open');
      var cancelText = gettextCatalog.getString('Go Back');
      externalLinkService.open(url, optIn, title, message, okText, cancelText);
    };

    $scope.touchIdChange = function() {
      var newStatus = $scope.touchIdEnabled.value;
      walletService.setTouchId(wallet, !!newStatus, function(err) {
        if (err) {
          $scope.touchIdEnabled.value = !newStatus;
          $timeout(function() {
            $scope.$apply();
          }, 1);
          return;
        }
        $log.debug('Touch Id status changed: ' + newStatus);
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      wallet = profileService.getWallet(data.stateParams.walletId);
      walletId = wallet.credentials.walletId;
      $scope.wallet = wallet;
      $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
      $scope.externalSource = null;

      if (!wallet)
        return $ionicHistory.goBack();

      var config = configService.getSync();

      $scope.hiddenBalance = {
        value: $scope.wallet.balanceHidden
      };

      $scope.encryptEnabled = {
        value: walletService.isEncrypted(wallet)
      };

      $scope.touchIdAvailable = fingerprintService.isAvailable();
      $scope.touchIdEnabled = {
        value: config.touchIdFor ? config.touchIdFor[walletId] : null
      };

      $scope.deleted = false;
      if (wallet.credentials && !wallet.credentials.mnemonicEncrypted && !wallet.credentials.mnemonic) {
        $scope.deleted = true;
      }
    });
  });
