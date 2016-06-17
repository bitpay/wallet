'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($scope, $timeout, $log, backupService, fingerprintService, configService, storageService, profileService, platformInfo, notification, go, gettext, gettextCatalog) {
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;

    $scope.error = null;
    $scope.success = null;
    var fc = profileService.focusedClient;
    $scope.isEncrypted = fc.isPrivKeyEncrypted();
    $scope.touchidSuccess = null;
    $scope.touchidEnabled = null;
    $scope.error = null;

    $scope.init = function(state) {
      if (!isCordova) return;

      var config = configService.getSync();
      var touchidAvailable = fingerprintService.isAvailable();
      var touchidEnabled = $scope.touchidEnabled = config.touchIdFor ? config.touchIdFor[fc.credentials.walletId] : null;

      if (!touchidAvailable || !touchidEnabled) return;

      fingerprintService.check(fc, function(err) {
        if (err)
          go.path(state || 'walletHome');

        $scope.touchidSuccess = true;
        $timeout(function() {
          $scope.$apply();
        }, 10);
      });
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
