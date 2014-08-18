#!/usr/bin/env node

'use strict';

var fs = require('fs');
var browserify = require('browserify');
var exec = require('child_process').exec;
var puts = function(error, stdout, stderr) {
  if (error) console.log(error);
};

var createVersion = function() {
  var json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  var content = 'module.exports="' + json.version + '";';
  fs.writeFileSync("./version.js", content);
};


var createTests = function(opts) {
  var bopts = {
    debug: true,
    standalone: 'tests',
    insertGlobals: true
  };
  var b = browserify(bopts);

  var files = fs.readdirSync('./test');
  var i = 0;
  files.map(function(filename) {
    if (/^.*\.js$/.test(filename)) {
      if (i <= 10000) {
        b.add('./test/' + filename);
        console.log(filename);
      }
      i++;
    }
  });
  b.external('copay');
  b.external('bitcore');
  var bundle = b.bundle();
  return bundle;
};

var createBundle = function(opts) {
  var bopts = {
    debug: true,
    standalone: 'copay',
    insertGlobals: true
  };
  var b = browserify(bopts);

  b.require('./copay', {
    expose: 'copay'
  });
  b.require('./version');
  b.require('bitcore/node_modules/browserify-buffertools/buffertools.js', {
    expose: 'buffertools'
  });
  if (!opts.debug) {
    b.transform({
      global: true
    }, 'uglifyify');
  }
  var bundle = b.bundle();
  return bundle;
};

if (require.main === module) {
  var program = require('commander');
  program
  .version('0.0.1')
  .option('-d, --debug', 'Development. Don\'t minify the codem and include debug packages.')
  .option('-o, --stdout', 'Specify output as stdout')
  .parse(process.argv);

  program.dir = program.dir || 'js/';

  createVersion();
  if (program.debug) {
    var testBundle = createTests(program);
    testBundle.pipe(fs.createWriteStream('js/testsBundle.js'));
    console.log('Test bundle being created');
  }
  var copayBundle = createBundle(program);
  copayBundle.pipe(program.stdout ? process.stdout : fs.createWriteStream('js/copayBundle.js'));
  console.log('Copay bundle being created');
}

module.exports.createBundle = createBundle;
