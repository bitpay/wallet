/*
** copay-shell - message handler
*/

var ipc     = require('ipc');
var dialog  = require('dialog');
var config  = require('../config');
var windows = (process.platform === 'win32');
var HOME    = process.env[windows ? 'USERPROFILE' : 'HOME'];
var fs      = require('fs');
var shell   = require('shell');

module.exports = function(renderer) {

  // handle alerts sent from renderer (browser window)
  ipc.on('alert', function(e, type, message) {
    dialog.showMessageBox(renderer, {
      type: type || 'info',
      buttons: ['Okay'],
      title: 'Copay',
      message: message
    });
  });

  // handle saving a wallet backup
  ipc.on('backup:download', function(e, data) {
    var backup   = new Buffer(data.wallet);
    var filename = data.name + '-' + (+(new Date)) + '.json.aes';
    // open save dialog
    dialog.showSaveDialog(renderer, {
      title: 'Backup Wallet',
      defaultPath: HOME + '/' + filename
    }, function(path) {
      if (!path) return;
      fs.writeFile(path, backup, function(err) {
        dialog.showMessageBox(renderer, {
          type: err ? 'warning' : 'info',
          buttons: ['Okay'],
          title: 'Copay',
          message: err ? err.message : 'Wallet backup saved!'
        });
      });
    });
  });

  // handle emailing a wallet backup
  ipc.on('backup:email', function(e, href) {
    // open email client
    shell.openExternal(href)
  });

  // handle importing a wallet backup
  ipc.on('backup:import', function(e, data) {

    // open file dialog
    dialog.showOpenDialog(renderer, {
      title: 'Import Wallet Backup',
      defaultPath: HOME,
      properties: ['openFile']
    }, function(path) {
      if (!path) return;
      fs.readFile(path[0], function(err, contents) {
        if (err) {
          return dialog.showMessageBox(renderer, {
            type: 'warning',
            buttons: ['Okay'],
            title: 'Copay',
            message: err.message
          });
        }
        renderer.send('backup:import:data', contents.toString());
      });
    });
  });

  // if we get an error, let's pop open the console for the user
  ipc.on('error', function() {
    if (config.debug) renderer.toggleDevTools();
  });

};
