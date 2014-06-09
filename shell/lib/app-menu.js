/*
** copay-shell - native app menu
*/

module.exports = function(app, web) {

  var Menu = require('menu');
  var menu = []

  // add the mac osx app menu entry
  if (process.platform === 'darwin') {
    menu.push({
      label: 'Copay',
      submenu: [
        {
          label: 'About Copay',
          selector: 'orderFrontStandardAboutPanel:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide Copay',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        {
          label: 'Show All',
          selector: 'unhideAllApplications:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() {
            app.quit();
          }
        }
      ]
    });
  }

  menu.push({
    label: 'Addresses',
    submenu: [
      {
        label: 'Create New',
        click: function() {
          web.send('address:create');
        }
      }
    ]
  });

  menu.push({
    label: 'Transactions',
    submenu: [
      {
        label: 'Send Money',
        click: function() {
          web.send('transactions:send');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Pending',
        click: function() {
          web.send('transactions:pending');
        }
      },
      {
        label: 'All',
        click: function() {
          web.send('transactions:all');
        }
      }
    ]
  });

  menu.push({
    label: 'Backup',
    submenu: [
      {
        label: 'Download File',
        click: function() {
          web.send('backup:download');
        }
      },
      {
        label: 'Backup to Email',
        click: function() {
          web.send('backup:email');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Import a Backup',
        click: function() {
          web.send('backup:import');
        }
      }
    ]
  });

  if (process.platform === 'darwin') {
    menu.push({
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        {
          label: 'Close',
          accelerator: 'Command+W',
          selector: 'performClose:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        }
      ]
    });
  }

  return Menu.buildFromTemplate(menu);

};
