'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, backupService, profileService, isMobile, isCordova, notification, go, gettext) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.error = null;
    this.success = null;

    var fc = profileService.focusedClient;
    this.isEncrypted = fc.isPrivKeyEncrypted();

    this.downloadWalletBackup = function() {
      backupService.walletDownload(this.password, function() {
        $rootScope.$emit('Local/BackupDone');
        notification.success(gettext('Backup created'), gettext('Encrypted backup file saved'));
        go.walletHome();
      });
    };

    this.getBackup = function() {
      return backupService.walletExport(this.password);
    };

    this.viewWalletBackup = function() {
      var self = this;
      $timeout(function() {
        self.backupWalletPlainText = self.getBackup();
        $rootScope.$emit('Local/BackupDone');
      }, 100);
    };

    this.copyWalletBackup = function() {
      var ew = this.getBackup();
      window.cordova.plugins.clipboard.copy(ew);
      window.plugins.toast.showShortCenter('Copied to clipboard');
      $rootScope.$emit('Local/BackupDone');
    };

    this.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.toast.showShortCenter('Preparing backup...');
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      if (fc.alias) {
        name = fc.alias + ' [' + name + ']';
      }
      var ew = this.getBackup();
      var properties = {
        subject: 'Copay Wallet Backup: ' + name,
        body: 'Here is the encrypted backup of the wallet ' + name + ': \n\n' + ew + '\n\n To import this backup, copy all text between {...}, including the symbols {}',
        isHtml: false
      };
      $rootScope.$emit('Local/BackupDone');
      window.plugin.email.open(properties);
    };

  });
