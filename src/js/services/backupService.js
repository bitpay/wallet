'use strict';

var BackupService = function($rootScope, notification) {
  this.$rootScope = $rootScope;
  this.notifications = notification;
};

BackupService.prototype.getCopayer = function(wallet) {
  return wallet.totalCopayers > 1 ? wallet.getMyCopayerNickname() : '';
};





BackupService.prototype._download = function(ew, walletName, filename) {

  var NewBlob = function(data, datatype) {
    var out;

    try {
      out = new Blob([data], {
        type: datatype
      });
      console.debug("case 1");
    } catch (e) {
      window.BlobBuilder = window.BlobBuilder ||
        window.WebKitBlobBuilder ||
        window.MozBlobBuilder ||
        window.MSBlobBuilder;

      if (e.name == 'TypeError' && window.BlobBuilder) {
        var bb = new BlobBuilder();
        bb.append(data);
        out = bb.getBlob(datatype);
        console.debug("case 2");
      } else if (e.name == "InvalidStateError") {
        // InvalidStateError (tested on FF13 WinXP)
        out = new Blob([data], {
          type: datatype
        });
        console.debug("case 3");
      } else {
        // We're screwed, blob constructor unsupported entirely   
        console.debug("Errore");
      }
    }
    return out;
  };

  var blob;

  blob = new NewBlob(ew, 'text/plain;charset=utf-8');


  this.notifications.success('Backup created', 'Encrypted backup file saved');

  // otherwise lean on the browser implementation
  saveAs(blob, filename);
};

BackupService.prototype.walletEncrypted = function(wallet) {
  return wallet.exportEncrypted(this.$rootScope.iden.password);
}

BackupService.prototype.walletDownload = function(wallet) {
  var ew = this.walletEncrypted(wallet);
  var walletName = wallet.getName();
  var copayerName = this.getCopayer(wallet);
  var filename = (copayerName ? copayerName + '-' : '') + walletName + '-keybackup.json.aes';
  this._download(ew, walletName, filename)
};

BackupService.prototype.profileEncrypted = function(iden) {
  iden.setBackupNeeded(false);
  return iden.exportEncryptedWithWalletInfo(iden.password);
}

BackupService.prototype.profileDownload = function(iden) {
  var ew = this.profileEncrypted(iden);
  var name = iden.fullName;
  var filename = name + '-profile.json';
  this._download(ew, name, filename)
};

angular.module('copayApp.services').service('backupService', BackupService);
