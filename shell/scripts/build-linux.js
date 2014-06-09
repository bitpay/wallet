/*
** copay-shell - linux builder
*/

var os           = require('os');
var downloadAtom = require('./download-atom-shell');
var async        = require('async');
var fs           = require('fs');
var path         = require('path');
var color        = require('cli-color');
var exec         = require('child_process').exec;

var shell_target = path.normalize(__dirname + '/../build/linux/Copay')
var app_target   = path.normalize(__dirname + '/../build/linux/Copay/resources/app')

async.series(
  [
    function getBinary(done) {
      downloadAtom(done);
    },
    function copyBuildFiles(done) {
      console.log(color.blue('{copay}'), 'copying app files');
      var ignore = ['.git','assets','build','scripts'].map(function(dir) {
        return '--exclude ' + dir
      }).join(' ');
      var appDir = path.normalize(__dirname + '/../');

      exec('rsync -av --progress ' + appDir + ' ' + app_target + ' ' + ignore, {
        maxBuffer: Infinity // LOL
      }, function(err, stdout, stderr) {
        done(err || stderr);
      });
    },
    function removeDefaultApp(done) {
      console.log(color.blue('{copay}'), 'removing default application');
      rmdir(path.normalize(__dirname + '/../build/linux/Copay/resources/default_app'));
      done();
    },
    function renameExecutable(done) {
      console.log(color.blue('{copay}'), 'renaming executable');
      fs.rename(shell_target + '/atom', shell_target + '/Copay', done);
    },
    function zipBuild(done) {
      console.log(color.blue('{copay}'), 'zipping distributable package');
      exec('zip -r ' + path.normalize(shell_target, '/../Copay-' + process.platform) + ' ' + shell_target, {
        maxBuffer: Infinity // LOL x 2
      },function(err, stdout, stderr) {
        done(err || stderr);
      });
    }
  ],
  function(err, results) {
    if (err) return console.log(color.blue('{copay}'), color.red(err));
    console.log(color.blue('{copay}'), color.green('success!'));
  }
);

function rmdir(dir) {
  if (fs.existsSync(dir)) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat     = fs.statSync(filename);
      if (filename == '.' || filename == '..') null;
      else if (stat.isDirectory()) rmdir(filename);
      else fs.unlinkSync(filename);
    }
    fs.rmdirSync(dir);
  }
};
