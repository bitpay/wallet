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
var json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log('v' + json.version + ' #' + commitHash);

var content = 'window.version="' + json.version + '";';
content = content + '\nwindow.commitHash="' + commitHash + '";';
fs.writeFileSync("./src/js/version.js", content);

