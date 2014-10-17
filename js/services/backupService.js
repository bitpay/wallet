'use strict';


var BackupService = function(notification) {
  this.notifications = notification;
};

BackupService.prototype.getName = function(wallet) {
  return (wallet.name ? (wallet.name + '-') : '') + wallet.id;
};

BackupService.prototype.getCopayer = function(wallet) {
  return wallet.totalCopayers > 1 ? wallet.getMyCopayerNickname() : '';
};

BackupService.prototype.getBackup = function(wallet) {
  return wallet.toEncryptedObj();
};

BackupService.prototype.getFilename = function(wallet) {
  var walletName = this.getName(wallet);
  var copayerName = this.getCopayer(wallet);
  return (copayerName ? copayerName + '-' : '') + walletName + '-keybackup.json.aes';
};

BackupService.prototype.download = function(wallet) {
  var ew = this.getBackup(wallet);
  var filename = this.getFilename(wallet);

  this.notifications.success('Backup created', 'Encrypted backup file saved');
  var blob = new Blob([ew], {
    type: 'text/plain;charset=utf-8'
  });
  // show a native save dialog if we are in the shell
  // and pass the wallet to the shell to convert to node Buffer
  if (window.cshell) {
    return window.cshell.send('backup:download', {
      name: walletName,
      wallet: ew
    });
  }

  // throw an email intent if we are in the mobile version
  if (window.cordova) {
    var name = wallet.name ? wallet.name + ' ' : '';
    return window.plugin.email.open({
      subject: 'Copay - ' + name + 'Wallet ' + 'Backup',
      body: 'Here is the encrypted backup of the wallet ' + wallet.id,
      attachments: ['base64:' + filename + '//' + btoa(ew)]
    });
  }

  // otherwise lean on the browser implementation
  saveAs(blob, filename);
};

angular.module('copayApp.services').service('backupService', BackupService);
