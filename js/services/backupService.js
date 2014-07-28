'use strict';


var BackupService = function(notification) {
  this.notifications = notification;
};

BackupService.prototype.getName = function(wallet) {
  return (wallet.name ? (wallet.name + '-') : '') + wallet.id;
};

BackupService.prototype.download = function(wallet) {
  var ew = wallet.toEncryptedObj();
  var partial = !wallet.publicKeyRing.isComplete();
  var walletName = this.getName(wallet) + (partial ? '-Partial' : '');
  var filename = walletName + '-keybackup.json.aes';

  var notify = partial ? 'Partial backup created' : 'Backup created';
  this.notifications.success(notify, 'Encrypted backup file saved.');
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
    var partial = partial ? 'Partial ' : '';
    return window.plugin.email.open({
      subject: 'Copay - ' + name + 'Wallet ' + partial + 'Backup',
      body: 'Here is the encrypted backup of the wallet ' + wallet.id,
      attachments: ['base64:' + filename + '//' + btoa(ew)]
    });
  }

  // otherwise lean on the browser implementation
  saveAs(blob, filename);
};

angular.module('copayApp.services').service('backupService', BackupService);
