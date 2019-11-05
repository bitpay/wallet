/*
 * Patches the default status bar height to 0 - needed for notched ios devices (iphonex etc)
 * */

const fs = require('fs');
const file = `${__dirname}/../platforms/ios/BitPay/Plugins/cordova-plugin-inappbrowser/CDVInAppBrowserNavigationController.m`;

fs.readFile(file, 'utf8', (err, data) => {
  if (err) throw err;
  const result = data.replace(/STATUSBAR_HEIGHT/g, '0');
  fs.writeFile(file, result, 'utf8', err => {
    if (err) throw err;
    console.log('successfully patched iab');
  });
});
