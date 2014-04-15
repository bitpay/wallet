var imports = require('soop').imports();
var PublicKeyRing = imports.PublicKeyRing || require('./js/models/core/PublicKeyRing');
//var Wallet = imports.Wallet || require('../js/models/core/Wallet');

var API = function(opts) {
  this._init(opts);
};

API.prototype._init = function(opts) {
  var self = this;
  
  opts = opts ? opts : {};

  self.optsList = [
    'publicKeyRing',
    'wallet'
    ];

  self.opts = {};
  for (var a in self.optsList) {
    if (opts.hasOwnProperty(a))
      self.opts[a] = opts[a];
  }
  
  self.publicKeyRing = self.opts.publicKeyRing ? self.opts.publicKeyRing : new PublicKeyRing();
  //self.wallet = self.opts.wallet ? self.opts.wallet : new Wallet();
};

API.prototype._command = function(command, args, callback) {
  var self = this;

  if (!command || command[0] == "_")
    return callback(new Error('invalid command'));

  if (typeof self[command] == 'function') {
    var f = API.prototype[command];
    if (f.argTypes[f.argTypes.length-1][1] == 'function')
      return self[command].apply(self, args.concat([callback]));
    else
      return callback(null, self[command].apply(self, args));
  };
  
  return callback(new Error('invalid command'));
};

API._checkArgTypes = function(command, args) {
  var f = API.prototype[command];
  for (var i in args) {
    if (typeof args[i] != f.argTypes[i][1])
      return false;
  }
  return true;
};

function checkArgs(name, args) {
  if (!API._checkArgTypes(name, args))
    throw new Error('Invalid arguments');
}

API.prototype.echo = function echo(str, callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  return callback(null, str);
};

API.prototype.echo.argTypes =
  [
  ['str', 'string'],
  ['callback', 'function']
  ];

/*
API.prototype.getBalance = function(callback) {
  var self = this;
  checkArgs('getBalance', arguments);

  return callback(null, self.wallet.getBalance([]));
};

API.prototype.getBalance.argTypes =
  [
  ['callback', 'function']
  ];
*/

API.prototype.getArgTypes = function getArgTypes(command, callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  if (command[0] == '_' || typeof API.prototype[command] != 'function')
    return callback(new Error('Invalid command'));
  
  var argTypes = API.prototype[command].argTypes;

  return callback(null, argTypes);
};

API.prototype.getArgTypes.argTypes =
  [
  ['command', 'string'],
  ['callback', 'function']
  ];

API.prototype.getCommands = function getCommands(callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  var fs = [];

  for (var i in API.prototype) {
    var f = API.prototype[i];
    if (typeof f == 'function' && i[0] != "_")
      fs.push(i);
  };

  return callback(null, fs);
};

API.prototype.getCommands.argTypes =
  [
  ['callback', 'function']
  ];

API.prototype.getPublicKeyRingId = function getPublicKeyRingId(callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  return callback(null, self.publicKeyRing.id);
};

API.prototype.getPublicKeyRingId.argTypes =
  [
  ['callback', 'function']
  ];

API.prototype.help = function help(callback) {
  this.getCommands.apply(this, arguments);
};

API.prototype.help.argTypes =
  [
  ['callback', 'function']
  ];

module.exports = require('soop')(API);
