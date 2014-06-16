'use strict';

var BackupService = function() {};

BackupService.prototype.getName = function(wallet) {
  return (wallet.name ? (wallet.name+'-') : '') + wallet.id;
};

BackupService.prototype.download = function(wallet) {
  var ew = wallet.toEncryptedObj();
  var timestamp = +(new Date());
  var walletName = this.getName(wallet);
  var filename = walletName + '-' + timestamp + '.json.aes';
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
  // otherwise lean on the browser implementation
  saveAs(blob, filename);
};

BackupService.prototype.sendEmail = function(email, wallet) {
  var ew = wallet.toEncryptedObj();
  var body = ew;
  var subject = this.getName(wallet);
  var href = 'mailto:' + email + '?' + 'subject=[Copay Backup] ' + subject + '&' + 'body=' + body;

  if (window.cshell) {
    return window.cshell.send('backup:email', href);
  }

  var newWin = window.open(href, '_blank', 'scrollbars=yes,resizable=yes,width=10,height=10');
  if (newWin) {
    setTimeout(function() {
      newWin.close();
    }, 1000);
  }
};

angular.module('copayApp.services').value('backupService', new BackupService());
