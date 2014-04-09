var imports = require('soop').imports();
var bitcore = imports.bitcore || require('bitcore');
var Wallet = imports.Wallet || require('./Wallet');
var Persist = imports.Persist || require('./Persist');
var State = imports.State || require('./State');

var Copay = function(opts) {
  this.init(opts);
};

Copay.prototype.init(opts) {
  opts = opts ? opts : {};
  this.optsList = [
    'walletfile',
    'peers'
    ];
  this.opts = {};
  for (var a in this.optsList) {
    if (opts.hasOwnProperty(a))
      this.opts[a] = opts[a];
  }
  this.storage = new Storage(this.opts.filename);
};

Copay.prototype.command = function(command, params, callback) {
  var self = this;

  if (command == 'init' || command == 'command')
    return callback(new Error('invalid command'));

  if (self.hasOwnProperty(command) && typeof self[command] == 'function') {
    return self[command].bind(self, params, callback);
  };
  
  return callback(new Error('invalid command'));
};

Copay.prototype.incrementCounter = function(params, callback) {
};

Copay.prototype.setName = function(params, callback) {
};
