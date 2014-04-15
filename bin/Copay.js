var imports = require('soop').imports();
var PublicKeyRing = imports.PublicKeyRing || require('../js/models/core/PublicKeyRing');
//var Wallet = imports.Wallet || require('../js/models/core/Wallet');

var Copay = function(opts) {
  this._init(opts);
};

Copay.prototype._init = function(opts) {
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

Copay.prototype._command = function(command, args, callback) {
  var self = this;
  
  if (command[0] == "_")
    return callback(new Error('invalid command'));

  if (typeof self[command] == 'function') {
    var f = Copay.prototype[command];
    if (f.argTypes[f.argTypes.length-1][1] == 'function')
      return self[command].apply(self, args.concat([callback]));
    else
      return callback(null, self[command].apply(self, args));
  };
  
  return callback(new Error('invalid command'));
};

Copay._checkArgTypes = function(command, args) {
  var f = Copay.prototype[command];
  for (var i in args) {
    if (typeof args[i] != f.argTypes[i][1])
      return false;
  }
  return true;
};

function checkArgs(name, args) {
  if (!Copay._checkArgTypes(name, args))
    throw new Error('Invalid arguments');
}

Copay.prototype.echo = function echo(str, callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  return callback(null, str);
};

Copay.prototype.echo.argTypes =
  [
  ['str', 'string'],
  ['callback', 'function']
  ];

/*
Copay.prototype.getBalance = function(callback) {
  var self = this;
  checkArgs('getBalance', arguments);

  return callback(null, self.wallet.getBalance([]));
};

Copay.prototype.getBalance.argTypes =
  [
  ['callback', 'function']
  ];
*/

Copay.prototype.getCommands = function getCommands(callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  var fs = [];

  for (var i in Copay.prototype) {
    var f = Copay.prototype[i];
    if (typeof f == 'function' && i[0] != "_")
      fs.push(i);
  };

  return callback(null, fs);
};

Copay.prototype.getCommands.argTypes =
  [
  ['callback', 'function']
  ];

Copay.prototype.getPublicKeyRingId = function getPublicKeyRingId(callback) {
  var self = this;
  checkArgs(arguments.callee.name, arguments);

  return callback(null, self.publicKeyRing.id);
};

Copay.prototype.getPublicKeyRingId.argTypes =
  [
  ['callback', 'function']
  ];

Copay.prototype.help = function help(callback) {
  this.getCommands.apply(this, arguments);
};

Copay.prototype.help.argTypes =
  [
  ['callback', 'function']
  ];

module.exports = require('soop')(Copay);
