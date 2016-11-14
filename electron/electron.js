console.time('startup')
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

const registerDialogs = require('./lib/registerDialogs');
const registerProtocolHandlers = require('./lib/registerProtocolHandlers');

const isProduction = false
const name = isProduction? 'BitPay' : 'BitPay (Development)'
app.setName(name)
const userDataDir = isProduction? 'bitpay' : 'bitpay-dev'
app.setPath('userData', path.join(app.getPath('appData'), userDataDir))
console.log(name + ' user data directory set to: ' + app.getPath('userData'))

// Keep a global reference of the `mainWindow` object (so it's not closed
// automatically when it's garbage collected).
let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 700,
    minWidth: 320, // iPhone 5
    height: 580,
    minHeight: 568, // iPhone 5
    titleBarStyle: 'hidden-inset', // macOS
    backgroundColor: '#1E3186'
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../www/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  if(!isProduction){
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
    require('devtron').install()
  }

  // add a "desktop" class to the body to allow
  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.webContents.executeJavaScript("document.body.className+=' bp-platform-desktop'");
  })

  // const {dialog} = require('electron')
  // dialog.showMessageBox(mainWindow, {
  //   type: 'warning',
  //   message: 'test message',
  //   detail: 'test detail',
  //   buttons: ['one button']
  // }, () => {
  //   mainWindow.webContents.send('alert-dialog-closed', id)
  // })

  registerDialogs(mainWindow);
  registerProtocolHandlers(app);

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

ipcMain.on('startup-complete', (event) => {
  console.timeEnd('startup')
})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
