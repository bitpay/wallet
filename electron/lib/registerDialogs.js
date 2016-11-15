const {ipcMain, dialog} = require('electron')

const registerDialogs = function(mainWindow) {
  ipcMain.on('open-alert-dialog', (event, id, opts) => {
    const {title, message, buttonText} = opts
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      message: title,
      detail: message,
      buttons: [buttonText]
    }, (index) => {
      mainWindow.webContents.send('alert-dialog-closed', id)
    })
  })
  ipcMain.on('open-confirm-dialog', (event, id, opts) => {
    const {title, message, confirmText, cancelText, actionIsDiscouraged} = opts
    let button0 = confirmText
    let button1 = cancelText
    let cancelIndex = 1
    if(actionIsDiscouraged){
      button0 = cancelText
      button1 = confirmText
      cancelIndex = 0
    }
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      message: title,
      detail: message,
      buttons: [
        button0, // right
        button1  // left
      ],
      cancelId: cancelIndex,
      defaultId: 0
    }, (index) => {
      mainWindow.webContents.send('confirm-dialog-closed', id, {
        confirmed: index !== cancelIndex
      })
    })
  })
}

module.exports = registerDialogs;
