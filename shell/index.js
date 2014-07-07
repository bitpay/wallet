/*
** copay-shell - initilization
*/

var config        = require('./config');
var app           = require('app');
var BrowserWindow = require('browser-window');
var Menu          = require('menu');
var mainWindow    = null;

module.exports = function(copay) {

  // quit when all windows are closed
  app.on('window-all-closed', function() {
    app.quit();
  });

  // initilization when ready
  app.on('ready', function() {

    // start up the copay server
    copay.start(config.copay.port, function(loc) {

      // create the main window
      mainWindow = new BrowserWindow({
        width: config.window.width,
        height: config.window.height
      });

      // hide the empty window
      mainWindow.hide();

      // setup the native application menu
      Menu.setApplicationMenu(
        require('./lib/app-menu')(app, mainWindow.webContents)
      );

      // setup the message handler
      require('./lib/message-handler')(mainWindow);

      // setup the native system tray integration
      // require('./lib/system-tray')(app, mainWindow.webContents);

      // load our local copay server
      mainWindow.loadUrl(loc);

      // kind of hacky - but let's avoid the white "flash" before rendering
      setTimeout(mainWindow.show.bind(mainWindow), 1000);

      // deref the browser window when we close it so it can be GC'ed
      mainWindow.on('closed', function() {
        mainWindow = null;
      });

      //mainWindow.toggleDevTools();

    });

  });

  return app;

};
