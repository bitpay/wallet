'use strict';

angular.module('copayApp.controllers').controller('backupController',
  function($rootScope, $scope, $timeout, backupService, profileService, isMobile, isCordova, notification, go, gettext, gettextCatalog) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.error = null;
    this.success = null;

    var fc = profileService.focusedClient;
    this.isEncrypted = fc.isPrivKeyEncrypted();

    this.downloadWalletBackup = function() {
      var self = this;
      var opts = {
        noSign: $scope.noSign,
      };
      backupService.walletDownload(this.password, opts, function(err) {
        if (err) {
          self.error = true;
          return ;
        }
        $rootScope.$emit('Local/BackupDone');
        notification.success(gettext('Backup created'), gettext('Encrypted backup file saved'));
        go.walletHome();
      });
    };

    this.getBackup = function() {
      var opts = {
        noSign: $scope.noSign,
      };

      var ew = backupService.walletExport(this.password, opts);
      if (!ew) {
        this.error = true;
      } else {
        this.error = false;
      }
      return ew;
    };

    this.viewWalletBackup = function() {
      var self = this;
      $timeout(function() {
        var ew = self.getBackup();
        if (!ew) return;
        self.backupWalletPlainText = ew;
        $rootScope.$emit('Local/BackupDone');
      }, 100);
    };

    this.copyWalletBackup = function() {
      var ew = this.getBackup();
      if (!ew) return;
      window.cordova.plugins.clipboard.copy(ew);
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      $rootScope.$emit('Local/BackupDone');
    };

    this.sendWalletBackup = function() {
      var fc = profileService.focusedClient;
      if (isMobile.Android() || isMobile.Windows()) {
        window.ignoreMobilePause = true;
      }
      window.plugins.toast.showShortCenter(gettextCatalog.getString('Preparing backup...'));
      var name = (fc.credentials.walletName || fc.credentials.walletId);
      if (fc.alias) {
        name = fc.alias + ' [' + name + ']';
      }
      var ew = this.getBackup();
      if (!ew) return;

      if( $scope.noSign) 
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
