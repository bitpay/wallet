const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const os = require('os');

const appConfig = require(path.join(
  __dirname,
  '/../www/assets/appConfig.json'
));
console.log('Desktop: ' + appConfig.nameCase + ' v' + appConfig.version);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Deep linked url
let deeplinkingUrl;

const isDevMode = process.execPath.match(/[\\/]electron/);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 400,
    height: 650,
    minWidth: 400,
    maxWidth: 800,
    minHeight: 650,
    show: false
  });

  // and load the index.html of the app.
  win.loadURL(
    url.format({
      pathname: path.join(__dirname, '/../www/index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Open the DevTools.
  if (isDevMode) {
    win.webContents.openDevTools();
  }
  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.webContents.on('did-finish-load', () => {
    // Windows: Handle deeplink url
    if (process.platform == 'win32') {
      // Keep only command line / deep linked arguments
      deeplinkingUrl = process.argv.slice(1);
    }
    if (deeplinkingUrl) {
      setTimeout(() => {
        win.webContents.send('open-url-event', deeplinkingUrl);
      }, 1000);
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });
}

// The setAsDefaultProtocolClient only works on packaged versions of the application

app.setAsDefaultProtocolClient('bitcoin');
app.setAsDefaultProtocolClient('bitcoincash');
app.setAsDefaultProtocolClient('bchtest');
app.setAsDefaultProtocolClient(appConfig.name);
app.setVersion(appConfig.version);
app.setName(appConfig.nameCase);

const getHomeDirPath = platform => {
  switch (platform) {
    case 'win32':
      return process.env['USERPROFILE'];
    case 'darwin':
      return os.homedir();
    case 'linux':
      return os.homedir();
    default:
      throw new Error('Platform not supported');
  }
};
const homeDir = getHomeDirPath(process.platform);

app.setPath('userData', path.join(homeDir, `.${appConfig.name}/app`));

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

app.on('open-url', function(e, url) {
  e.preventDefault();
  deeplinkingUrl = url;
  // Wait for main window to be ready
  if (win) {
    win.webContents.send('open-url-event', deeplinkingUrl);
    deeplinkingUrl = null;
    if (win.isMinimized()) {
      win.restore();
    } else {
      win.focus();
    }
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
