#!/usr/bin/env node

'use strict';

var templates = {
  'package.json': '/',
  'bower.json': '/',
};

var fs = require('fs');
var shell = require('shelljs');

var config = JSON.parse(fs.readFileSync(process.argv[2] || './copay.json', 'utf8'));
console.log('Applying ' + config.appNameCase + ' template');

Object.keys(templates).forEach(function(k) {
  console.log(' # processing ' + k);
  var targetDir = templates[k];
  var content = fs.readFileSync(k, 'utf8');
  Object.keys(config.replace).forEach(function(k) {
    var r = new RegExp("\\*" + k + "\\*", "g");
    content = content.replace(r, config.replace[k]);
  });
  fs.writeFileSync('../' + targetDir + k , content, 'utf8');
});
