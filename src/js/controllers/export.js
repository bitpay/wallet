'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($rootScope, $scope, $timeout, $log, lodash, backupService, walletService, fingerprintService, configService, storageService, profileService, platformInfo, notification, go, gettext, gettextCatalog) {
    var prevState;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;
    var fc = profileService.focusedClient;
    $scope.isEncrypted = fc.isPrivKeyEncrypted();
    $scope.isCordova = platformInfo.isCordova;
    $scope.isSafari = platformInfo.isSafari;
    $scope.error = null;

    $scope.init = function(state) {
      $scope.supported = true;
      $scope.exportQR = false;
      $scope.noSignEnabled = false;
      $scope.showAdvanced = false;
      prevState = state || 'walletHome';

      fingerprintService.check(fc, function(err) {
        if (err) {
          go.path(prevState);
          return;
        }

        handleEncryptedWallet(fc, function(err) {
          if (err) {
            go.path(prevState);
            return;
          }

          $scope.exportWalletInfo = encodeWalletInfo();
          $timeout(function() {
            $scope.$apply();
          }, 1);
        });
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
      walletService.lock(fc);
    });

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

    function encodeWalletInfo() {
      var c = fc.credentials;
      var derivationPath = fc.credentials.getBaseAddressDerivationPath();
      var encodingType = {
        mnemonic: 1,
        xpriv: 2,
        xpub: 3
      };
      var info;

      $scope.supported = (c.derivationStrategy == 'BIP44' && c.canSign());

      if ($scope.supported) {
        if (c.mnemonic) {
          info = {
            type: encodingType.mnemonic,
            data: c.mnemonic,
          }
        } else {
          info = {
            type: encodingType.xpriv,
            data: c.xPrivKey
          }
        }
      } else {
        /*
          EXPORT WITHOUT PRIVATE KEY - PENDING

        info = {
          type: encodingType.xpub,
          data: c.xPubKey
        }
        */

        return null;
      }

      var code = info.type + '|' + info.data + '|' + c.network.toLowerCase() + '|' + derivationPath + '|' + (c.mnemonicHasPassphrase);
      return code;
    };

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
          go.walletHome();
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
      var fc = profileService.focusedClient;
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      if (fc.alias) {
        name = fc.alias + ' [' + name + ']';
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
