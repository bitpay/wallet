'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($rootScope, $scope, $timeout, $log, backupService, fingerprintService, configService, storageService, profileService, platformInfo, notification, go, gettext, gettextCatalog) {
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;
    var isCordova = platformInfo.isCordova;
    var fc = profileService.focusedClient;
    $scope.isEncrypted = fc.isPrivKeyEncrypted();
    $scope.error = null;
    $scope.success = null;

    $scope.init = function(state) {
      if (!isCordova) return;

      var config = configService.getSync();
      var touchidAvailable = fingerprintService.isAvailable();
      var touchidEnabled = config.touchIdFor ? config.touchIdFor[fc.credentials.walletId] : null;

      if (!touchidAvailable || !touchidEnabled) return;

      fingerprintService.check(fc, function(err) {
        if (err)
          go.path(state || 'walletHome');
      });
    };

    $scope.downloadWalletBackup = function() {
      $scope.getMetaData($scope.metaDataEnabled, function(err, txsFromLocal, localAddressBook) {
        if (err) {
          $scope.error = true;
          return;
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          historyCache: txsFromLocal,
          addressBook: localAddressBook
        };

        backupService.walletDownload($scope.password, opts, function(err) {
          if (err) {
            $scope.error = true;
            return;
          }
          $rootScope.$emit('Local/BackupDone');
          notification.success(gettext('Success'), gettext('Encrypted export file saved'));
          go.walletHome();
        });
      });
    };

    $scope.getMetaData = function(metaData, cb) {
      if (metaData == false) return cb();
      $scope.getHistoryCache(function(err, txsFromLocal) {
        if (err) return cb(err);

        $scope.getAddressbook(function(err, localAddressBook) {
          if (err) return cb(err);

          return cb(null, txsFromLocal, localAddressBook)
        });
      });
    };

    $scope.getHistoryCache = function(cb) {
      storageService.getTxHistory(fc.credentials.walletId, function(err, txs) {
        if (err) return cb(err);

        var localTxs = [];

        try {
          localTxs = JSON.parse(txs);
        } catch (ex) {
          $log.warn(ex);
        }
        if (!localTxs[0]) return cb(null, null);

        return cb(null, localTxs);
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
      $scope.getMetaData($scope.metaDataEnabled, function(err, txsFromLocal, localAddressBook) {
        if (err) {
          $scope.error = true;
          return cb(null);
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          historyCache: txsFromLocal,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport($scope.password, opts);
        if (!ew) {
          $scope.error = true;
        } else {
          $scope.error = false;
          $rootScope.$emit('Local/BackupDone');
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
