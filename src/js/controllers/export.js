'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($rootScope, $scope, $timeout, $log, lodash, backupService, walletService, storageService, profileService, platformInfo, notification, gettext, gettextCatalog, $state, $stateParams) {
    var prevState;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;

    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.isEncrypted = wallet.isPrivKeyEncrypted();
    $scope.isCordova = platformInfo.isCordova;
    $scope.isSafari = platformInfo.isSafari;
    $scope.error = null;

    $scope.init = function() {
      $scope.supported = true;
      $scope.exportQR = false;
      $scope.noSignEnabled = false;
      $scope.showAdvanced = false;
      $scope.wallet = wallet;
      $scope.canSign = wallet.canSign();

      walletService.getEncodedWalletInfo(wallet, function(err, code) {
        if (err) {
          $log.warn(err);
          return $state.go('wallet.preferencesAdvanced')
        }

        if (!code)
          $scope.supported = false;
        else
          $scope.exportWalletInfo = code;

        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    };

    /*
      EXPORT WITHOUT PRIVATE KEY - PENDING

    $scope.noSignEnabledChange = function() {
      $scope.exportWalletInfo = encodeWalletInfo();
      $timeout(function() {
        $scope.$apply();
      }, 1);
    };
    */

    $scope.$on('$destroy', function() {
      walletService.lock(wallet);
    });

    $scope.downloadWalletBackup = function() {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          $scope.error = true;
          return;
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          addressBook: localAddressBook
        };

        backupService.walletDownload($scope.password, opts, function(err) {
          if (err) {
            $scope.error = true;
            return;
          }
          notification.success(gettext('Success'), gettext('Encrypted export file saved'));
          $state.go('tabs.home');
        });
      });
    };

    $scope.getAddressbook = function(cb) {
      storageService.getAddressbook(fc.credentials.network, function(err, addressBook) {
        if (err) return cb(err);

        var localAddressBook = [];
        try {
          localAddressBook = JSON.parse(addressBook);
        } catch (ex) {
          $log.warn(ex);
        }

        return cb(null, localAddressBook);
      });
    };

    $scope.getBackup = function(cb) {
      $scope.getAddressbook(function(err, localAddressBook) {
        if (err) {
          $scope.error = true;
          return cb(null);
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport($scope.password, opts);
        if (!ew) {
          $scope.error = true;
        } else {
          $scope.error = false;
        }
        return cb(ew);
      });
    };

    $scope.viewWalletBackup = function() {
      $timeout(function() {
        $scope.getBackup(function(backup) {
          var ew = backup;
          if (!ew) return;
          $scope.backupWalletPlainText = ew;
        });
      }, 100);
    };

    $scope.copyWalletBackup = function() {
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;
        window.cordova.plugins.clipboard.copy(ew);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      });
    };

    $scope.sendWalletBackup = function() {
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (wallet.credentials.walletName || wallet.credentials.walletId);
      if (wallet.alias) {
        name = wallet.alias + ' [' + name + ']';
      }
      $scope.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;

        if ($scope.noSignEnabled)
          name = name + '(No Private Key)';

        var subject = 'Copay Wallet Backup: ' + name;
        var body = 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}';
        window.plugins.socialsharing.shareViaEmail(
          body,
          subject,
          null, // TO: must be null or an array
          null, // CC: must be null or an array
          null, // BCC: must be null or an array
          null, // FILES: can be null, a string, or an array
          function() {},
          function() {}
        );
      });
    };

  });
