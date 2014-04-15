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

API._coerceArgTypes = function(args, argTypes) {
  for (var i in args) {
    var arg = args[i];
    var argType = argTypes[i][1];
    if (typeof arg == 'string') {
      switch (argType) {
        case 'object':
          args[i] = JSON.parse(arg);
          break;
        case 'number':
          args[i] = Number(arg);
          break;
      }
    }
  }

  return args;
};

API.prototype._command = function(command, args, callback) {
  var self = this;

  if (!command || command[0] == "_")
    return callback(new Error('invalid command'));

  if (!API._checkArgTypes(command, args)) {
    var argTypes = API.prototype[command].argTypes;
    API._coerceArgTypes(args, argTypes)
    if (!API._checkArgTypes(command, args))
      throw new Error('Invalid arguments');
  }

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

  if (f.argTypes.length != args.length) {
    
    //if the function doesn't have a callback
    if (!(f.argTypes.length == args.length + 1 && f.argTypes[f.argTypes.length-1][1] == 'function'))
      return false;
  }

  for (var i in args) {
    if (typeof args[i] != f.argTypes[i][1])
      return false;
  }
  return true;
};

API.prototype.echo = function echo(str, callback) {
  var self = this;

  return callback(null, str);
};

API.prototype.echo.argTypes =
  [
  ['str', 'string'],
  ['callback', 'function']
  ];

API.prototype.echoNumber = function echoNumber(num, callback) {
  var self = this;

  return callback(null, num);
};

API.prototype.echoNumber.argTypes =
  [
  ['num', 'number'],
  ['callback', 'function']
  ];

API.prototype.echoObject = function echoNumber(obj, callback) {
  var self = this;

  return callback(null, obj);
};

API.prototype.echoObject.argTypes =
  [
  ['obj', 'object'],
  ['callback', 'function']
  ];

/*
API.prototype.getBalance = function(callback) {
  var self = this;

  return callback(null, self.wallet.getBalance([]));
};

API.prototype.getBalance.argTypes =
  [
  ['callback', 'function']
  ];
*/

API.prototype.getArgTypes = function getArgTypes(command, callback) {
  var self = this;

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
