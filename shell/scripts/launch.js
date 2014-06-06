/*
** copay-shell - launch
*/

var color    = require('cli-color');
var path     = require('path');
var appPath  = path.normalize(__dirname + '/../../');
var execPath = path.normalize(__dirname + '/../bin/' + process.platform);
var spawn    = require('child_process').spawn;

// update execPath with platform specific binary locations
switch (process.platform) {
  case 'linux':
    execPath += '/atom-shell/atom';
    break;
  case 'darwin':
    execPath += '/Atom.app/Contents/MacOS/Atom';
    break;
  case 'win32':
    execPath += '\\atom-shell\\atom.exe'
    break;
  default:
    console.log('Platform not supported.');
    process.exit();
}

var copay = spawn(execPath, [appPath]);

copay.stdout.on('data', function (data) {
  console.log(data);
});

copay.stderr.on('data', function (data) {
  console.log(color.red(data));
});

copay.on('close', function (code) {
  console.log('child process exited with code ' + code);
});
