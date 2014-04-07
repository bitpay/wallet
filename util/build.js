#!/usr/bin/env node

'use strict';

var fs = require('fs');
var browserify = require('browserify');
var browserPack = require('browser-pack');
var exec = require('child_process').exec;
var sys = require('sys');
var puts = function(error, stdout, stderr) {
  if (error) console.log(error);
  //sys.puts(stdout);
  //sys.puts(stderr);
};

var pack = function (params) {
  var file = require.resolve('soop');
  var dir = file.substr(0, file.length - String('soop.js').length);
  var preludePath = dir + 'example/custom_prelude.js';
  params.raw = true;
  params.sourceMapPrefix = '//#';
  params.prelude = fs.readFileSync(preludePath, 'utf8');
  params.preludePath = preludePath;
  return browserPack(params);
};

var createBundle = function(opts) {


  opts.dir = opts.dir || 'js/';

  // concat browser vendor files
  exec('cd ' + opts.dir + 'browser; sh concat.sh', puts);

  var bopts = {
    pack: pack,
    debug: true,
    standalone: 'copay',
    insertGlobals: true
  };
  var b = browserify(bopts);
  b.require('./copay', {
    expose: 'copay'
  });

  if (!opts.dontminify) {
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
    .option('-d, --dontminify', 'Don\'t minify the code.')
    .option('-o, --stdout', 'Specify output as stdout')
    .parse(process.argv);
  var copayBundle = createBundle(program);
  copayBundle.pipe(program.stdout ? process.stdout : fs.createWriteStream('lib/copayBundle.js'));
}

module.exports.createBundle = createBundle;
