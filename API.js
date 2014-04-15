var imports = require('soop').imports();

var API = function(opts) {
  this._init(opts);
};

API.prototype._init = function(opts) {
  var self = this;
  
  opts = opts || {};
  self.opts = opts;

  var Wallet = require('soop').load('./js/models/core/Wallet', {
    Storage: opts.Storage || require('./test/FakeStorage'),
    Network: opts.Network || require('./js/models/network/WebRTC'),
    Blockchain: opts.Blockchain || require('./js/models/blockchain/Insight')
  });
  
  var config = {
    wallet: {
      requiredCopayers: opts.requiredCopayers || 3,
      totalCopayers: opts.totalCopayers || 5,
    }
  };

  var walletConfig = opts.walletConfig || config;
  var walletOpts = opts.walletOpts || {};
  
  self.wallet = self.opts.wallet || Wallet.factory.create(walletConfig, walletOpts);
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
      throw new Error('invalid arguments');
  }

  if (typeof self["_cmd_" + command] == 'function') {
    var f = API.prototype[command];
    if (f.argTypes[f.argTypes.length-1][1] == 'function')
      return self["_cmd_" + command].apply(self, args.concat([callback]));
    else
      return callback(null, self["_cmd_" + command].apply(self, args));
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

function decorate(command, argTypes) {
  var d = function() {
    API.prototype._command.call(this, command, Array.prototype.slice.call(arguments, 0));
  };

  d.argTypes = argTypes;

  return d;
};

API.prototype._cmd_echo = function(str, callback) {
  var self = this;

  return callback(null, str);
};

API.prototype.echo = decorate('echo', [
  ['str', 'string'],
  ['callback', 'function']
  ]);

API.prototype._cmd_echoNumber = function(num, callback) {
  var self = this;

  return callback(null, num);
};

API.prototype.echoNumber = decorate('echoNumber', [
  ['num', 'number'],
  ['callback', 'function']
  ]);

API.prototype._cmd_echoObject = function(obj, callback) {
  var self = this;

  return callback(null, obj);
};

API.prototype.echoObject = decorate('echoObject', [
  ['obj', 'object'],
  ['callback', 'function']
  ]);

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

API.prototype._cmd_getArgTypes = function(command, callback) {
  var self = this;

  if (command[0] == '_' || typeof API.prototype[command] != 'function')
    return callback(new Error('Invalid command'));
  
  var argTypes = API.prototype[command].argTypes;

  return callback(null, argTypes);
};

API.prototype.getArgTypes = decorate('getArgTypes', [
  ['command', 'string'],
  ['callback', 'function']
  ]);

API.prototype._cmd_getCommands = function(callback) {
  var self = this;

  var fs = [];

  for (var i in API.prototype) {
    var f = API.prototype[i];
    if (typeof f == 'function' && i[0] != "_")
      fs.push(i);
  };

  return callback(null, fs);
};

API.prototype.getCommands = decorate('getCommands', [
  ['callback', 'function']
  ]);

API.prototype._cmd_getPublicKeyRingId = function(callback) {
  var self = this;

  return callback(null, self.wallet.publicKeyRing.walletId);
};

API.prototype.getPublicKeyRingId = decorate('getPublicKeyRingId', [
  ['callback', 'function']
  ]);

API.prototype._cmd_help = function(callback) {
  this._cmd_getCommands.apply(this, arguments);
};

API.prototype.help = decorate('help', [
  ['callback', 'function']
  ]);

module.exports = require('soop')(API);
