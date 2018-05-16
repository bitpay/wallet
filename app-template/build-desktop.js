var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
  files: ['./package.json', './www/**/*'],
  appName: '*USERVISIBLENAME*',
  platforms: ['win64', 'osx64', 'linux64'],
  buildDir: './desktop',
  version: '0.30.2',
  macIcns: './resources/*PACKAGENAME*/mac/app.icns',
  exeIco: './resources/*PACKAGENAME*/windows/icon.ico',
  macPlist: {
    'CFBundleURLTypes': [
      {
        'CFBundleURLName': 'URI Handler',
        'CFBundleURLSchemes': ['bitcoin', 'bitcoincash', '*PACKAGENAME*']
      }
    ]
  }
});

// Log stuff you want
nw.on('log', console.log);

nw.build().then(function () {
  console.log('all done!');
}).catch(function (error) {
  console.error(error);
});

