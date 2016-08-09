#!/usr/bin/env node

'use strict';

var fs = require('fs');
var shell = require('shelljs');

var getCommitHash = function() {
  //exec git command to get the hash of the current commit
  //git rev-parse HEAD

  var hash = shell.exec('git rev-parse HEAD', {
    silent: true
  }).output.trim().substr(0, 7);
  return hash;
}

var commitHash = getCommitHash();


var appConfig = JSON.parse(fs.readFileSync('./appConfig.json', 'utf8'));
var pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

console.log('v' + pkg.version + ' #' + commitHash + ' App:' + appConfig.name);


var content = 'window.version="' + pkg.version + '";';
content = content + '\nwindow.commitHash="' + commitHash + '";';

content = content + '\nwindow.appConfig=' + JSON.stringify(appConfig) + ';';
fs.writeFileSync("./src/js/appConfig.js", content);

