'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, $log, backupService, storageService, profileService, isMobile, notification, go, gettext, gettextCatalog) {
    var self = this;

    self.error = null;
    self.success = null;

    var fc = profileService.focusedClient;
    self.isEncrypted = fc.isPrivKeyEncrypted();

    self.downloadWalletBackup = function() {
      self.getMetaData(function(err, txsFromLocal, localAddressBook) {
        if (err) {
          self.error = true;
          return;
        }
        var opts = {
          noSign: $scope.noSign,
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

    self.getMetaData = function(cb) {
      self.getHistoryCache(function(err, txsFromLocal) {
        if (err) {
          return cb(err);
        }
        self.getAddressbook(function(err, localAddressBook) {
          if (err) {
            return cb(err);
          }
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

    self.getBackup = function() {
      self.getMetaData(function(err, txsFromLocal, localAddressBook) {
        if (err) {
          self.error = true;
          return;
        }
        var opts = {
          noSign: $scope.noSign,
          historyCache: txsFromLocal,
          addressBook: localAddressBook
        };

        var ew = backupService.walletExport(self.password, opts);
        if (!ew) {
          self.error = true;
        } else {
          self.error = false;
        }
        return ew;
      });
    }

    self.viewWalletBackup = function() {
      var self = this;
      $timeout(function() {
        var ew = self.getBackup();
        if (!ew) return;
        self.backupWalletPlainText = ew;
        $rootScope.$emit('Local/BackupDone');
      }, 100);
    };

    self.copyWalletBackup = function() {
      var ew = self.getBackup();
      if (!ew) return;
      window.cordova.plugins.clipboard.copy(ew);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      $rootScope.$emit('Local/BackupDone');
    };

    self.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      if (fc.alias) {
        name = fc.alias + ' [' + name + ']';
      }
      var ew = self.getBackup();
      if (!ew) return;

      if ($scope.noSign)
        name = name + '(No Private Key)';

      var properties = {
        subject: 'Copay Wallet Backup: ' + name,
        body: 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}',
        isHtml: false
      };
      $rootScope.$emit('Local/BackupDone');
      window.plugin.email.open(properties);
    };

  });