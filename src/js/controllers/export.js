'use strict';

angular.module('copayApp.controllers').controller('exportController',
  function($rootScope, $scope, $timeout, $log, backupService, storageService, profileService, platformInfo, notification, go, gettext, gettextCatalog) {
    var self = this;
    var isWP = platformInfo.isWP;
    var isAndroid = platformInfo.isAndroid;

    self.error = null;
    self.success = null;
    $scope.metaDataEnabled = true;
    var fc = profileService.focusedClient;
    self.isEncrypted = fc.isPrivKeyEncrypted();

    self.downloadWalletBackup = function() {
      self.getMetaData($scope.metaDataEnabled, function(err, txsFromLocal, localAddressBook) {
        if (err) {
          self.error = true;
          return;
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          historyCache: txsFromLocal,
          addressBook: localAddressBook
        };

        backupService.walletDownload(self.password, opts, function(err) {
          if (err) {
            self.error = true;
            return;
          }
          $rootScope.$emit('Local/BackupDone');
          notification.success(gettext('Success'), gettext('Encrypted export file saved'));
          go.walletHome();
        });
      });
    };

    self.getMetaData = function(metaData, cb) {
      if (metaData == false) return cb();
      self.getHistoryCache(function(err, txsFromLocal) {
        if (err) return cb(err);

        self.getAddressbook(function(err, localAddressBook) {
          if (err) return cb(err);

          return cb(null, txsFromLocal, localAddressBook)
        });
      });
    }

    self.getHistoryCache = function(cb) {
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
    }

    self.getAddressbook = function(cb) {
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
    }

    self.getBackup = function(cb) {
      self.getMetaData($scope.metaDataEnabled, function(err, txsFromLocal, localAddressBook) {
        if (err) {
          self.error = true;
          return cb(null);
        }
        var opts = {
          noSign: $scope.noSignEnabled,
          historyCache: txsFromLocal,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport(self.password, opts);
        if (!ew) {
          self.error = true;
        } else {
          self.error = false;
          $rootScope.$emit('Local/BackupDone');
        }
        return cb(ew);
      });
    }

    self.viewWalletBackup = function() {
      var self = this;
      $timeout(function() {
        self.getBackup(function(backup) {
          var ew = backup;
          if (!ew) return;
          self.backupWalletPlainText = ew;
        });
      }, 100);
    };

    self.copyWalletBackup = function() {
      self.getBackup(function(backup) {
        var ew = backup;
        if (!ew) return;
        window.cordova.plugins.clipboard.copy(ew);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      });
    };

    self.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      if (isAndroid || isWP) {
        window.ignoreMobilePause = true;
      }
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      if (fc.alias) {
        name = fc.alias + ' [' + name + ']';
      }
      self.getBackup(function(backup) {
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
