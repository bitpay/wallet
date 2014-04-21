

/*
 * Example for usage of browserify with soop
 *
 * The key parameter 'pack'
 * The supplied 'custom_prelude.js' file is needed for 
 * .load function of soop.
 */

var fs = require('fs');
var browserify = require('browserify');
var browserPack = require('browser-pack');
var opts = {};


var preludePath  = './custom_prelude.js';

var pack = function (params) {
  params.raw = true;
  params.sourceMapPrefix = '//#';
  params.prelude=  fs.readFileSync(preludePath, 'utf8');;
  params.preludePath= preludePath;

  return browserPack(params);
};

opts.pack = pack;

var b = browserify(opts);
b.require('./Person' );
b.require('./Coder.js', {expose:'Coder'} );
b.require('../soop.js', {expose:'soop'} );
b.bundle().pipe(process.stdout);


