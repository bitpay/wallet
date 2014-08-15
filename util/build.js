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

var createBundle = function(opts) {
  opts.dir = opts.dir || 'js/';

  var bopts = {
    debug: true,
    standalone: 'copay',
    insertGlobals: true
  };
  var b = browserify(bopts);

  b.require('bitcore/node_modules/browserify-buffertools/buffertools.js', {
    expose: 'buffertools'
  });

  b.require('./copay', {
    expose: 'copay'
  });
  b.require('./version');
  //  b.external('bitcore');

  if (opts.debug) {
    //include dev dependencies
    b.require('sinon');
    b.require('blanket');
    b.require('./test/mocks/FakeStorage');
    b.require('./test/mocks/FakeLocalStorage');
    b.require('./test/mocks/FakeBlockchain');
    b.require('./test/mocks/FakeNetwork');
    b.require('./test/mocks/FakePayProServer');
    b.require('./test/mocks/FakeBuilder');
  }

  if (!opts.debug) {
    b.transform({
      global: true
    }, 'uglifyify');
  }
  var bundle = b.bundle();
  return bundle;
};

if (require.main === module) {
  var list = function(val) {
    return val.split(',');
  };
  var program = require('commander');
  program
  .version('0.0.1')
  .option('-d, --debug', 'Development. Don\'t minify the codem and include debug packages.')
  .option('-o, --stdout', 'Specify output as stdout')
  .parse(process.argv);

  createVersion();
  var copayBundle = createBundle(program);
  copayBundle.pipe(program.stdout ? process.stdout : fs.createWriteStream('js/copayBundle.js'));
}

module.exports.createBundle = createBundle;
