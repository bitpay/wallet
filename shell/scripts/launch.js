/*
 ** copay-shell - launch
 */

var color = require('cli-color');
var path = require('path');
var appPath = path.normalize(__dirname + '/../../');
var execPath = path.normalize(__dirname + '/../bin/' + process.platform);
var spawn = require('child_process').spawn;

// update execPath with platform specific binary locations
switch (process.platform) {
  case 'linux':
    execPath += '/atom';
    break;
  case 'darwin':
    execPath += '/Atom.app/Contents/MacOS/Atom';
    break;
  case 'win32':
    execPath += '\\atom.exe'
    break;
  default:
    console.log('Platform not supported.');
    process.exit();
}

var copay = spawn(execPath, [appPath]);

copay.stdout.on('data', function(data) {
  console.log("STDOUT:" + data);
});

copay.stderr.on('data', function(data) {
  console.log("STDERR:" + data);
});

copay.on('close', function(code) {
  console.log('child process exited with code ' + code);
});
