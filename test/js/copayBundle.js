require=
// modules are defined as an array
// [ module function, map of requireuires ]
//
// map of requireuires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the requireuire for previous bundles
(function outer (modules, cache, entry) {
    // Save the require from previous bundle to this closure if any
    var previousRequire = typeof require == "function" && require;

    function newRequire(name, jumped, inSkipCache){

        var m, skipCache = inSkipCache; 
        if (typeof name === 'string') {
          if (name.charAt(0) === '!' ) {
            name = name.substr(1);
            skipCache=true;
          }
        }
        if(skipCache || !cache[name]) {
            if(!modules[name]) {
                // if we cannot find the the module within our internal map or
                // cache jump to the current global require ie. the last bundle
                // that was added to the page.
                var currentRequire = typeof require == "function" && require;
                if (!jumped && currentRequire) return currentRequire(name, true);

                // If there are other bundles on this page the require from the
                // previous one is saved to 'previousRequire'. Repeat this as
                // many times as there are bundles until the module is found or
                // we exhaust the require chain.
                if (previousRequire) return previousRequire(name, true);
                throw new Error('Cannot find module \'' + name + '\'');
            }

            m = {exports:{}};
            var nextSkipCache = inSkipCache ? false : skipCache;
            if (!skipCache) cache[name] = m; 
            skipCache = false;
            modules[name][0].call(m.exports, function(x){
                var id = modules[name][1][x];
                return newRequire(id ? id : x, false, nextSkipCache);
            },m,m.exports,outer,modules,cache,entry);
        } 
        return m ? m.exports:cache[name].exports;
    }
    for(var i=0;i<entry.length;i++) newRequire(entry[i]);

    // Override the current require with this new one
    return newRequire;
})
({1:[function(require,module,exports){
var imports = require('soop').imports();

var API = function(opts) {
  this._init(opts);
};

API.prototype._init = function(opts) {
  var self = this;
  
  opts = opts || {};
  self.opts = opts;

  var WalletFactory = require('soop').load('./js/models/core/WalletFactory', {
    Storage: opts.Storage || require('./test/mocks/FakeStorage'),
    Network: opts.Network || require('./js/models/network/Base'),
    Blockchain: opts.Blockchain || require('./js/models/blockchain/Insight')
  });

  this.walletFactory = new WalletFactory(opts);
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

API.prototype._cmd_getWallets = function(callback) {
  var self = this;

  return callback(null, self.walletFactory.getWallets());
};

API.prototype.getWallets = decorate('getWallets', [
  ['callback', 'function']
  ]);

API.prototype._cmd_help = function(callback) {
  this._cmd_getCommands.apply(this, arguments);
};

API.prototype.help = decorate('help', [
  ['callback', 'function']
  ]);

module.exports = require('soop')(API);

},{"./js/models/blockchain/Insight":"N916Nn","./js/models/network/Base":17,"./test/mocks/FakeStorage":"q/5+08","soop":61}],"copay":[function(require,module,exports){
module.exports=require('hxYaTp');
},{}],"hxYaTp":[function(require,module,exports){

// core
module.exports.PublicKeyRing = require('./js/models/core/PublicKeyRing');
module.exports.TxProposals = require('./js/models/core/TxProposals');
module.exports.PrivateKey = require('./js/models/core/PrivateKey');
module.exports.Passphrase = require('./js/models/core/Passphrase');


// components
var WebRTC = module.exports.WebRTC = require('./js/models/network/WebRTC');
var Insight = module.exports.Insight = require('./js/models/blockchain/Insight');
var StorageLocalPlain = module.exports.StorageLocalPlain = require('./js/models/storage/LocalPlain');
var StorageLocalEncrypted = module.exports.StorageLocalEncrypted = require('./js/models/storage/LocalEncrypted');

var WalletFactory = require('soop').load('./js/models/core/WalletFactory',{
  Network: WebRTC,
  Blockchain: Insight,
  Storage: StorageLocalEncrypted,
});
module.exports.WalletFactory = WalletFactory;


module.exports.API = require('./API');

},{"./API":1,"./js/models/blockchain/Insight":"N916Nn","./js/models/core/Passphrase":"07vXYZ","./js/models/core/PrivateKey":"41fjjN","./js/models/core/PublicKeyRing":"6Bv3pA","./js/models/core/TxProposals":12,"./js/models/network/WebRTC":"7xJZlt","./js/models/storage/LocalEncrypted":21,"./js/models/storage/LocalPlain":22,"soop":61}],"N916Nn":[function(require,module,exports){
(function (process){
'use strict';

var imports     = require('soop').imports();
var bitcore     = require('bitcore');

function Insight(opts) {
  opts = opts || {};
  this.host = opts.host || 'localhost';
  this.port = opts.port || '3001';
  this.scheme = opts.scheme || 'http';
}

function _asyncForEach(array, fn, callback) {
  array = array.slice(0);
  function processOne() {
    var item = array.pop();
    fn(item, function(result) {
        if(array.length > 0) {
          setTimeout(processOne, 0); // schedule immediately
        } else {
          callback(); // Done!
        }
      });
  }
  if(array.length > 0) {
    setTimeout(processOne, 0); // schedule immediately
  } else {
    callback(); // Done!
  }
};

function removeRepeatedElements(ar){ 
  var ya=false,v="",aux=[].concat(ar),r=Array(); 
  for (var i in aux){ // 
    v=aux[i]; 
    ya=false; 
    for (var a in aux){ 
      if (v==aux[a]){ 
        if (ya==false){ 
          ya=true; 
        } 
        else{ 
          aux[a]=""; 
        } 
      } 
    } 
  } 
  for (var a in aux){ 
    if (aux[a]!=""){ 
      r.push(aux[a]); 
    } 
  } 
  return r; 
}

Insight.prototype.getTransactions = function(addresses, cb) {
  var self = this;
  
  if (!addresses || !addresses.length) return cb([]);

  var txids = [];
  var txs = [];
  
  _asyncForEach(addresses, function(addr, callback) {
    var options = {
      host: self.host,
      port: self.port,
      scheme: self.scheme,
      method: 'GET',
      path: '/api/addr/' + addr,

      headers: { 'Access-Control-Request-Headers' : '' }
    };
    
    self._request(options, function(err, res) {
      var txids_tmp = res.transactions;
      for(var i=0; i<txids_tmp.length; i++) {
        txids.push(txids_tmp[i]);
      }
      callback();
    });
  }, function() {
    var clean_txids = removeRepeatedElements(txids);
    _asyncForEach(clean_txids, function(txid, callback2) {
      var options = {
        host: self.host,
        port: self.port,
        scheme: self.scheme,
        method: 'GET',
        path: '/api/tx/' + txid,
        headers: { 'Access-Control-Request-Headers' : '' }
      };
      self._request(options, function(err, res) {
        txs.push(res);
        callback2();
      });
    }, function() {
      return cb(txs);
    });
  });
};

Insight.prototype.getUnspent = function(addresses, cb) {
  var self = this;
  
  if (!addresses || !addresses.length) return cb([]);

  var all = [];

  _asyncForEach(addresses, function(addr, callback) {
    var options = {
      host: self.host,
      port: self.port,
      scheme: self.scheme,
      method: 'GET',
      path: '/api/addr/' + addr + '/utxo',

      headers: { 'Access-Control-Request-Headers' : '' }
    };
    
    self._request(options, function(err, res) {
      if (res && res.length > 0) { 
        all = all.concat(res);
      } 
      callback();
    });
  }, function() {
    return cb(all);
  });
};

Insight.prototype.sendRawTransaction = function(rawtx, cb) {
  if (!rawtx) return callback();

  var options = {
    host: this.host,
    port: this.port,
    method: 'POST',
    path: '/api/tx/send',
    data: 'rawtx='+rawtx,
    headers: { 'content-type' : 'application/x-www-form-urlencoded' }
  };
  this._request(options, function(err,res) {
console.log('[Insight.js.73:err:]',err); //TODO
    if (err) return cb();

console.log('[Insight.js.74]', res); //TODO
    return cb(res.txid);
  });
};

Insight.prototype._request = function(options, callback) {
  if (typeof process === 'undefined' || !process.version) {
    var request = new XMLHttpRequest();

    // TODO: Normalize URL
    var url = 'http://' + options.host;

    if (options.port !== 80) {
      url = url + ':' + options.port;
    }

    url = url + options.path;

    if (options.data && options.method === 'GET') {
      url = url + '?' + options.data;
    }

    request.open(options.method, url, true);
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          return callback(null, JSON.parse(request.responseText));
        } 
        else {
          return callback({
            message: 'Error code: ' + request.status + ' - Status: ' + request.statusText + ' - Description: ' + request.responseText
          });
        }
      }
    };

    if (options.method === 'POST') {
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      request.send(options.data);
    } else {
      request.send(null);
    }
  } else {
    var http = require('http');
    var req = http.request(options, function(response) {
      var ret;
      if (response.statusCode == 200) {
        response.on('data', function(chunk) {
          try {
            ret = JSON.parse(chunk);
          } catch (e) {
            callback({message: "Wrong response from insight"});
            return;
          }
        });
        response.on('end', function () {
          callback(undefined, ret);   
          return;
        });
      }
      else {
        callback({message: 'Error ' + response.statusCode}); 
        return;
      }
    });
    if (options.data) {
      req.write(options.data);
    }
    req.end();
  }
}


module.exports = require('soop')(Insight);


}).call(this,require("/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":43,"bitcore":23,"http":38,"soop":61}],"../js/models/blockchain/Insight":[function(require,module,exports){
module.exports=require('N916Nn');
},{}],"07vXYZ":[function(require,module,exports){
'use strict';

function Passphrase(config) {
 config = config || {};
 this.salt = config.salt || 'mjuBtGybi/4=';
 this.iterations = config.iterations || 1000;
};

Passphrase.prototype.get = function(password) {
  var hash = CryptoJS.SHA256(CryptoJS.SHA256(password));
  var salt = CryptoJS.enc.Base64.parse(this.salt);
  var key512 = CryptoJS.PBKDF2(hash, salt, { keySize: 512/32, iterations: this.iterations });

  return key512;
};

Passphrase.prototype.getBase64 = function(password) {
  var key512 = this.get(password);
  var keyBase64 = key512.toString(CryptoJS.enc.Base64);

  return keyBase64;
};

Passphrase.prototype.getBase64Async = function(password,cb) {
  var self = this;
  setTimeout(function() {
    var ret = self.getBase64(password);
    return cb(ret);
  },10);
};



module.exports = Passphrase;

},{}],"../js/models/core/Passphrase":[function(require,module,exports){
module.exports=require('07vXYZ');
},{}],"41fjjN":[function(require,module,exports){
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var WalletKey   = bitcore.WalletKey;
var networks    = bitcore.networks;
var util        = bitcore.util;
var PublicKeyRing  = require('./PublicKeyRing');

function PrivateKey(opts) {
  opts = opts || {};
  this.network = opts.networkName === 'testnet' ? 
    networks.testnet : networks.livenet;
  var init = opts.extendedPrivateKeyString || this.network.name;
  this.bip = opts.BIP32 || new BIP32(init);
  this.privateKeyCache = opts.privateKeyCache || {};
};

PrivateKey.prototype.getId = function() {
  if (!this.id) {
    var path = PublicKeyRing.ID_BRANCH;
    var bip32 = this.bip.derive(path);
    this.id= bip32.eckey.public.toString('hex');
  }
  return this.id;
};

PrivateKey.fromObj = function(obj) {
  return new PrivateKey(obj);
};

PrivateKey.prototype.toObj = function() {
  return {
    extendedPrivateKeyString: this.getExtendedPrivateKeyString(),
    networkName: this.network.name,
    privateKeyCache: this.privateKeyCache
  };
};

PrivateKey.prototype.getExtendedPublicKeyString = function() {
  return this.bip.extendedPublicKeyString();
};

PrivateKey.prototype.getExtendedPrivateKeyString = function() {
  return this.bip.extendedPrivateKeyString();
};

PrivateKey.prototype._getBIP32 = function(path) {
  if (typeof path === 'undefined') {
    return this.bip;
  }
  return this.bip.derive(path);
};

PrivateKey.prototype.get = function(index,isChange) {
  var path = PublicKeyRing.Branch(index, isChange);
  var pk = this.privateKeyCache[path];
  if (!pk) {
    var derivedBIP32 =  this._getBIP32(path);
    pk = this.privateKeyCache[path] = derivedBIP32.eckey.private.toString('hex');
  } else {
    //console.log('cache hit!');
  }
  var wk = new WalletKey({network: this.network});
  wk.fromObj({priv: pk});
  return wk;
};

PrivateKey.prototype.getAll = function(addressIndex, changeAddressIndex) {
  var ret = [];
  for(var i=0;i<addressIndex; i++) {
    ret.push(this.get(i,false));
  }
  for(var i=0; i<changeAddressIndex; i++) {
    ret.push(this.get(i,true));
  }
  return ret;
};



module.exports = require('soop')(PrivateKey);

},{"./PublicKeyRing":"6Bv3pA","bitcore":23,"soop":61}],"../js/models/core/PrivateKey":[function(require,module,exports){
module.exports=require('41fjjN');
},{}],"../js/models/core/PublicKeyRing":[function(require,module,exports){
module.exports=require('6Bv3pA');
},{}],"6Bv3pA":[function(require,module,exports){
(function (Buffer){

'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var Address     = bitcore.Address;
var Script      = bitcore.Script;
var coinUtil    = bitcore.util;
var Transaction = bitcore.Transaction
var util        = bitcore.util;

var Storage     = imports.Storage || require('../storage/Base.js');
var storage     = Storage.default();


function PublicKeyRing(opts) {
  opts = opts || {};

  this.walletId = opts.walletId;

  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.copayersBIP32 = opts.copayersBIP32 || [];

  this.changeAddressIndex= opts.changeAddressIndex || 0;
  this.addressIndex= opts.addressIndex || 0;

  this.publicKeysCache = opts.publicKeysCache || {};
  this.nicknameFor = opts.nicknameFor || {};
  this.copayerIds = [];
}

/*
 * This follow Electrum convetion, as described in
 * https://bitcointalk.org/index.php?topic=274182.0
 *
 * We should probably adopt the next standard once it's ready, as discussed in:
 * http://sourceforge.net/p/bitcoin/mailman/message/32148600/
 *
 */

PublicKeyRing.Branch = function (index, isChange) {
  // first 0 is for future use: could be copayerId.
  return 'm/0/'+(isChange?1:0)+'/'+index;
};

PublicKeyRing.ID_BRANCH = 'm/100/0/0';

PublicKeyRing.fromObj = function (data) {
  if (data instanceof PublicKeyRing) {
    throw new Error('bad data format: Did you use .toObj()?');
  }
  var ret =  new PublicKeyRing(data);

  for (var k in data.copayersExtPubKeys) {
    ret.addCopayer(data.copayersExtPubKeys[k]);
  }

  return ret;
};

PublicKeyRing.prototype.toObj = function() {
  return {
    walletId: this.walletId,
    networkName: this.network.name,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,

    changeAddressIndex: this.changeAddressIndex,
    addressIndex: this.addressIndex,
    copayersExtPubKeys: this.copayersBIP32.map( function (b) { 
      return b.extendedPublicKeyString(); 
    }),
    nicknameFor: this.nicknameFor,
    publicKeysCache: this.publicKeysCache
  };
};

PublicKeyRing.prototype.getCopayerId = function(i) {
  return this.copayerIds[i];
};

PublicKeyRing.prototype.registeredCopayers = function () {
  return this.copayersBIP32.length;
};

PublicKeyRing.prototype.isComplete = function () {
  return this.registeredCopayers() === this.totalCopayers;
};

PublicKeyRing.prototype.getAllCopayerIds = function() {
  return this.copayerIds;
};

PublicKeyRing.prototype.myCopayerId = function(i) {
  return this.getCopayerId(0);
};

PublicKeyRing.prototype._checkKeys = function() {

  if (!this.isComplete())
      throw new Error('dont have required keys yet');
};

PublicKeyRing.prototype._newExtendedPublicKey = function () {
  return new BIP32(this.network.name)
    .extendedPublicKeyString();
};

PublicKeyRing.prototype._updateBip = function (index) {
  var path = PublicKeyRing.ID_BRANCH;
  var bip32 = this.copayersBIP32[index].derive(path);
  this.copayerIds[index]= bip32.eckey.public.toString('hex');
};

PublicKeyRing.prototype._setNicknameForIndex = function (index, nickname) {
  this.nicknameFor[this.copayerIds[index]] = nickname;
};

PublicKeyRing.prototype.nicknameForIndex = function (index) {
  return this.nicknameFor[this.copayerIds[index]];
};

PublicKeyRing.prototype.nicknameForCopayer = function (copayerId) {
  return this.nicknameFor[copayerId];
};

PublicKeyRing.prototype.addCopayer = function (newEpk, nickname) {
  if (this.isComplete())
      throw new Error('already have all required key:' + this.totalCopayers);

  if (!newEpk) {
    newEpk = this._newExtendedPublicKey();
  }

  this.copayersBIP32.forEach(function(b){
    if (b.extendedPublicKeyString() === newEpk)
      throw new Error('already have that key');
  });

  var i=this.copayersBIP32.length;
  var bip = new BIP32(newEpk);
  this.copayersBIP32.push(bip);
  this._updateBip(i);
  if (nickname) { 
    this._setNicknameForIndex(i,nickname);
  }
  return newEpk;
};

PublicKeyRing.prototype.getPubKeys = function (index, isChange) {
  this._checkKeys();

  var path = PublicKeyRing.Branch(index, isChange); 
  var pubKeys = this.publicKeysCache[path];
  if (!pubKeys) {
    pubKeys = [];
    var l = this.copayersBIP32.length;
    for(var i=0; i<l; i++) {
      var bip32 = this.copayersBIP32[i].derive(path);
      pubKeys[i] = bip32.eckey.public;
    }
    this.publicKeysCache[path] = pubKeys.map(function(pk){return pk.toString('hex');});
  } 
  else {
    pubKeys = pubKeys.map(function(s){return new Buffer(s,'hex');}); 
  }

  return pubKeys;
};

PublicKeyRing.prototype._checkIndexRange = function (index, isChange) {
  if ( (isChange && index > this.changeAddressIndex) ||
      (!isChange && index > this.addressIndex)) {
    console.log('Out of bounds at getAddress: Index %d isChange: %d', index, isChange);
    throw new Error('index out of bound');
  }
};

// TODO this could be cached
PublicKeyRing.prototype.getRedeemScript = function (index, isChange) {
  this._checkIndexRange(index, isChange);

  var pubKeys = this.getPubKeys(index, isChange);
  var script  = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};

// TODO this could be cached
PublicKeyRing.prototype.getAddress = function (index, isChange) {
  var script  = this.getRedeemScript(index,isChange);
  return Address.fromScript(script, this.network.name);
};

// TODO this could be cached
PublicKeyRing.prototype.getScriptPubKeyHex = function (index, isChange) {
  var addr  = this.getAddress(index,isChange);
  return Script.createP2SH(addr.payload()).getBuffer().toString('hex');
};

//generate a new address, update index.
PublicKeyRing.prototype.generateAddress = function(isChange) {

  var ret =  
    this.getAddress(isChange ? this.changeAddressIndex : this.addressIndex, isChange);
  if (isChange) {
    this.changeAddressIndex++;
  } else { 
    this.addressIndex++;
  }

  return ret;
};

PublicKeyRing.prototype.getAddresses = function(opts) {
  return this.getAddressesInfo(opts).map(function(info) {
    return info.address;
  });
};

PublicKeyRing.prototype.getAddressesInfo = function(opts) {
  opts = opts || {};

  var ret = [];
  if (!opts.excludeChange) {
    for (var i=0; i<this.changeAddressIndex; i++) {
      ret.unshift({
        address: this.getAddress(i,true),
        isChange: true
      });
    }
  }

  if (!opts.excludeMain) {
    for (var i=0; i<this.addressIndex; i++) {
      ret.unshift({
        address: this.getAddress(i,false),
        isChange: false
      });
    }
  }

  return ret;
};

// TODO this could be cached
PublicKeyRing.prototype._addScriptMap = function (map, index, isChange) {
  var script  = this.getRedeemScript(index,isChange);
  map[Address.fromScript(script, this.network.name).toString()] = script.getBuffer().toString('hex');
};

PublicKeyRing.prototype.getRedeemScriptMap = function () {
  var ret = {};

  for (var i=0; i<this.changeAddressIndex; i++) {
    this._addScriptMap(ret,i,true);
  }
  for (var i=0; i<this.addressIndex; i++) {
    this._addScriptMap(ret,i,false);
  }
  return ret;
};

PublicKeyRing.prototype._checkInPRK = function(inPKR, ignoreId) {

  if (!ignoreId  && this.walletId !== inPKR.walletId) {
    throw new Error('inPRK walletId mismatch');
  }

  if (this.network.name !== inPKR.network.name)
    throw new Error('inPRK network mismatch');

  if (
    this.requiredCopayers && inPKR.requiredCopayers &&
    (this.requiredCopayers !== inPKR.requiredCopayers))
    throw new Error('inPRK requiredCopayers mismatch '+this.requiredCopayers+'!='+inPKR.requiredCopayers);

  if (
    this.totalCopayers && inPKR.totalCopayers &&
    (this.totalCopayers !== inPKR.totalCopayers))
    throw new Error('inPRK totalCopayers mismatch'+this.totalCopayers+'!='+inPKR.requiredCopayers);
};


PublicKeyRing.prototype._mergeIndexes = function(inPKR) {
  var hasChanged = false;

  // Indexes
  if (inPKR.changeAddressIndex > this.changeAddressIndex) {
    this.changeAddressIndex = inPKR.changeAddressIndex;
    hasChanged = true;
  }

  if (inPKR.addressIndex > this.addressIndex) {
    this.addressIndex = inPKR.addressIndex;
    hasChanged = true;
  }
  return hasChanged;
};

PublicKeyRing.prototype._mergePubkeys = function(inPKR) {
  var self = this;
  var hasChanged = false;
  var l= self.copayersBIP32.length;
  if (self.isComplete()) 
    return;

  inPKR.copayersBIP32.forEach( function(b) {
    var haveIt = false;
    var epk = b.extendedPublicKeyString(); 
    for(var j=0; j<l; j++) {
      if (self.copayersBIP32[j].extendedPublicKeyString() === epk) {
        haveIt=true;
        break;
      }
    }
    if (!haveIt) {
      if (self.isComplete()) {
        throw new Error('trying to add more pubkeys, when PKR isComplete at merge');
      }
      var l2 = self.copayersBIP32.length;
      self.copayersBIP32.push(new BIP32(epk));
      self._updateBip(l2);
      if (inPKR.nicknameFor[self.getCopayerId(l2)])
        self._setNicknameForIndex(l2,inPKR.nicknameFor[self.getCopayerId(l2)]);
      hasChanged=true;
    }
  });
  return hasChanged;
};

PublicKeyRing.prototype.merge = function(inPKR, ignoreId) {
  var hasChanged = false;

  this._checkInPRK(inPKR, ignoreId);

  if (this._mergeIndexes(inPKR))
    hasChanged = true;

  if (this._mergePubkeys(inPKR))
    hasChanged = true;

  return hasChanged;
};

module.exports = require('soop')(PublicKeyRing);

}).call(this,require("buffer").Buffer)
},{"../storage/Base.js":20,"bitcore":23,"buffer":28,"soop":61}],12:[function(require,module,exports){

'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var util        = bitcore.util;
var Transaction = bitcore.Transaction;
var Builder     = bitcore.TransactionBuilder;
var Script      = bitcore.Script;
var buffertools = bitcore.buffertools;

var Storage     = imports.Storage || require('../storage/Base');
var storage     = Storage.default();

function TxProposal(opts) {
  this.creator      = opts.creator;
  this.createdTs   = opts.createdTs;
  this.seenBy   = opts.seenBy || {};
  this.signedBy = opts.signedBy || {};
  this.rejectedBy = opts.rejectedBy || {};
  this.builder  = opts.builder;
  this.sentTs = opts.sentTs || null;
  this.sentTxid = opts.sentTxid || null;
}

TxProposal.prototype.toObj = function() {
  var o = JSON.parse(JSON.stringify(this));
  delete o['builder'];
  o.builderObj = this.builder.toObj();
  return o;
};


TxProposal.prototype.setSent = function(sentTxid) {
  this.sentTxid = sentTxid;
  this.sentTs = Date.now();
};

TxProposal.fromObj = function(o) {
  var t = new TxProposal(o);
  var b = new Builder.fromObj(o.builderObj);
  t.builder = b;
  return t;
};

TxProposal.getSentTs = function() {
  return this.sentTs;
};

module.exports = require('soop')(TxProposal);


function TxProposals(opts) {
  opts = opts || {};
  this.walletId = opts.walletId;
  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;
  this.txps = {};
}

TxProposals.fromObj = function(o) {
  var ret = new TxProposals({
    networkName: o.networkName,
    walletId: o.walletId,
  });
  o.txps.forEach(function(o2) {
    var t = TxProposal.fromObj(o2);
    var id = t.builder.build().getNormalizedHash().toString('hex');
    ret.txps[id] = t;
  });
  return ret;
};


TxProposals.prototype.toObj = function() {
  var ret = [];
  for(var id in this.txps){
    var t = this.txps[id];
    if (!t.sent)
      ret.push(t.toObj());
  }
  return { 
    txps: ret, 
    walletId: this.walletId,
    networkName: this.network.name,
  };
};


TxProposals.prototype._startMerge = function(myTxps, theirTxps) {
  var fromUs=0, fromTheirs=0, merged =0;
  var toMerge = {}, ready={};

  for(var hash in theirTxps){
    if (!myTxps[hash]) {
      ready[hash]=theirTxps[hash];           // only in theirs;
      fromTheirs++;
    }
    else {
      toMerge[hash]=theirTxps[hash];  // need Merging
      merged++;
    }
  }

  for(var hash in myTxps){
    if(!toMerge[hash]) {
      ready[hash]=myTxps[hash];   // only in myTxps;
      fromUs++;
    }
  }

  return {
    stats: {
      fromUs: fromUs,
      fromTheirs: fromTheirs,
      merged: merged,
    },
    ready: ready,
    toMerge: toMerge,
  };
};

// TODO add signatures.
TxProposals.prototype._mergeMetadata = function(myTxps, theirTxps, mergeInfo) {

  var toMerge = mergeInfo.toMerge;
  var hasChanged =0;

  Object.keys(toMerge).forEach(function(hash) {
    var v0 = myTxps[hash];
    var v1 = toMerge[hash];

    Object.keys(v1.seenBy).forEach(function(k) {
      if (!v0.seenBy[k]) {
        v0.seenBy[k] = v1.seenBy[k];
        hasChanged++;
      }
    });

    Object.keys(v1.signedBy).forEach(function(k) {
      if (!v0.signedBy[k]) {
        v0.signedBy[k] = v1.signedBy[k];
        hasChanged++;
      }
    });

    Object.keys(v1.rejectedBy).forEach(function(k) {
      if (!v0.rejectedBy[k]) {
        v0.rejectedBy[k] = v1.rejectedBy[k];
        hasChanged++;
      }
    });

    if (!v0.sentTxid && v1.sentTxid) {
      v0.sentTs   = v1.sentTs;
      v0.sentTxid = v1.sentTxid;
      hasChanged++;
    }

  });
  return hasChanged;
};


TxProposals.prototype._mergeBuilder = function(myTxps, theirTxps, mergeInfo) {
  var toMerge = mergeInfo.toMerge;
  var hasChanged=0;

  for(var hash in toMerge){
    var v0 = myTxps[hash].builder;
    var v1 = toMerge[hash].builder;

    // TODO: enhance this
    var before = JSON.stringify(v0.toObj());
    v0.merge(v1);
    var after = JSON.stringify(v0.toObj());
    if (after !== before) hasChanged ++;
  }
};

TxProposals.prototype.add = function(data) {
  var id = data.builder.build().getNormalizedHash().toString('hex');
  this.txps[id] = new TxProposal(data);
};


TxProposals.prototype.setSent = function(ntxid,txid) {
  //sent TxProposals are local an not broadcasted.
  this.txps[ntxid].setSent(txid);
};


TxProposals.prototype.getTxProposal = function(ntxid) {
  var txp = this.txps[ntxid];
  var i = JSON.parse(JSON.stringify(txp));
  i.builder = txp.builder;
  i.ntxid = ntxid;
  i.peerActions = {};
  for(var p in txp.seenBy){
    i.peerActions[p]={seen: txp.seenBy[p]};
  }
  for(var p in txp.signedBy){
    i.peerActions[p]=  i.peerActions[p] || {};
    i.peerActions[p].sign = txp.signedBy[p];
  }
  var r=0;
  for(var p in txp.rejectedBy){
    i.peerActions[p]=  i.peerActions[p] || {};
    i.peerActions[p].rejected = txp.rejectedBy[p];
    r++;
  }
  i.rejectCount=r;

  var c = txp.creator;
  i.peerActions[c] = i.peerActions[c] || {};
  i.peerActions[c].create = txp.createdTs;
  return i;
};

TxProposals.prototype.getUsedUnspent = function(maxRejectCount) {
  var ret = [];
  for(var i in this.txps) {
    var u = this.txps[i].builder.getSelectedUnspent();
    if (this.getTxProposal(i).rejectCount>maxRejectCount)
      continue;

    for (var j in u){
      ret.push(u[j].txid);
    }
  }
  return ret;
};

TxProposals.prototype.merge = function(t) {
  if (this.network.name !== t.network.name) 
    throw new Error('network mismatch in:', t);

  var res = [];
  var hasChanged = 0;

  var myTxps      = this.txps;
  var theirTxps   = t.txps;

  var mergeInfo   = this._startMerge(myTxps, theirTxps);
  hasChanged += this._mergeMetadata(myTxps, theirTxps, mergeInfo);
  hasChanged += this._mergeBuilder(myTxps, theirTxps, mergeInfo);

  Object.keys(mergeInfo.toMerge).forEach(function(hash) {
    mergeInfo.ready[hash] = myTxps[hash];
  });

  mergeInfo.stats.hasChanged = hasChanged;

  this.txps=mergeInfo.ready;
  return mergeInfo.stats;
};

module.exports = require('soop')(TxProposals);

},{"../storage/Base":20,"bitcore":23,"soop":61}],"zfa+FW":[function(require,module,exports){
(function (Buffer){
'use strict';

var imports = require('soop').imports();

var bitcore = require('bitcore');
var coinUtil = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder = bitcore.TransactionBuilder;
var http = require('http');
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;
var copay = copay || require('../../../copay');
var SecureRandom  = bitcore.SecureRandom;
var Base58Check   = bitcore.Base58.base58Check;

function Wallet(opts) {
  var self = this;

  //required params
  ['storage', 'network', 'blockchain',
    'requiredCopayers', 'totalCopayers', 'spendUnconfirmed',
    'publicKeyRing', 'txProposals', 'privateKey'
  ].forEach(function(k) {
    if (typeof opts[k] === 'undefined') throw new Error('missing key:' + k);
    self[k] = opts[k];
  });

  this.log('creating ' + opts.requiredCopayers + ' of ' + opts.totalCopayers + ' wallet');

  this.id = opts.id || Wallet.getRandomId();
  this.name = opts.name;
  this.netKey = opts.netKey || SecureRandom.getRandomBuffer(8).toString('base64');

  this.verbose = opts.verbose;
  this.publicKeyRing.walletId = this.id;
  this.txProposals.walletId = this.id;
  this.network.maxPeers = this.totalCopayers;
  this.registeredPeerIds = [];
}

Wallet.parent = EventEmitter;
Wallet.prototype.log = function() {
  if (!this.verbose) return;
  if (console)
    console.log.apply(console, arguments);
};

Wallet.getRandomId = function() {
  var r = bitcore.SecureRandom.getPseudoRandomBuffer(8).toString('hex');
  return r;
};

Wallet.prototype.connectToAll = function() {
  var all = this.publicKeyRing.getAllCopayerIds();
  this.network.connectToCopayers(all);
  if (this.firstCopayerId) {
    this.sendWalletReady(this.firstCopayerId);
    this.firstCopayerId = null;
  }
};

Wallet.prototype._handlePublicKeyRing = function(senderId, data, isInbound) {
  this.log('RECV PUBLICKEYRING:', data);

  var recipients, pkr = this.publicKeyRing;
  var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);

  var hasChanged = pkr.merge(inPKR, true);
  if (hasChanged) {
    this.connectToAll();
    if (this.publicKeyRing.isComplete()) {
      this._lockIncomming();
    }
    this.log('### BROADCASTING PKR');

    recipients = null;
    this.sendPublicKeyRing(recipients);
  }
  this.emit('publicKeyRingUpdated', this.publicKeyRing);
  this.store();
};


Wallet.prototype._handleTxProposals = function(senderId, data, isInbound) {
  this.log('RECV TXPROPOSAL:', data); 

  var recipients;
  var inTxp = copay.TxProposals.fromObj(data.txProposals);
  var mergeInfo = this.txProposals.merge(inTxp, true);
  var addSeen = this.addSeenToTxProposals();
  if (mergeInfo.hasChanged || addSeen) {
    this.log('### BROADCASTING txProposals. ');
    recipients = null;
    this.sendTxProposals(recipients);
  }
  this.emit('txProposalsUpdated', this.txProposals);
  this.store();
};

Wallet.prototype._handleData = function(senderId, data, isInbound) {
  // TODO check message signature
  if (this.id !== data.walletId) {
    this.emit('badMessage', senderId);
    this.log('badMessage FROM:', senderId); //TODO
    return;
  }
  switch (data.type) {
    // This handler is repeaded on WalletFactory (#join). TODO
    case 'walletId':
      this.sendWalletReady(senderId);
      break;
    case 'walletReady':
      this.sendPublicKeyRing(senderId);
      this.sendTxProposals(senderId);
      break;
    case 'publicKeyRing':
      this._handlePublicKeyRing(senderId, data, isInbound);
      break;
    case 'txProposals':
      this._handleTxProposals(senderId, data, isInbound);
      break;
  }
};

Wallet.prototype._handleNetworkChange = function(newCopayerId) {
  if (newCopayerId) {
    this.log('#### Setting new COPAYER:', newCopayerId);
    this.sendWalletId(newCopayerId);
    this.emit('peer', this.network.peerFromCopayer(newCopayerId));
  }
  this.emit('refresh');
};


Wallet.prototype._optsToObj = function() {
  var obj = {
    id: this.id,
    spendUnconfirmed: this.spendUnconfirmed,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,
    name: this.name,
    netKey: this.netKey,
  };

  return obj;
};


Wallet.prototype.getCopayerId = function(index) {
  return this.publicKeyRing.getCopayerId(index || 0);
};


Wallet.prototype.getMyCopayerId = function() {
  return this.getCopayerId(0);
};


Wallet.prototype.getSecret = function() {
  var i = new Buffer(this.getMyCopayerId(),'hex');
  var k = new Buffer(this.netKey,'base64');
  var b = Buffer.concat([i,k]);
  var str = Base58Check.encode(b);
  return str;
};


Wallet.decodeSecret = function(secretB) {
  var secret = Base58Check.decode(secretB);
  var netKeyBuf = secret.slice(-8);
  var pubKeyBuf = secret.slice(0,33);
  return {
    pubKey: pubKeyBuf.toString('hex'),
    netKey: netKeyBuf.toString('base64'),
  }
};

Wallet.prototype._lockIncomming = function() {
  this.network.lockIncommingConnections(this.publicKeyRing.getAllCopayerIds());
};

Wallet.prototype.netStart = function() {
  var self = this;
  var net = this.network;
  net.removeAllListeners();
  net.on('networkChange', self._handleNetworkChange.bind(self));
  net.on('data', self._handleData.bind(self));
  net.on('open', function() {}); // TODO
  net.on('openError', function() {
    self.log('[Wallet.js.132:openError:] GOT  openError'); //TODO
    self.emit('openError');
  });
  net.on('close', function() {
    self.emit('close');
  });

  var myId = self.getMyCopayerId();
  var startOpts = {
    copayerId: myId,
    maxPeers: self.totalCopayers,
    netKey: this.netKey,
  };

  if (this.publicKeyRing.isComplete()) {
    this._lockIncomming();
  }

  net.start(startOpts, function() {
    self.connectToAll();
    self.emit('created', net.getPeer());
    self.emit('refresh');
  });
};

Wallet.prototype.getOnlinePeerIDs = function() {
  return this.network.getOnlinePeerIDs();
};

Wallet.prototype.getRegisteredPeerIds = function() {
  var l = this.publicKeyRing.registeredCopayers();
  if (this.registeredPeerIds.length !== l) {
    this.registeredPeerIds = [];
    for (var i = 0; i < l; i++) {
      var cid = this.getCopayerId(i);
      var pid = this.network.peerFromCopayer(cid);
      this.registeredPeerIds.push({
        peerId: pid,
        nick: this.publicKeyRing.nicknameForCopayer(cid)
      });
    }
  }
  return this.registeredPeerIds;
};

Wallet.prototype.store = function(isSync) {
  var wallet = this.toObj();
  this.storage.setFromObj(this.id, wallet);

  if (isSync) {
    this.log('Wallet stored.'); //TODO
  } else {
    this.log('Wallet stored. REFRESH Emitted'); //TODO
    this.emit('refresh');
  }

};

Wallet.prototype.toObj = function() {
  var optsObj = this._optsToObj();
  var walletObj = {
    opts: optsObj,
    publicKeyRing: this.publicKeyRing.toObj(),
    txProposals: this.txProposals.toObj(),
    privateKey: this.privateKey.toObj()
  };

  return walletObj;
};

Wallet.fromObj = function(o, storage, network, blockchain) {
  var opts           = JSON.parse(JSON.stringify(o.opts));
  opts.publicKeyRing = copay.PublicKeyRing.fromObj(o.publicKeyRing);
  opts.txProposals   = copay.TxProposals.fromObj(o.txProposals);
  opts.privateKey    = copay.PrivateKey.fromObj(o.privateKey);

  opts.storage       = storage;
  opts.network       = network;
  opts.blockchain    = blockchain;
  var w = new Wallet(opts);
  return w;
};

Wallet.prototype.toEncryptedObj = function() {
  var walletObj = this.toObj();
  return this.storage.export(walletObj);
};

Wallet.prototype.sendTxProposals = function(recipients) {
  this.log('### SENDING txProposals TO:', recipients || 'All', this.txProposals);

  this.network.send(recipients, {
    type: 'txProposals',
    txProposals: this.txProposals.toObj(),
    walletId: this.id,
  });
};

Wallet.prototype.sendWalletReady = function(recipients) {
  this.log('### SENDING WalletReady TO:', recipients);

  this.network.send(recipients, {
    type: 'walletReady',
    walletId: this.id,
  });
  this.emit('walletReady');
};

Wallet.prototype.sendWalletId = function(recipients) {
  this.log('### SENDING walletId TO:', recipients || 'All', this.id);

  this.network.send(recipients, {
    type: 'walletId',
    walletId: this.id,
    opts: this._optsToObj()
  });
};


Wallet.prototype.sendPublicKeyRing = function(recipients) {
  this.log('### SENDING publicKeyRing TO:', recipients || 'All', this.publicKeyRing.toObj());

  this.network.send(recipients, {
    type: 'publicKeyRing',
    publicKeyRing: this.publicKeyRing.toObj(),
    walletId: this.id,
  });
};


Wallet.prototype.generateAddress = function(isChange) {
  var addr = this.publicKeyRing.generateAddress(isChange);
  this.sendPublicKeyRing();
  this.store(true);
  return addr;
};


Wallet.prototype.getTxProposals = function() {
  var ret = [];
  for (var k in this.txProposals.txps) {
    var i = this.txProposals.getTxProposal(k);
    i.signedByUs = i.signedBy[this.getMyCopayerId()] ? true : false;
    i.rejectedByUs = i.rejectedBy[this.getMyCopayerId()] ? true : false;
    if (this.totalCopayers - i.rejectCount < this.requiredCopayers)
      i.finallyRejected = true;

    ret.push(i);
  }
  return ret;
};


Wallet.prototype.reject = function(ntxid) {
  var myId = this.getMyCopayerId();
  var txp = this.txProposals.txps[ntxid];
  if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) return;

  txp.rejectedBy[myId] = Date.now();
  this.sendTxProposals();
  this.store(true);
};


Wallet.prototype.sign = function(ntxid) {
  var self = this;
  var myId = this.getMyCopayerId();
  var txp = self.txProposals.txps[ntxid];
  if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) return;

  var pkr = self.publicKeyRing;
  var keys = self.privateKey.getAll(pkr.addressIndex, pkr.changeAddressIndex);

  var b = txp.builder;
  var before = b.signaturesAdded;
  b.sign(keys);

  var ret = false;
  if (b.signaturesAdded > before) {
    txp.signedBy[myId] = Date.now();
    this.sendTxProposals();
    this.store(true);
    ret = true;
  }
  return ret;
};

Wallet.prototype.sendTx = function(ntxid, cb) {
  var txp = this.txProposals.txps[ntxid];
  if (!txp) return;

  var tx = txp.builder.build();
  if (!tx.isComplete()) return;
  this.log('[Wallet.js.231] BROADCASTING TX!!!'); //TODO

  var txHex = tx.serialize().toString('hex');
  this.log('[Wallet.js.261:txHex:]', txHex); //TODO

  var self = this;

  this.blockchain.sendRawTransaction(txHex, function(txid) {
    self.log('BITCOND txid:', txid); //TODO
    if (txid) {
      self.txProposals.setSent(ntxid, txid);
    }
    self.sendTxProposals();
    self.store();
    return cb(txid);
  });
};

Wallet.prototype.addSeenToTxProposals = function() {
  var ret = false;
  var myId = this.getMyCopayerId();

  for (var k in this.txProposals.txps) {
    var txp = this.txProposals.txps[k];
    if (!txp.seenBy[myId]) {

      txp.seenBy[myId] = Date.now();
      ret = true;
    }
  }
  return ret;
};

// TODO: remove this method and use getAddressesInfo everywhere
Wallet.prototype.getAddresses = function(opts) {
  return this.publicKeyRing.getAddresses(opts);
};

Wallet.prototype.getAddressesStr = function(opts) {
  return this.getAddresses(opts).map(function(a) {
    return a.toString();
  });
};

Wallet.prototype.getAddressesInfo = function(opts) {
  return this.publicKeyRing.getAddressesInfo(opts);
};

Wallet.prototype.addressIsOwn = function(addrStr, opts) {
  var addrList = this.getAddressesStr(opts);
  var l = addrList.length;
  var ret = false;

  for (var i = 0; i < l; i++) {
    if (addrList[i] === addrStr) {
      ret = true;
      break;
    }
  }
  return ret;
};

Wallet.prototype.getBalance = function(safe, cb) {
  var balance = 0;
  var balanceByAddr = {};
  var isMain = {};
  var COIN = bitcore.util.COIN;
  var f = safe ? this.getSafeUnspent.bind(this) : this.getUnspent.bind(this);
  f(function(utxos) {
    for (var i = 0; i < utxos.length; i++) {
      var u = utxos[i];
      var amt = u.amount * COIN;
      balance += amt;
      balanceByAddr[u.address] = (balanceByAddr[u.address] || 0) + amt;
    }

    // we multiply and divide by COIN to avoid rounding errors when adding
    for (var a in balanceByAddr) {
      balanceByAddr[a] = balanceByAddr[a] / COIN;
    }
    balance = balance / COIN;
    return cb(balance, balanceByAddr, isMain);
  });
};

Wallet.prototype.getUnspent = function(cb) {
  this.blockchain.getUnspent(this.getAddressesStr(), function(unspentList) {
    return cb(unspentList);
  });
};

Wallet.prototype.getSafeUnspent = function(cb) {
  var self = this;
  this.blockchain.getUnspent(this.getAddressesStr(), function(unspentList) {

    var ret = [];
    var maxRejectCount = self.totalCopayers - self.requiredCopayers;
    var uu = self.txProposals.getUsedUnspent(maxRejectCount);

    for (var i in unspentList) {
      if (uu.indexOf(unspentList[i].txid) === -1)
        ret.push(unspentList[i]);
    }

    return cb(ret);
  });
};


Wallet.prototype.createTx = function(toAddress, amountSatStr, opts, cb) {
  var self = this;
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts = opts || {};

  if (typeof opts.spendUnconfirmed === 'undefined') {
    opts.spendUnconfirmed = this.spendUnconfirmed;
  }

  self.getSafeUnspent(function(unspentList) {
    if (self.createTxSync(toAddress, amountSatStr, unspentList, opts)) {
      self.sendPublicKeyRing(); // Change Address
      self.sendTxProposals();
      self.store();
    }
    return cb();
  });
};

Wallet.prototype.createTxSync = function(toAddress, amountSatStr, utxos, opts) {
  var pkr = this.publicKeyRing;
  var priv = this.privateKey;
  opts = opts || {};

  var amountSat = bitcore.bignum(amountSatStr);

  if (!pkr.isComplete()) {
    throw new Error('publicKeyRing is not complete');
  }

  if (!opts.remainderOut) {
    opts.remainderOut = {
      address: this.generateAddress(true).toString()
    };
  }

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{
      address: toAddress,
      amountSat: amountSat
    }]);

  var signRet;
  if (priv) {
    b.sign(priv.getAll(pkr.addressIndex, pkr.changeAddressIndex));
  }
  var myId = this.getMyCopayerId();
  var now = Date.now();

  var me = {};
  if (priv && b.signaturesAdded) me[myId] = now;

  var meSeen = {};
  if (priv) meSeen[myId] = now;

  var data = {
    signedBy: me,
    seenBy: meSeen,
    creator: myId,
    createdTs: now,
    builder: b,
  };

  this.txProposals.add(data);
  return true;
};

Wallet.prototype.disconnect = function() {
  this.log('## DISCONNECTING');
  this.network.disconnect();
};

Wallet.prototype.getNetwork = function() {
  return this.network;
};

module.exports = require('soop')(Wallet);

}).call(this,require("buffer").Buffer)
},{"../../../copay":"hxYaTp","bitcore":23,"buffer":28,"events":37,"http":38,"soop":61}],"../js/models/core/Wallet":[function(require,module,exports){
module.exports=require('zfa+FW');
},{}],"./js/models/core/WalletFactory":[function(require,module,exports){
module.exports=require('Pyh7xe');
},{}],"Pyh7xe":[function(require,module,exports){
'use strict';

var imports     = require('soop').imports();
var Storage     = imports.Storage;
var Network     = imports.Network;
var Blockchain  = imports.Blockchain;

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');

/*
 * WalletFactory
 *
 *
 * var wallet = WF.read(config,walletId); -> always go to storage
 * var wallet = WF.create(config,walletId); -> create wallets, with the given ID (or random is not given)
 *
 * var wallet = WF.open(config,walletId); -> try to read walletId, if fails, create a new wallet with that id
 */

function WalletFactory(config) {
  var self = this;
  this.storage = new Storage(config.storage);
  this.network = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);

  this.networkName = config.networkName;
  this.verbose     = config.verbose;
  this.walletDefaults = config.wallet;
}

WalletFactory.prototype.log = function(){
  if (!this.verbose) return;
  if (console)
        console.log.apply(console, arguments);
};


WalletFactory.prototype._checkRead = function(walletId) {
  var s = this.storage;
  var ret = 
    (
      s.get(walletId, 'publicKeyRing') &&
      s.get(walletId, 'txProposals')   &&
      s.get(walletId, 'opts') &&
      s.get(walletId, 'privateKey')
    )?true:false;
  ;
  return ret?true:false;
};

WalletFactory.prototype.fromObj = function(obj) {
  var w = Wallet.fromObj(obj, this.storage, this.network, this.blockchain);
  w.verbose = this.verbose;

  // JIC: Add our key
  try {
    w.publicKeyRing.addCopayer(
      w.privateKey.getExtendedPublicKeyString()
    );
  } catch (e) {
    // No really an error, just to be sure.
  }
  this.log('### WALLET OPENED:', w.id);

  // store imported wallet
  w.store();
  return w;
};

WalletFactory.prototype.fromEncryptedObj = function(base64, password) {
  this.storage._setPassphrase(password);
  var walletObj = this.storage.import(base64);
  return this.fromObj(walletObj);
};

WalletFactory.prototype.read = function(walletId) {
  if (! this._checkRead(walletId))
    return false;

  var obj = {};
  var s = this.storage;

  obj.id = walletId;
  obj.opts = s.get(walletId, 'opts');
  obj.publicKeyRing = s.get(walletId, 'publicKeyRing');
  obj.txProposals   = s.get(walletId, 'txProposals');
  obj.privateKey    = s.get(walletId, 'privateKey');

  var w = this.fromObj(obj);
  return w;
};

WalletFactory.prototype.create = function(opts) {
  opts    = opts || {};
  this.log('### CREATING NEW WALLET.' + 
           (opts.id ? ' USING ID: ' + opts.id : ' NEW ID') + 
           (opts.privateKey ? ' USING PrivateKey: ' + opts.privateKey.getId() : ' NEW PrivateKey')
          );

  opts.privateKey = opts.privateKey ||  new PrivateKey({ networkName: this.networkName });


  var requiredCopayers = opts.requiredCopayers || this.walletDefaults.requiredCopayers;
  var totalCopayers =  opts.totalCopayers || this.walletDefaults.totalCopayers;

  opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
    networkName: this.networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });
  opts.publicKeyRing.addCopayer(opts.privateKey.getExtendedPublicKeyString(), opts.nickname);
  this.log('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: this.networkName,
  });
  this.log('\t### TxProposals Initialized');

  this.storage._setPassphrase(opts.passphrase);

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  var w = new Wallet(opts);
  w.store();
  return w;
};

WalletFactory.prototype.open = function(walletId, opts) {
  opts = opts || {};
  opts.id = walletId;
  opts.verbose = this.verbose;
  this.storage._setPassphrase(opts.passphrase);

  var w = this.read(walletId);
 
  if (w) {
    w.store();
  }

  return w;
};

WalletFactory.prototype.getWallets = function() {
  var ret = this.storage.getWallets();
  ret.forEach(function(i) {
    i.show = i.name ? ( (i.name + ' <'+i.id+'>') ) : i.id;
  });
  return ret;
};

WalletFactory.prototype.remove = function(walletId) {
  // TODO remove wallet contents
  this.log('TODO: remove wallet contents');
};


WalletFactory.prototype.joinCreateSession = function(secret, nickname, passphrase, cb) {
  var self = this;

  var s;
  try {
    s=Wallet.decodeSecret(secret);
  } catch (e) {
    return cb('badSecret');
  }
  
  //Create our PrivateK
  var privateKey = new PrivateKey({ networkName: this.networkName });
  this.log('\t### PrivateKey Initialized');
  var opts = {
    copayerId: privateKey.getId(),
    netKey: s.netKey,
  };
  self.network.cleanUp();
  self.network.start(opts, function() {
    self.network.connectTo(s.pubKey);
    self.network.on('onlyYou', function(sender, data) {
      return cb('joinError');
    });
    self.network.on('data', function(sender, data) {
      if (data.type ==='walletId') {
        data.opts.privateKey = privateKey;
        data.opts.nickname =  nickname;
        data.opts.passphrase = passphrase;
        data.opts.id = data.walletId;
        var w = self.create(data.opts);
        w.firstCopayerId = s.pubKey;
        return cb(null, w);
      }
    });
  });
};

module.exports = require('soop')(WalletFactory);

},{"./PrivateKey":"41fjjN","./PublicKeyRing":"6Bv3pA","./TxProposals":12,"./Wallet":"zfa+FW","soop":61}],17:[function(require,module,exports){
var imports = require('soop').imports();
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;

/*
 * Emits
 *  'networkChange'
 *    when network layout has change (new/lost peers, etc)
 *
 *  'data'
 *    when an unknown data type arrives
 *
 * Provides
 *  send(toPeerIds, {data}, cb?)
 *
 */

function Network(opts) {
  // TODO
}

Network.parent = EventEmitter;
// Allows subscribing to the following events:
//  Network#on('networkChange', listener);
//  Network#on('data', listener);
Network.prototype.start = function(callback) {
  // TODO
};

Network.prototype.send = function(peerIds, data, cb) {
  // TODO
};

Network.prototype.connectTo = function(peerId, openCallback, closeCallback) {
  // TODO
};

Network.prototype.disconnect = function(peerId, cb) {
  // TODO
};

module.exports = require('soop')(Network);

},{"events":37,"soop":61}],"7xJZlt":[function(require,module,exports){
(function (Buffer){

var imports     = require('soop').imports();
var EventEmitter= imports.EventEmitter || require('events').EventEmitter;
var bitcore     = require('bitcore');
var util        = bitcore.util;
/*
 * Emits
 *  'networkChange'
 *    when network layout has change (new/lost peers, etc)
 *
 *  'data'
 *    when an unknown data type arrives
 *
 * Provides
 *  send(toPeerIds, {data}, cb?)
 *
 */

function Network(opts) {
  var self            = this;
  opts                = opts || {};
  this.apiKey         = opts.apiKey || 'lwjd5qra8257b9';
  this.debug          = opts.debug || 3;
  this.maxPeers       = opts.maxPeers || 10;
  this.sjclParams     = opts.sjclParams || {
    salt: 'f28bfb49ef70573c', 
    iter:500,
    mode:'ccm',
    ts:parseInt(64),   
  };
  this.opts = {};
  ['config', 'port', 'host', 'path', 'debug', 'key'].forEach(function(k) {
    if (opts[k]) self.opts[k] = opts[k];
  });
  this.cleanUp();
}

Network.parent = EventEmitter;

Network.prototype.cleanUp = function() {
  this.started = false;
  this.connectedPeers = [];
  this.peerId = null;
  this.netKey = null;
  this.copayerId = null;
  this.signingKey = null;
  this.allowedCopayerIds=null;
  this.isInboundPeerAuth=[];
  this.copayerForPeer={};
  this.connections={};
  if (this.peer) {
    console.log('## DESTROYING PEER INSTANCE'); //TODO
    this.peer.disconnect();
    this.peer.destroy();
    this.peer = null;
  }
  this.closing = 0;
};

Network.parent=EventEmitter;

// Array helpers
Network._arrayDiff = function(a, b) {
  var seen = [];
  var diff = [];

  for (var i = 0; i < b.length; i++)
    seen[b[i]] = true;

  for (var j = 0; j < a.length; j++)
    if (!seen[a[j]])
      diff.push(a[j]);

  return diff;
};

Network._inArray = function(el, array) {
  return array.indexOf(el) > -1;
};

Network._arrayPushOnce = function(el, array) {
  var ret = false;
  if (!Network._inArray(el, array)) {
    array.push(el);
    ret = true;
  }
  return ret;
};

Network._arrayRemove = function(el, array) {
  var pos = array.indexOf(el);
  if (pos >= 0) array.splice(pos, 1);
  return array;
};

Network.prototype.connectedCopayers = function() {
  var ret =[];
  for(var i in this.connectedPeers){
    var copayerId =this.copayerForPeer[this.connectedPeers[i]];
    if (copayerId) ret.push(copayerId);
  }
  return ret;
};

Network.prototype._deletePeer = function(peerId) {
  console.log('### Deleting connection from peer:', peerId);

  delete this.isInboundPeerAuth[peerId];
  delete this.copayerForPeer[peerId];

  if (this.connections[peerId]) {
    this.connections[peerId].close();
  }
  delete this.connections[peerId];
  this.connectedPeers = Network._arrayRemove(peerId, this.connectedPeers);
};

Network.prototype._onClose = function(peerId) {
  this._deletePeer(peerId);
  this._notifyNetworkChange();
};

Network.prototype.connectToCopayers = function(copayerIds) {
  var self = this;
  var arrayDiff= Network._arrayDiff(copayerIds, this.connectedCopayers());

  arrayDiff.forEach(function(copayerId) {
    if (this.allowedCopayerIds && !this.allowedCopayerIds[copayerId]) {
      console.log('### IGNORING STRANGE COPAYER:', copayerId);
      this._deletePeer(this.peerFromCopayer(copayerId));
    }
    else {
      console.log('### CONNECTING TO:', copayerId);
      self.connectTo(copayerId);
    }
  });
};

Network.prototype._sendHello = function(copayerId) {
  console.log('### SENDING HELLO TO ', copayerId);
  this.send(copayerId, {
    type: 'hello',
    copayerId: this.copayerId,
  });
};

Network.prototype._addConnectedCopayer = function(copayerId, isInbound) {
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId,copayerId);
  Network._arrayPushOnce(peerId, this.connectedPeers);
};

Network.prototype._onData = function(encStr, isInbound, peerId) {
  var sig, payload;

  try { 
    var data = this._decrypt(encStr);
    payload=  JSON.parse(data);
  } catch (e) {
    console.log('### ERROR IN DATA: "%s" ', data, isInbound, e); 
    this._deletePeer(peerId);
    return;
  }

  console.log('### RECEIVED INBOUND?:%s TYPE: %s FROM %s', 
              isInbound, payload.type, peerId, payload); 

  if(isInbound && payload.type === 'hello') {
    var payloadStr = JSON.stringify(payload);

    if (this.allowedCopayerIds && !this.allowedCopayerIds[payload.copayerId]) {
      console.log('#### Peer sent HELLO but it is not on the allowedCopayerIds. Closing connection', 
                  this.allowedCopayerIds, payload.copayerId);
      this._deletePeer(peerId);
      return;
    }

    console.log('#### Peer sent hello. Setting it up.'); //TODO
    this._addConnectedCopayer(payload.copayerId, isInbound);
    this._setInboundPeerAuth(peerId, true);
    this._notifyNetworkChange( isInbound ? payload.copayerId : null);
    this.emit('open');
    return;
  }

  if ( !this.copayerForPeer[peerId] || (isInbound && !this.isInboundPeerAuth[peerId]) ) { 
    this._deletePeer(peerId);
    return;
  }

  var self=this;
  switch(payload.type) {
    case 'disconnect':
      this._onClose(peerId);
      break;
    default:
      this.emit('data', self.copayerForPeer[peerId], payload, isInbound);
  }
};

Network.prototype._checkAnyPeer = function() {
  if (!this.connectedPeers.length) {
    console.log('EMIT openError: no more peers, not even you!'); 
    this.cleanUp();
    this.emit('openError');
  }
  if (this.connectedPeers.length === 1) {
    this.emit('onlyYou');
  }
};

Network.prototype._setupConnectionHandlers = function(dataConn, toCopayerId) {
  var self = this;

  var isInbound = toCopayerId ? false : true;

  dataConn.on('open', function() {
    if (!Network._inArray(dataConn.peer, self.connectedPeers) && 
        !self.connections[dataConn.peer]) {

      self.connections[dataConn.peer] = dataConn;

      console.log('### DATA CONNECTION READY: %s (inbound: %s) AUTHENTICATING...',
        dataConn.peer, isInbound);

      // The connecting peer send hello 
      if(toCopayerId) {
        self._addConnectedCopayer(toCopayerId);
        self._sendHello(toCopayerId);      
      }
    }
  });

  dataConn.on('data', function(data) { 
    self._onData(data, isInbound, dataConn.peer);
  });

  dataConn.on('error', function(e) {
    console.log('### DATA ERROR', e); //TODO
    self._onClose(dataConn.peer);
    self._checkAnyPeer();
    self.emit('dataError');
  });

  dataConn.on('close', function() {
    if (self.closing) return;

    console.log('### CLOSE RECV FROM:', dataConn.peer);
    self._onClose(dataConn.peer);
    self._checkAnyPeer();
  });
};

Network.prototype._notifyNetworkChange = function(newCopayerId) {
  this.emit('networkChange', newCopayerId);
};

Network.prototype._setupPeerHandlers = function(openCallback) {
  var self = this;
  var p = this.peer;

  p.on('open', function() {
    self.connectedPeers = [self.peerId];
    self.copayerForPeer[self.peerId]= self.copayerId;
    return openCallback();
  });

  p.on('error', function(err) {
    if (!err.message.match(/Could\snot\sconnect\sto peer/)) {
      console.log('### PEER ERROR:', err);
    }
    self._checkAnyPeer();
  });


  p.on('connection', function(dataConn) {
    console.log('### NEW INBOUND CONNECTION %d/%d', self.connectedPeers.length, self.maxPeers);
    if (self.connectedPeers.length >= self.maxPeers) {
      console.log('### PEER REJECTED. PEER MAX LIMIT REACHED');
      dataConn.on('open', function() {
        console.log('###  CLOSING CONN FROM:' + dataConn.peer);
        dataConn.close();
      });
    } else {
      self._setInboundPeerAuth(dataConn.peer, false);
      self._setupConnectionHandlers(dataConn);
    }
  });
};


Network.prototype._addCopayerMap = function(peerId, copayerId) {
  if (!this.copayerForPeer[peerId]) {
    if(Object.keys(this.copayerForPeer).length < this.maxPeers) {
      console.log('Adding peer/copayer',  peerId, copayerId); //TODO
      this.copayerForPeer[peerId]=copayerId;
    }
    else {
      console.log('### maxPeerLimit of %d reached. Refusing to add more copayers.', this.maxPeers); //TODO
    }
  }
};


Network.prototype._setInboundPeerAuth = function(peerId, isAuthenticated) {
  this.isInboundPeerAuth[peerId] = isAuthenticated;
};

Network.prototype.setCopayerId = function(copayerId) {
  if (this.started) {
    throw new Error('network already started: can not change peerId')
  }
  this.copayerId = copayerId;
  this.copayerIdBuf = new Buffer(copayerId,'hex');
  this.peerId = this.peerFromCopayer(this.copayerId);
  this._addCopayerMap(this.peerId,copayerId);
};


Network.prototype.peerFromCopayer = function(hex) {
  // TODO cache this.
  var SIN = bitcore.SIN;
  return new SIN(new Buffer(hex,'hex')).toString();
};

Network.prototype.start = function(opts, openCallback) {
  opts = opts || {};

  if (this.started) return openCallback();

  this.netKey = opts.netKey;
  this.maxPeers = opts.maxPeers || this.maxPeers;

  if (!this.copayerId)
    this.setCopayerId(opts.copayerId);

  console.log('CREATING PEER INSTANCE:', this.peerId); //TODO
  this.peer = new Peer(this.peerId, this.opts);
  this.started = true;
  this._setupPeerHandlers(openCallback);
};


Network.prototype.getOnlinePeerIDs = function() {
  return this.connectedPeers;
};

Network.prototype.getPeer = function() {
  return this.peer;
};

Network.prototype._encrypt = function(payloadStr) {
  var plainText = sjcl.codec.utf8String.toBits(payloadStr);
  var p = this.sjclParams;    
  ct = sjcl.encrypt(this.netKey, plainText, p);//,p, rp);
  var c = JSON.parse(ct);
  var toSend = {
    iv: c.iv,
    ct: c.ct,
  };
  return JSON.stringify(toSend);
};


Network.prototype._decrypt = function(encStr) {
  var i = JSON.parse(encStr);
  for (var k in this.sjclParams) {
    i[k] = this.sjclParams[k];
  }
  var str= JSON.stringify(i);
  var pt = sjcl.decrypt(this.netKey, str);
  return pt;
};

Network.prototype._sendToOne = function(copayerId, payload, sig, cb) {
  var peerId = this.peerFromCopayer(copayerId);
  if (peerId !== this.peerId) {
    var dataConn = this.connections[peerId];
    if (dataConn) {
      dataConn.send(payload);
    }
    else {
      console.log('[WebRTC.js.255] WARN: NO CONNECTION TO:', peerId); //TODO
    }
  }
  if (typeof cb === 'function') cb();
};

Network.prototype.send = function(copayerIds, payload, cb) {
  var self=this;
  if (!copayerIds) {
    copayerIds = this.connectedCopayers();
    payload.isBroadcast = 1;
  }

  var sig;
  var payloadStr = JSON.stringify(payload);
  var encPayload = this._encrypt(payloadStr);
  if (Array.isArray(copayerIds)) {
    var l = copayerIds.length;
    var i = 0;
    copayerIds.forEach(function(copayerId) {
      self._sendToOne(copayerId, encPayload, sig, function () {
        if (++i === l && typeof cb === 'function') cb();
      });
    });
  }
  else if (typeof copayerIds === 'string')
    self._sendToOne(copayerIds, encPayload, sig, cb);
};


Network.prototype.connectTo = function(copayerId) {
  var self = this;

  var peerId = this.peerFromCopayer(copayerId);
  console.log('### STARTING CONNECTION TO:\n\t'+ peerId+"\n\t"+ copayerId);
  var dataConn = this.peer.connect(peerId, {
    serialization: 'none',
    reliable: true,
  });
  self._setupConnectionHandlers(dataConn, copayerId);
};

Network.prototype.lockIncommingConnections = function(allowedCopayerIdsArray) {
  if (!this.allowedCopayerIds) 
    console.log('[webrtc] #### LOCKING INCOMMING CONNECTIONS'); 
  
  this.allowedCopayerIds={};
  for(var i in allowedCopayerIdsArray) {
    this.allowedCopayerIds[ allowedCopayerIdsArray[i] ] = 1;
  }
};

Network.prototype.disconnect = function(cb, forced) {
  var self = this;
  self.closing = 1;
  self.send(null, { type: 'disconnect' }, function(){
    self.cleanUp();
    if (typeof cb === 'function') cb();
  });
};

module.exports = require('soop')(Network);

}).call(this,require("buffer").Buffer)
},{"bitcore":23,"buffer":28,"events":37,"soop":61}],"../js/models/network/WebRTC":[function(require,module,exports){
module.exports=require('7xJZlt');
},{}],20:[function(require,module,exports){
'use strict';

var imports = require('soop').imports();

function Storage() {
}

// get value by key
Storage.prototype.get = function(walletId,k) {
};

// set value for key
Storage.prototype.set = function(walletId, k, v) {
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
};

Storage.prototype.getWalletIds = function() {
};

// obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj) {
};

Storage.prototype.setFromEncryptedObj = function(walletId, obj) {
};

// wallet export - hex of encrypted wallet object
Storage.prototype.getEncryptedObj = function(walletId) {
};

// remove all values
Storage.prototype.clearAll = function() {
};     

module.exports = require('soop')(Storage);

},{"soop":61}],21:[function(require,module,exports){
'use strict';

var imports = require('soop').imports();

var id = 0;
function Storage(opts) {
  opts = opts || {};

  this.__uniqueid = ++id;

  if (opts.password)
    this._setPassphrase(opts.password);
}

var pps = {};
Storage.prototype._getPassphrase = function() {
  return pps[this.__uniqueid];
}

Storage.prototype._setPassphrase = function(password) {
  pps[this.__uniqueid] = password;
}

Storage.prototype._encrypt = function(string) {
  var encrypted = CryptoJS.AES.encrypt(string, this._getPassphrase());
  var encryptedBase64 = encrypted.toString();
  return encryptedBase64;
};

Storage.prototype._encryptObj = function(obj) {
  var string = JSON.stringify(obj);
  return this._encrypt(string);
};

Storage.prototype._decrypt = function(base64) {
  var decryptedStr=null;
  var decrypted = CryptoJS.AES.decrypt(base64, this._getPassphrase());

  if (decrypted)
    decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

  return decryptedStr;
};

Storage.prototype._decryptObj = function(base64) {
  var decryptedStr = this._decrypt(base64);
  return JSON.parse(decryptedStr);
};

Storage.prototype._read = function(k) {
  var ret;
  try {
    ret = localStorage.getItem(k);
    if (ret){
      ret = this._decrypt(ret);
      ret = ret.toString(CryptoJS.enc.Utf8);
      ret = JSON.parse(ret);
    }
  } catch (e) {
    console.log('Error while decrypting: '+e);
    return null;
  };

  return ret;
};

Storage.prototype._write = function(k,v) {
  v = JSON.stringify(v);
  v = this._encrypt(v);

  localStorage.setItem(k, v);
};

// get value by key
Storage.prototype.getGlobal = function(k) {
  return  localStorage.getItem(k);
};

// set value for key
Storage.prototype.setGlobal = function(k,v) {
  localStorage.setItem(k, JSON.stringify(v));
};

// remove value for key
Storage.prototype.removeGlobal = function(k) {
  localStorage.removeItem(k);
};

Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k) {
  var ret = this._read(this._key(walletId,k));

  return ret;
};

// set value for key
Storage.prototype.set = function(walletId, k,v) {
  this._write(this._key(walletId,k), v);
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
  this.removeGlobal(this._key(walletId,k));
};

Storage.prototype.setName = function(walletId, name) {
  this.setGlobal('nameFor::'+walletId, name);
};

Storage.prototype.getName = function(walletId) {
  return this.getGlobal('nameFor::'+walletId);
};

Storage.prototype.getWalletIds = function() {
  var walletIds = [];
  var uniq = {};
  for (var i = 0; i < localStorage.length; i++) {
     var key = localStorage.key(i);
     var split = key.split('::');
     if (split.length == 2) {
      var walletId = split[0];

      if (walletId === 'nameFor') continue;

      if (typeof uniq[walletId] === 'undefined' ) {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
     }
   } 
  return walletIds;
};

Storage.prototype.getWallets = function() {
  var wallets = [];
  var uniq = {};
  var ids = this.getWalletIds();

  for (var i in ids){
    wallets.push({
      id:ids[i],
      name: this.getName(ids[i]),
    });
  }
  return wallets;
};

//obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj) {
  for (var k in obj) {
    this.set(walletId, k, obj[k]);
  }
  this.setName(walletId, obj.opts.name);
};

// remove all values
Storage.prototype.clearAll = function() {
  localStorage.clear();
};

Storage.prototype.export = function(obj) {
  var encryptedObj = this._encryptObj(obj);
  return encryptedObj;
};

Storage.prototype.import = function(base64) {
  var decryptedObj = this._decryptObj(base64);
  return decryptedObj;
};

module.exports = require('soop')(Storage);

},{"soop":61}],22:[function(require,module,exports){
'use strict';

var imports = require('soop').imports();
var parent = imports.parent || require('./Base');

function Storage() {
}
Storage.parent = parent;

Storage.prototype._read = function(k) {
  var ret;
  try {
    ret = JSON.parse(localStorage.getItem(k));
  } catch (e) {};
  return ret;
};

Storage.prototype._write = function(k,v) {
  localStorage.setItem(k, JSON.stringify(v));
};

Storage.prototype._getWalletKeys = function(walletId) {
  var keys = [];

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    var split = key.split('::');
    if (split.length == 3) {
      if (walletId = split[0])
        keys.push(split[2]);
    }
  } 

  return keys;
};

// get value by key
Storage.prototype.getGlobal = function(k) {
  return this._read(k);
};

// set value for key
Storage.prototype.setGlobal = function(k,v) {
  this._write(k,v);
};

// remove value for key
Storage.prototype.removeGlobal = function(k) {
  localStorage.removeItem(k);
};



Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k) {
  return this.getGlobal(this._key(walletId,k));
};

// set value for key
Storage.prototype.set = function(walletId, k,v) {
  this.setGlobal(this._key(walletId,k), v);
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
  this.removeGlobal(this._key(walletId,k));
};

Storage.prototype.setName = function(walletId, name) {
  this.setGlobal('nameFor::'+walletId, name);
};

Storage.prototype.getName = function(walletId) {
  return this.getGlobal('nameFor::'+walletId);
};

Storage.prototype.getWalletIds = function() {
  var walletIds = [];
  var uniq = {};
  for (var i = 0; i < localStorage.length; i++) {
     var key = localStorage.key(i);
     var split = key.split('::');
     if (split.length == 2) {
      var walletId = split[0];

      if (walletId === 'nameFor') continue;

      if (typeof uniq[walletId] === 'undefined' ) {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
     }
   } 
  return walletIds;
};

Storage.prototype.getWallets = function() {
  var wallets = [];
  var uniq = {};
  var ids = this.getWalletIds();

  for (var i in ids){
    wallets.push({
      id:ids[i],
      name: this.getName(ids[i]),
    });
  }
  return wallets;
};

//obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj) {
  for (var k in obj) {
    this.set(walletId, k, obj[k]);
  }
  this.setName(walletId, obj.opts.name);
};

// remove all values
Storage.prototype.clearAll = function() {
  localStorage.clear();
};     

module.exports = require('soop')(Storage);

},{"./Base":20,"soop":61}],23:[function(require,module,exports){
(function (Buffer){
/* 
One way to require files is this simple way:
module.exports.Address = require('./Address');

However, that will load all classes in memory even if they are not used.
Instead, we can set the 'get' property of each class to only require them when
they are accessed, saving memory if they are not used in a given project.
*/
var requireWhenAccessed = function(name, file) {
  Object.defineProperty(module.exports, name, {get: function() {return require(file)}});
};

requireWhenAccessed('Bignum', 'bignum');
Object.defineProperty(module.exports, 'bignum', {get: function() {
  console.log('bignum (with a lower-case "b") is deprecated. Use bitcore.Bignum (capital "B") instead.');
  return require('bignum');
}});
requireWhenAccessed('Base58', './lib/Base58');
Object.defineProperty(module.exports, 'base58', {get: function() {
  console.log('base58 (with a lower-case "b") is deprecated. Use bitcore.Base58 (capital "B") instead.');
  return require('./lib/Base58');
}});
requireWhenAccessed('bufferput', 'bufferput');
requireWhenAccessed('buffertools', 'buffertools');
requireWhenAccessed('Buffers.monkey', './patches/Buffers.monkey');
requireWhenAccessed('config', './config');
requireWhenAccessed('const', './const');
requireWhenAccessed('Curve', './lib/Curve');
requireWhenAccessed('Deserialize', './lib/Deserialize');
requireWhenAccessed('log', './util/log');
requireWhenAccessed('networks', './networks');
requireWhenAccessed('SecureRandom', './lib/SecureRandom');
requireWhenAccessed('util', './util/util');
requireWhenAccessed('EncodedData', './util/EncodedData');
requireWhenAccessed('VersionedData', './util/VersionedData');
requireWhenAccessed('BinaryParser', './util/BinaryParser');
requireWhenAccessed('Address', './lib/Address');
requireWhenAccessed('BIP32', './lib/BIP32');
requireWhenAccessed('Point', './lib/Point');
requireWhenAccessed('Opcode', './lib/Opcode');
requireWhenAccessed('Script', './lib/Script');
requireWhenAccessed('Transaction', './lib/Transaction');
requireWhenAccessed('TransactionBuilder', './lib/TransactionBuilder');
requireWhenAccessed('Connection', './lib/Connection');
requireWhenAccessed('Peer', './lib/Peer');
requireWhenAccessed('Block', './lib/Block');
requireWhenAccessed('ScriptInterpreter', './lib/ScriptInterpreter');
requireWhenAccessed('Bloom', './lib/Bloom');
requireWhenAccessed('Key', './lib/Key');
Object.defineProperty(module.exports, 'KeyModule', {get: function() {
  console.log('KeyModule is deprecated.');
  return require('bindings')('KeyModule');
}});
requireWhenAccessed('SINKey', './lib/SINKey');
requireWhenAccessed('SIN', './lib/SIN');
requireWhenAccessed('PrivateKey', './lib/PrivateKey');
requireWhenAccessed('RpcClient', './lib/RpcClient');
requireWhenAccessed('Wallet', './lib/Wallet');
requireWhenAccessed('WalletKey', './lib/WalletKey');
requireWhenAccessed('PeerManager', './lib/PeerManager');
requireWhenAccessed('Message', './lib/Message');
requireWhenAccessed('Electrum', './lib/Electrum');
requireWhenAccessed('Armory', './lib/Armory');
module.exports.Buffer = Buffer;


}).call(this,require("buffer").Buffer)
},{"./lib/Base58":24,"bignum":25,"bindings":26,"buffer":28}],24:[function(require,module,exports){
(function (Buffer){
var crypto = require('crypto');
var bignum = require('bignum');

var globalBuffer = new Buffer(1024);
var zerobuf = new Buffer(0);
var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
var ALPHABET_ZERO = ALPHABET[0];
var ALPHABET_BUF = new Buffer(ALPHABET, 'ascii');
var ALPHABET_INV = {};
for(var i=0; i < ALPHABET.length; i++) {
  ALPHABET_INV[ALPHABET[i]] = i;
};

// Vanilla Base58 Encoding
var base58 = {
  encode: function(buf) {
    var str;
    var x = bignum.fromBuffer(buf);
    var r;

    if(buf.length < 512) {
      str = globalBuffer;
    } else {
      str = new Buffer(buf.length << 1);
    }
    var i = str.length - 1;
    while(x.gt(0)) {
      r = x.mod(58);
      x = x.div(58);
      str[i] = ALPHABET_BUF[r.toNumber()];
      i--;
    }

    // deal with leading zeros
    var j=0;
    while(buf[j] == 0) {
      str[i] = ALPHABET_BUF[0];
      j++; i--;
    }

    return str.slice(i+1,str.length).toString('ascii');
  },

  decode: function(str) {
    if(str.length == 0) return zerobuf;
    var answer = bignum(0);
    for(var i=0; i<str.length; i++) {
    answer.mul(58)
      answer = answer.mul(58);
      answer = answer.add(ALPHABET_INV[str[i]]);
    };
    var i = 0;
    while(i < str.length && str[i] == ALPHABET_ZERO) {
      i++;
    }
    if(i > 0) {
      var zb = new Buffer(i);
      zb.fill(0);
      if(i == str.length) return zb;
      answer = answer.toBuffer();
      return Buffer.concat([zb, answer], i+answer.length);
    } else {
      return answer.toBuffer();
    }
  },
};

// Base58Check Encoding
function sha256(data) {
  return new Buffer(crypto.createHash('sha256').update(data).digest('binary'), 'binary');
};

function doubleSHA256(data) {
  return sha256(sha256(data));
};

var base58Check = {
  encode: function(buf) {
    var checkedBuf = new Buffer(buf.length + 4);
    var hash = doubleSHA256(buf);
    buf.copy(checkedBuf);
    hash.copy(checkedBuf, buf.length);
    return base58.encode(checkedBuf);
  },

  decode: function(s) {
    var buf = base58.decode(s);
    if (buf.length < 4) {
      throw new Error("invalid input: too short");
    }

    var data = buf.slice(0, -4);
    var csum = buf.slice(-4);

    var hash = doubleSHA256(data);
    var hash4 = hash.slice(0, 4);

    if (csum.toString() != hash4.toString()) {
      throw new Error("checksum mismatch");
    }

    return data;
  },
};

// if you frequently do base58 encodings with data larger
// than 512 bytes, you can use this method to expand the
// size of the reusable buffer
exports.setBuffer = function(buf) {
  globalBuffer = buf;
};

exports.base58 = base58;
exports.base58Check = base58Check;
exports.encode = base58.encode;
exports.decode = base58.decode;

}).call(this,require("buffer").Buffer)
},{"bignum":25,"buffer":28,"crypto":32}],25:[function(require,module,exports){
(function (Buffer){
/* bignumber.js v1.3.0 https://github.com/MikeMcl/bignumber.js/LICENCE */

/*jslint bitwise: true, eqeq: true, plusplus: true, sub: true, white: true, maxerr: 500 */
/*global module */

/*
  bignumber.js v1.3.0
  A JavaScript library for arbitrary-precision arithmetic.
  https://github.com/MikeMcl/bignumber.js
  Copyright (c) 2012 Michael Mclaughlin <M8ch88l@gmail.com>
  MIT Expat Licence
*/

/*********************************** DEFAULTS ************************************/

/*
 * The default values below must be integers within the stated ranges (inclusive).
 * Most of these values can be changed during run-time using BigNumber.config().
 */

/*
 * The limit on the value of DECIMAL_PLACES, TO_EXP_NEG, TO_EXP_POS, MIN_EXP,
 * MAX_EXP, and the argument to toFixed, toPrecision and toExponential, beyond
 * which an exception is thrown (if ERRORS is true).
 */
var MAX = 1E9,                                   // 0 to 1e+9

    // Limit of magnitude of exponent argument to toPower.
    MAX_POWER = 1E6,                             // 1 to 1e+6

    // The maximum number of decimal places for operations involving division.
    DECIMAL_PLACES = 20,                         // 0 to MAX

    /*
     * The rounding mode used when rounding to the above decimal places, and when
     * using toFixed, toPrecision and toExponential, and round (default value).
     * UP         0 Away from zero.
     * DOWN       1 Towards zero.
     * CEIL       2 Towards +Infinity.
     * FLOOR      3 Towards -Infinity.
     * HALF_UP    4 Towards nearest neighbour. If equidistant, up.
     * HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
     * HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
     * HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
     * HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
     */
    ROUNDING_MODE = 4,                           // 0 to 8

    // EXPONENTIAL_AT : [TO_EXP_NEG , TO_EXP_POS]

    // The exponent value at and beneath which toString returns exponential notation.
    // Number type: -7
    TO_EXP_NEG = -7,                             // 0 to -MAX

    // The exponent value at and above which toString returns exponential notation.
    // Number type: 21
    TO_EXP_POS = 21,                             // 0 to MAX

    // RANGE : [MIN_EXP, MAX_EXP]

    // The minimum exponent value, beneath which underflow to zero occurs.
    // Number type: -324  (5e-324)
    MIN_EXP = -MAX,                              // -1 to -MAX

    // The maximum exponent value, above which overflow to Infinity occurs.
    // Number type:  308  (1.7976931348623157e+308)
    MAX_EXP = MAX,                               // 1 to MAX

    // Whether BigNumber Errors are ever thrown.
    // CHANGE parseInt to parseFloat if changing ERRORS to false.
    ERRORS = true,                               // true or false
    parse = parseInt,                            // parseInt or parseFloat

/***********************************************************************************/

    P = BigNumber.prototype,
    DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_',
    outOfRange,
    id = 0,
    isValid = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,
    trim = String.prototype.trim || function () {return this.replace(/^\s+|\s+$/g, '')},
    ONE = BigNumber(1);


// CONSTRUCTOR


/*
 * The exported function.
 * Create and return a new instance of a BigNumber object.
 *
 * n {number|string|BigNumber} A numeric value.
 * [b] {number} The base of n. Integer, 2 to 64 inclusive.
 */
function BigNumber( n, b ) {
    var e, i, isNum, digits, valid, orig,
        x = this;

    // Enable constructor usage without new.
    if ( !(x instanceof BigNumber) ) {
        return new BigNumber( n, b )
    }

    // Duplicate.
    if ( n instanceof BigNumber ) {
        id = 0;

        // e is undefined.
        if ( b !== e ) {
            n += ''
        } else {
            x['s'] = n['s'];
            x['e'] = n['e'];
            x['c'] = ( n = n['c'] ) ? n.slice() : n;
            return;
        }
    }

    // Accept empty string as zero
    if (n === '') n = 0;

    // If number, check if minus zero.
    if ( typeof n != 'string' ) {
        n = ( isNum = typeof n == 'number' ||
            Object.prototype.toString.call(n) == '[object Number]' ) &&
                n === 0 && 1 / n < 0 ? '-0' : n + '';
    }

    orig = n;

    if ( b === e && isValid.test(n) ) {

        // Determine sign.
        x['s'] = n.charAt(0) == '-' ? ( n = n.slice(1), -1 ) : 1;

    // Either n is not a valid BigNumber or a base has been specified.
    } else {

        // Enable exponential notation to be used with base 10 argument.
        // Ensure return value is rounded to DECIMAL_PLACES as with other bases.
        if ( b == 10 ) {

            return setMode( n, DECIMAL_PLACES, ROUNDING_MODE );
        }

        n = trim.call(n).replace( /^\+(?!-)/, '' );

        x['s'] = n.charAt(0) == '-' ? ( n = n.replace( /^-(?!-)/, '' ), -1 ) : 1;

        if ( b != null ) {

            if ( ( b == (b | 0) || !ERRORS ) &&
              !( outOfRange = !( b >= 2 && b < 65 ) ) ) {

                digits = '[' + DIGITS.slice( 0, b = b | 0 ) + ']+';

                // Before non-decimal number validity test and base conversion
                // remove the `.` from e.g. '1.', and replace e.g. '.1' with '0.1'.
                n = n.replace( /\.$/, '' ).replace( /^\./, '0.' );

                // Any number in exponential form will fail due to the e+/-.
                if ( valid = new RegExp(
                  '^' + digits + '(?:\\.' + digits + ')?$', b < 37 ? 'i' : '' ).test(n) ) {

                    if ( isNum ) {

                        if ( n.replace( /^0\.0*|\./, '' ).length > 15 ) {

                            // 'new BigNumber() number type has more than 15 significant digits: {n}'
                            ifExceptionsThrow( orig, 0 );
                        }

                        // Prevent later check for length on converted number.
                        isNum = !isNum;
                    }
                    n = convert( n, 10, b, x['s'] );

                } else if ( n != 'Infinity' && n != 'NaN' ) {

                    // 'new BigNumber() not a base {b} number: {n}'
                    ifExceptionsThrow( orig, 1, b );
                    n = 'NaN';
                }
            } else {

                // 'new BigNumber() base not an integer: {b}'
                // 'new BigNumber() base out of range: {b}'
                ifExceptionsThrow( b, 2 );

                // Ignore base.
                valid = isValid.test(n);
            }
        } else {
            valid = isValid.test(n);
        }

        if ( !valid ) {

            // Infinity/NaN
            x['c'] = x['e'] = null;

            // NaN
            if ( n != 'Infinity' ) {

                // No exception on NaN.
                if ( n != 'NaN' ) {

                    // 'new BigNumber() not a number: {n}'
                    ifExceptionsThrow( orig, 3 );
                }
                x['s'] = null;
            }
            id = 0;

            return;
        }
    }

    // Decimal point?
    if ( ( e = n.indexOf('.') ) > -1 ) {
        n = n.replace( '.', '' );
    }

    // Exponential form?
    if ( ( i = n.search( /e/i ) ) > 0 ) {

        // Determine exponent.
        if ( e < 0 ) {
            e = i;
        }
        e += +n.slice( i + 1 );
        n = n.substring( 0, i );

    } else if ( e < 0 ) {

        // Integer.
        e = n.length;
    }

    // Determine leading zeros.
    for ( i = 0; n.charAt(i) == '0'; i++ ) {
    }

    b = n.length;

    // Disallow numbers with over 15 significant digits if number type.
    if ( isNum && b > 15 && n.slice(i).length > 15 ) {

        // 'new BigNumber() number type has more than 15 significant digits: {n}'
        ifExceptionsThrow( orig, 0 );
    }
    id = 0;

    // Overflow?
    if ( ( e -= i + 1 ) > MAX_EXP ) {

        // Infinity.
        x['c'] = x['e'] = null;

    // Zero or underflow?
    } else if ( i == b || e < MIN_EXP ) {

        // Zero.
        x['c'] = [ x['e'] = 0 ];
    } else {

        // Determine trailing zeros.
        for ( ; n.charAt(--b) == '0'; ) {
        }

        x['e'] = e;
        x['c'] = [];

        // Convert string to array of digits (without leading and trailing zeros).
        for ( e = 0; i <= b; x['c'][e++] = +n.charAt(i++) ) {
        }
    }
}


// CONSTRUCTOR PROPERTIES/METHODS


BigNumber['ROUND_UP'] = 0;
BigNumber['ROUND_DOWN'] = 1;
BigNumber['ROUND_CEIL'] = 2;
BigNumber['ROUND_FLOOR'] = 3;
BigNumber['ROUND_HALF_UP'] = 4;
BigNumber['ROUND_HALF_DOWN'] = 5;
BigNumber['ROUND_HALF_EVEN'] = 6;
BigNumber['ROUND_HALF_CEIL'] = 7;
BigNumber['ROUND_HALF_FLOOR'] = 8;

/*
 * Create an instance from a Buffer
 */
BigNumber['fromBuffer'] = function (buf, opts) {

    if (!opts) opts = {};

    var endian = { 1 : 'big', '-1' : 'little' }[opts.endian]
        || opts.endian || 'big'
    ;

    var size = opts.size === 'auto' ? Math.ceil(buf.length) : (opts.size || 1);

    if (buf.length % size !== 0) {
        throw new RangeError('Buffer length (' + buf.length + ')'
            + ' must be a multiple of size (' + size + ')'
        );
    }

    var hex = [];
    for (var i = 0; i < buf.length; i += size) {
        var chunk = [];
        for (var j = 0; j < size; j++) {
            chunk.push(buf[
                i + (endian === 'big' ? j : (size - j - 1))
            ]);
        }

        hex.push(chunk
            .map(function (c) {
                return (c < 16 ? '0' : '') + c.toString(16);
            })
            .join('')
        );
    }

    return BigNumber(hex.join(''), 16);

};

/*
 * Configure infrequently-changing library-wide settings.
 *
 * Accept an object or an argument list, with one or many of the following
 * properties or parameters respectively:
 * [ DECIMAL_PLACES [, ROUNDING_MODE [, EXPONENTIAL_AT [, RANGE [, ERRORS ]]]]]
 *
 * E.g.
 * BigNumber.config(20, 4) is equivalent to
 * BigNumber.config({ DECIMAL_PLACES : 20, ROUNDING_MODE : 4 })
 * Ignore properties/parameters set to null or undefined.
 *
 * Return an object with the properties current values.
 */
BigNumber['config'] = function () {
    var v, p,
        i = 0,
        r = {},
        a = arguments,
        o = a[0],
        c = 'config',
        inRange = function ( n, lo, hi ) {
          return !( ( outOfRange = n < lo || n > hi ) ||
            parse(n) != n && n !== 0 );
        },
        has = o && typeof o == 'object'
          ? function () {if ( o.hasOwnProperty(p) ) return ( v = o[p] ) != null}
          : function () {if ( a.length > i ) return ( v = a[i++] ) != null};

    // [DECIMAL_PLACES] {number} Integer, 0 to MAX inclusive.
    if ( has( p = 'DECIMAL_PLACES' ) ) {

        if ( inRange( v, 0, MAX ) ) {
            DECIMAL_PLACES = v | 0;
        } else {

            // 'config() DECIMAL_PLACES not an integer: {v}'
            // 'config() DECIMAL_PLACES out of range: {v}'
            ifExceptionsThrow( v, p, c );
        }
    }
    r[p] = DECIMAL_PLACES;

    // [ROUNDING_MODE] {number} Integer, 0 to 8 inclusive.
    if ( has( p = 'ROUNDING_MODE' ) ) {

        if ( inRange( v, 0, 8 ) ) {
            ROUNDING_MODE = v | 0;
        } else {

            // 'config() ROUNDING_MODE not an integer: {v}'
            // 'config() ROUNDING_MODE out of range: {v}'
            ifExceptionsThrow( v, p, c );
        }
    }
    r[p] = ROUNDING_MODE;

    /*
     * [EXPONENTIAL_AT] {number|number[]} Integer, -MAX to MAX inclusive or
     * [ integer -MAX to 0 inclusive, 0 to MAX inclusive ].
     */
    if ( has( p = 'EXPONENTIAL_AT' ) ) {

        if ( inRange( v, -MAX, MAX ) ) {
            TO_EXP_NEG = -( TO_EXP_POS = ~~( v < 0 ? -v : +v ) );
        } else if ( !outOfRange && v && inRange( v[0], -MAX, 0 ) &&
          inRange( v[1], 0, MAX ) ) {
            TO_EXP_NEG = ~~v[0];
            TO_EXP_POS = ~~v[1];
        } else {

            // 'config() EXPONENTIAL_AT not an integer or not [integer, integer]: {v}'
            // 'config() EXPONENTIAL_AT out of range or not [negative, positive: {v}'
            ifExceptionsThrow( v, p, c, 1 );
        }
    }
    r[p] = [ TO_EXP_NEG, TO_EXP_POS ];

    /*
     * [RANGE][ {number|number[]} Non-zero integer, -MAX to MAX inclusive or
     * [ integer -MAX to -1 inclusive, integer 1 to MAX inclusive ].
     */
    if ( has( p = 'RANGE' ) ) {

        if ( inRange( v, -MAX, MAX ) && ~~v ) {
            MIN_EXP = -( MAX_EXP = ~~( v < 0 ? -v : +v ) );
        } else if ( !outOfRange && v && inRange( v[0], -MAX, -1 ) &&
          inRange( v[1], 1, MAX ) ) {
            MIN_EXP = ~~v[0], MAX_EXP = ~~v[1];
        } else {

            // 'config() RANGE not a non-zero integer or not [integer, integer]: {v}'
            // 'config() RANGE out of range or not [negative, positive: {v}'
            ifExceptionsThrow( v, p, c, 1, 1 );
        }
    }
    r[p] = [ MIN_EXP, MAX_EXP ];

    // [ERRORS] {boolean|number} true, false, 1 or 0.
    if ( has( p = 'ERRORS' ) ) {

        if ( v === !!v || v === 1 || v === 0 ) {
            parse = ( outOfRange = id = 0, ERRORS = !!v )
              ? parseInt
              : parseFloat;
        } else {

            // 'config() ERRORS not a boolean or binary digit: {v}'
            ifExceptionsThrow( v, p, c, 0, 0, 1 );
        }
    }
    r[p] = ERRORS;

    return r;
};


// PRIVATE FUNCTIONS


// Assemble error messages. Throw BigNumber Errors.
function ifExceptionsThrow( arg, i, j, isArray, isRange, isErrors) {

    if ( ERRORS ) {
        var error,
            method = ['new BigNumber', 'cmp', 'div', 'eq', 'gt', 'gte', 'lt',
                 'lte', 'minus', 'mod', 'plus', 'times', 'toFr'
                ][ id ? id < 0 ? -id : id : 1 / id < 0 ? 1 : 0 ] + '()',
            message = outOfRange ? ' out of range' : ' not a' +
              ( isRange ? ' non-zero' : 'n' ) + ' integer';

        message = ( [
            method + ' number type has more than 15 significant digits',
            method + ' not a base ' + j + ' number',
            method + ' base' + message,
            method + ' not a number' ][i] ||
              j + '() ' + i + ( isErrors
                ? ' not a boolean or binary digit'
                : message + ( isArray
                  ? ' or not [' + ( outOfRange
                    ? ' negative, positive'
                    : ' integer, integer' ) + ' ]'
                  : '' ) ) ) + ': ' + arg;

        outOfRange = id = 0;
        error = new Error(message);
        error['name'] = 'BigNumber Error';

        throw error;
    }
}


/*
 * Convert a numeric string of baseIn to a numeric string of baseOut.
 */
function convert( nStr, baseOut, baseIn, sign ) {
    var e, dvs, dvd, nArr, fracArr, fracBN;

    // Convert string of base bIn to an array of numbers of baseOut.
    // Eg. strToArr('255', 10) where baseOut is 16, returns [15, 15].
    // Eg. strToArr('ff', 16)  where baseOut is 10, returns [2, 5, 5].
    function strToArr( str, bIn ) {
        var j,
            i = 0,
            strL = str.length,
            arrL,
            arr = [0];

        for ( bIn = bIn || baseIn; i < strL; i++ ) {

            for ( arrL = arr.length, j = 0; j < arrL; arr[j] *= bIn, j++ ) {
            }

            for ( arr[0] += DIGITS.indexOf( str.charAt(i) ), j = 0;
                  j < arr.length;
                  j++ ) {

                if ( arr[j] > baseOut - 1 ) {

                    if ( arr[j + 1] == null ) {
                        arr[j + 1] = 0;
                    }
                    arr[j + 1] += arr[j] / baseOut ^ 0;
                    arr[j] %= baseOut;
                }
            }
        }

        return arr.reverse();
    }

    // Convert array to string.
    // E.g. arrToStr( [9, 10, 11] ) becomes '9ab' (in bases above 11).
    function arrToStr( arr ) {
        var i = 0,
            arrL = arr.length,
            str = '';

        for ( ; i < arrL; str += DIGITS.charAt( arr[i++] ) ) {
        }

        return str;
    }

    if ( baseIn < 37 ) {
        nStr = nStr.toLowerCase();
    }

    /*
     * If non-integer convert integer part and fraction part separately.
     * Convert the fraction part as if it is an integer than use division to
     * reduce it down again to a value less than one.
     */
    if ( ( e = nStr.indexOf( '.' ) ) > -1 ) {

        /*
         * Calculate the power to which to raise the base to get the number
         * to divide the fraction part by after it has been converted as an
         * integer to the required base.
         */
        e = nStr.length - e - 1;

        // Use toFixed to avoid possible exponential notation.
        dvs = strToArr( new BigNumber(baseIn)['pow'](e)['toF'](), 10 );

        nArr = nStr.split('.');

        // Convert the base of the fraction part (as integer).
        dvd = strToArr( nArr[1] );

        // Convert the base of the integer part.
        nArr = strToArr( nArr[0] );

        // Result will be a BigNumber with a value less than 1.
        fracBN = divide( dvd, dvs, dvd.length - dvs.length, sign, baseOut,
          // Is least significant digit of integer part an odd number?
          nArr[nArr.length - 1] & 1 );

        fracArr = fracBN['c'];

        // e can be <= 0  ( if e == 0, fracArr is [0] or [1] ).
        if ( e = fracBN['e'] ) {

            // Append zeros according to the exponent of the result.
            for ( ; ++e; fracArr.unshift(0) ) {
            }

            // Append the fraction part to the converted integer part.
            nStr = arrToStr(nArr) + '.' + arrToStr(fracArr);

        // fracArr is [1].
        // Fraction digits rounded up, so increment last digit of integer part.
        } else if ( fracArr[0] ) {

            if ( nArr[ e = nArr.length - 1 ] < baseOut - 1 ) {
                ++nArr[e];
                nStr = arrToStr(nArr);
            } else {
                nStr = new BigNumber( arrToStr(nArr),
                  baseOut )['plus'](ONE)['toS'](baseOut);
            }

        // fracArr is [0]. No fraction digits.
        } else {
            nStr = arrToStr(nArr);
        }
    } else {

        // Simple integer. Convert base.
        nStr = arrToStr( strToArr(nStr) );
    }

    return nStr;
}


// Perform division in the specified base. Called by div and convert.
function divide( dvd, dvs, exp, s, base, isOdd ) {
    var dvsL, dvsT, next, cmp, remI,
        dvsZ = dvs.slice(),
        dvdI = dvsL = dvs.length,
        dvdL = dvd.length,
        rem = dvd.slice( 0, dvsL ),
        remL = rem.length,
        quo = new BigNumber(ONE),
        qc = quo['c'] = [],
        qi = 0,
        dig = DECIMAL_PLACES + ( quo['e'] = exp ) + 1;

    quo['s'] = s;
    s = dig < 0 ? 0 : dig;

    // Add zeros to make remainder as long as divisor.
    for ( ; remL++ < dvsL; rem.push(0) ) {
    }

    // Create version of divisor with leading zero.
    dvsZ.unshift(0);

    do {

        // 'next' is how many times the divisor goes into the current remainder.
        for ( next = 0; next < base; next++ ) {

            // Compare divisor and remainder.
            if ( dvsL != ( remL = rem.length ) ) {
                cmp = dvsL > remL ? 1 : -1;
            } else {
                for ( remI = -1, cmp = 0; ++remI < dvsL; ) {

                    if ( dvs[remI] != rem[remI] ) {
                        cmp = dvs[remI] > rem[remI] ? 1 : -1;
                        break;
                    }
                }
            }

            // Subtract divisor from remainder (if divisor < remainder).
            if ( cmp < 0 ) {

                // Remainder cannot be more than one digit longer than divisor.
                // Equalise lengths using divisor with extra leading zero?
                for ( dvsT = remL == dvsL ? dvs : dvsZ; remL; ) {

                    if ( rem[--remL] < dvsT[remL] ) {

                        for ( remI = remL;
                          remI && !rem[--remI];
                            rem[remI] = base - 1 ) {
                        }
                        --rem[remI];
                        rem[remL] += base;
                    }
                    rem[remL] -= dvsT[remL];
                }
                for ( ; !rem[0]; rem.shift() ) {
                }
            } else {
                break;
            }
        }

        // Add the 'next' digit to the result array.
        qc[qi++] = cmp ? next : ++next;

        // Update the remainder.
        rem[0] && cmp
          ? ( rem[remL] = dvd[dvdI] || 0 )
          : ( rem = [ dvd[dvdI] ] );

    } while ( ( dvdI++ < dvdL || rem[0] != null ) && s-- );

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if ( !qc[0] && qi != 1 ) {

        // There can't be more than one zero.
        --quo['e'];
        qc.shift();
    }

    // Round?
    if ( qi > dig ) {
        rnd( quo, DECIMAL_PLACES, base, isOdd, rem[0] != null );
    }

    // Overflow?
    if ( quo['e'] > MAX_EXP ) {

        // Infinity.
        quo['c'] = quo['e'] = null;

    // Underflow?
    } else if ( quo['e'] < MIN_EXP ) {

        // Zero.
        quo['c'] = [quo['e'] = 0];
    }

    return quo;
}


/*
 * Return a string representing the value of BigNumber n in normal or
 * exponential notation rounded to the specified decimal places or
 * significant digits.
 * Called by toString, toExponential (exp 1), toFixed, and toPrecision (exp 2).
 * d is the index (with the value in normal notation) of the digit that may be
 * rounded up.
 */
function format( n, d, exp ) {

    // Initially, i is the number of decimal places required.
    var i = d - (n = new BigNumber(n))['e'],
        c = n['c'];

    // +-Infinity or NaN?
    if ( !c ) {
        return n['toS']();
    }

    // Round?
    if ( c.length > ++d ) {
        rnd( n, i, 10 );
    }

    // Recalculate d if toFixed as n['e'] may have changed if value rounded up.
    i = c[0] == 0 ? i + 1 : exp ? d : n['e'] + i + 1;

    // Append zeros?
    for ( ; c.length < i; c.push(0) ) {
    }
    i = n['e'];

    /*
     * toPrecision returns exponential notation if the number of significant
     * digits specified is less than the number of digits necessary to
     * represent the integer part of the value in normal notation.
     */
    return exp == 1 || exp == 2 && ( --d < i || i <= TO_EXP_NEG )

      // Exponential notation.
      ? ( n['s'] < 0 && c[0] ? '-' : '' ) + ( c.length > 1
        ? ( c.splice( 1, 0, '.' ), c.join('') )
        : c[0] ) + ( i < 0 ? 'e' : 'e+' ) + i

      // Normal notation.
      : n['toS']();
}


// Round if necessary.
// Called by divide, format, setMode and sqrt.
function rnd( x, dp, base, isOdd, r ) {
    var xc = x['c'],
        isNeg = x['s'] < 0,
        half = base / 2,
        i = x['e'] + dp + 1,

        // 'next' is the digit after the digit that may be rounded up.
        next = xc[i],

        /*
         * 'more' is whether there are digits after 'next'.
         * E.g.
         * 0.005 (e = -3) to be rounded to 0 decimal places (dp = 0) gives i = -2
         * The 'next' digit is zero, and there ARE 'more' digits after it.
         * 0.5 (e = -1) dp = 0 gives i = 0
         * The 'next' digit is 5 and there are no 'more' digits after it.
         */
        more = r || i < 0 || xc[i + 1] != null;

    r = ROUNDING_MODE < 4
      ? ( next != null || more ) &&
        ( ROUNDING_MODE == 0 ||
           ROUNDING_MODE == 2 && !isNeg ||
             ROUNDING_MODE == 3 && isNeg )
      : next > half || next == half &&
        ( ROUNDING_MODE == 4 || more ||

          /*
           * isOdd is used in base conversion and refers to the least significant
           * digit of the integer part of the value to be converted. The fraction
           * part is rounded by this method separately from the integer part.
           */
          ROUNDING_MODE == 6 && ( xc[i - 1] & 1 || !dp && isOdd ) ||
            ROUNDING_MODE == 7 && !isNeg ||
              ROUNDING_MODE == 8 && isNeg );

    if ( i < 1 || !xc[0] ) {
        xc.length = 0;
        xc.push(0);

        if ( r ) {

            // 1, 0.1, 0.01, 0.001, 0.0001 etc.
            xc[0] = 1;
            x['e'] = -dp;
        } else {

            // Zero.
            x['e'] = 0;
        }

        return x;
    }

    // Remove any digits after the required decimal places.
    xc.length = i--;

    // Round up?
    if ( r ) {

        // Rounding up may mean the previous digit has to be rounded up and so on.
        for ( --base; ++xc[i] > base; ) {
            xc[i] = 0;

            if ( !i-- ) {
                ++x['e'];
                xc.unshift(1);
            }
        }
    }

    // Remove trailing zeros.
    for ( i = xc.length; !xc[--i]; xc.pop() ) {
    }

    return x;
}


// Round after setting the appropriate rounding mode.
// Handles ceil, floor and round.
function setMode( x, dp, rm ) {
    var r = ROUNDING_MODE;

    ROUNDING_MODE = rm;
    x = new BigNumber(x);
    x['c'] && rnd( x, dp, 10 );
    ROUNDING_MODE = r;

    return x;
}


// PROTOTYPE/INSTANCE METHODS


/*
 * Return a new BigNumber whose value is the absolute value of this BigNumber.
 */
P['abs'] = P['absoluteValue'] = function () {
    var x = new BigNumber(this);

    if ( x['s'] < 0 ) {
        x['s'] = 1;
    }

    return x;
};

/*
 * Return the bit length of the number.
 */
P['bitLength'] = function () {
    return this.toString(2).length;
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * rounded to a whole number in the direction of Infinity.
 */
P['ceil'] = function () {
    return setMode( this, 0, 2 );
};


/*
 * Return
 * 1 if the value of this BigNumber is greater than the value of BigNumber(y, b),
 * -1 if the value of this BigNumber is less than the value of BigNumber(y, b),
 * 0 if they have the same value,
 * or null if the value of either is NaN.
 */
P['comparedTo'] = P['cmp'] = function ( y, b ) {
    var a,
        x = this,
        xc = x['c'],
        yc = ( id = -id, y = new BigNumber( y, b ) )['c'],
        i = x['s'],
        j = y['s'],
        k = x['e'],
        l = y['e'];

    // Either NaN?
    if ( !i || !j ) {
        return null;
    }

    a = xc && !xc[0], b = yc && !yc[0];

    // Either zero?
    if ( a || b ) {
        return a ? b ? 0 : -j : i;
    }

    // Signs differ?
    if ( i != j ) {
        return i;
    }

    // Either Infinity?
    if ( a = i < 0, b = k == l, !xc || !yc ) {
        return b ? 0 : !xc ^ a ? 1 : -1;
    }

    // Compare exponents.
    if ( !b ) {
        return k > l ^ a ? 1 : -1;
    }

    // Compare digit by digit.
    for ( i = -1,
          j = ( k = xc.length ) < ( l = yc.length ) ? k : l;
          ++i < j; ) {

        if ( xc[i] != yc[i] ) {
            return xc[i] > yc[i] ^ a ? 1 : -1;
        }
    }
    // Compare lengths.
    return k == l ? 0 : k > l ^ a ? 1 : -1;
};


/*
 *  n / 0 = I
 *  n / N = N
 *  n / I = 0
 *  0 / n = 0
 *  0 / 0 = N
 *  0 / N = N
 *  0 / I = 0
 *  N / n = N
 *  N / 0 = N
 *  N / N = N
 *  N / I = N
 *  I / n = I
 *  I / 0 = I
 *  I / N = N
 *  I / I = N
 *
 * Return a new BigNumber whose value is the value of this BigNumber
 * divided by the value of BigNumber(y, b), rounded according to
 * DECIMAL_PLACES and ROUNDING_MODE.
 */
P['dividedBy'] = P['div'] = function ( y, b ) {
    var xc = this['c'],
        xe = this['e'],
        xs = this['s'],
        yc = ( id = 2, y = new BigNumber( y, b ) )['c'],
        ye = y['e'],
        ys = y['s'],
        s = xs == ys ? 1 : -1;

    // Either NaN/Infinity/0?
    return !xe && ( !xc || !xc[0] ) || !ye && ( !yc || !yc[0] )

      // Either NaN?
      ? new BigNumber( !xs || !ys ||

        // Both 0 or both Infinity?
        ( xc ? yc && xc[0] == yc[0] : !yc )

          // Return NaN.
          ? NaN

          // x is 0 or y is Infinity?
          : xc && xc[0] == 0 || !yc

            // Return +-0.
            ? s * 0

            // y is 0. Return +-Infinity.
            : s / 0 )

      : divide( xc, yc, xe - ye, s, 10 );
};


/*
 * Return true if the value of this BigNumber is equal to the value of
 * BigNumber(n, b), otherwise returns false.
 */
P['equals'] = P['eq'] = function ( n, b ) {
    id = 3;
    return this['cmp']( n, b ) === 0;
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * rounded to a whole number in the direction of -Infinity.
 */
P['floor'] = function () {
    return setMode( this, 0, 3 );
};


/*
 * Return true if the value of this BigNumber is greater than the value of
 * BigNumber(n, b), otherwise returns false.
 */
P['greaterThan'] = P['gt'] = function ( n, b ) {
    id = 4;
    return this['cmp']( n, b ) > 0;
};


/*
 * Return true if the value of this BigNumber is greater than or equal to
 * the value of BigNumber(n, b), otherwise returns false.
 */
P['greaterThanOrEqualTo'] = P['gte'] = function ( n, b ) {
    id = 5;
    return ( b = this['cmp']( n, b ) ) == 1 || b === 0;
};


/*
 * Return true if the value of this BigNumber is a finite number, otherwise
 * returns false.
 */
P['isFinite'] = P['isF'] = function () {
    return !!this['c'];
};


/*
 * Return true if the value of this BigNumber is NaN, otherwise returns
 * false.
 */
P['isNaN'] = function () {
    return !this['s'];
};


/*
 * Return true if the value of this BigNumber is negative, otherwise
 * returns false.
 */
P['isNegative'] = P['isNeg'] = function () {
    return this['s'] < 0;
};


/*
 * Return true if the value of this BigNumber is 0 or -0, otherwise returns
 * false.
 */
P['isZero'] = P['isZ'] = function () {
    return !!this['c'] && this['c'][0] == 0;
};


/*
 * Return true if the value of this BigNumber is less than the value of
 * BigNumber(n, b), otherwise returns false.
 */
P['lessThan'] = P['lt'] = function ( n, b ) {
    id = 6;
    return this['cmp']( n, b ) < 0;
};


/*
 * Return true if the value of this BigNumber is less than or equal to the
 * value of BigNumber(n, b), otherwise returns false.
 */
P['lessThanOrEqualTo'] = P['lte'] = P['le'] = function ( n, b ) {
    id = 7;
    return ( b = this['cmp']( n, b ) ) == -1 || b === 0;
};


/*
 *  n - 0 = n
 *  n - N = N
 *  n - I = -I
 *  0 - n = -n
 *  0 - 0 = 0
 *  0 - N = N
 *  0 - I = -I
 *  N - n = N
 *  N - 0 = N
 *  N - N = N
 *  N - I = N
 *  I - n = I
 *  I - 0 = I
 *  I - N = N
 *  I - I = N
 *
 * Return a new BigNumber whose value is the value of this BigNumber minus
 * the value of BigNumber(y, b).
 */
P['minus'] = P['sub'] = function ( y, b ) {
    var d, i, j, xLTy,
        x = this,
        a = x['s'];

    b = ( id = 8, y = new BigNumber( y, b ) )['s'];

    // Either NaN?
    if ( !a || !b ) {
        return new BigNumber(NaN);
    }

    // Signs differ?
    if ( a != b ) {
        return y['s'] = -b, x['plus'](y);
    }

    var xc = x['c'],
        xe = x['e'],
        yc = y['c'],
        ye = y['e'];

    if ( !xe || !ye ) {

        // Either Infinity?
        if ( !xc || !yc ) {
            return xc ? ( y['s'] = -b, y ) : new BigNumber( yc ? x : NaN );
        }

        // Either zero?
        if ( !xc[0] || !yc[0] ) {

            // y is non-zero?
            return yc[0]
              ? ( y['s'] = -b, y )

              // x is non-zero?
              : new BigNumber( xc[0]
                ? x

                // Both are zero.
                // IEEE 754 (2008) 6.3: n - n = -0 when rounding to -Infinity
                : ROUNDING_MODE == 3 ? -0 : 0 );
        }
    }

    // Determine which is the bigger number.
    // Prepend zeros to equalise exponents.
    if ( xc = xc.slice(), a = xe - ye ) {
        d = ( xLTy = a < 0 ) ? ( a = -a, xc ) : ( ye = xe, yc );

        for ( d.reverse(), b = a; b--; d.push(0) ) {
        }
        d.reverse();
    } else {

        // Exponents equal. Check digit by digit.
        j = ( ( xLTy = xc.length < yc.length ) ? xc : yc ).length;

        for ( a = b = 0; b < j; b++ ) {

            if ( xc[b] != yc[b] ) {
                xLTy = xc[b] < yc[b];
                break;
            }
        }
    }

    // x < y? Point xc to the array of the bigger number.
    if ( xLTy ) {
        d = xc, xc = yc, yc = d;
        y['s'] = -y['s'];
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter
     * as subtraction only needs to start at yc.length.
     */
    if ( ( b = -( ( j = xc.length ) - yc.length ) ) > 0 ) {

        for ( ; b--; xc[j++] = 0 ) {
        }
    }

    // Subtract yc from xc.
    for ( b = yc.length; b > a; ){

        if ( xc[--b] < yc[b] ) {

            for ( i = b; i && !xc[--i]; xc[i] = 9 ) {
            }
            --xc[i];
            xc[b] += 10;
        }
        xc[b] -= yc[b];
    }

    // Remove trailing zeros.
    for ( ; xc[--j] == 0; xc.pop() ) {
    }

    // Remove leading zeros and adjust exponent accordingly.
    for ( ; xc[0] == 0; xc.shift(), --ye ) {
    }

    /*
     * No need to check for Infinity as +x - +y != Infinity && -x - -y != Infinity
     * when neither x or y are Infinity.
     */

    // Underflow?
    if ( ye < MIN_EXP || !xc[0] ) {

        /*
         * Following IEEE 754 (2008) 6.3,
         * n - n = +0  but  n - n = -0 when rounding towards -Infinity.
         */
        if ( !xc[0] ) {
            y['s'] = ROUNDING_MODE == 3 ? -1 : 1;
        }

        // Result is zero.
        xc = [ye = 0];
    }

    return y['c'] = xc, y['e'] = ye, y;
};


/*
 *   n % 0 =  N
 *   n % N =  N
 *   0 % n =  0
 *  -0 % n = -0
 *   0 % 0 =  N
 *   0 % N =  N
 *   N % n =  N
 *   N % 0 =  N
 *   N % N =  N
 *
 * Return a new BigNumber whose value is the value of this BigNumber modulo
 * the value of BigNumber(y, b).
 */
P['modulo'] = P['mod'] = function ( y, b ) {
    var x = this,
        xc = x['c'],
        yc = ( id = 9, y = new BigNumber( y, b ) )['c'],
        i = x['s'],
        j = y['s'];

    // Is x or y NaN, or y zero?
    b = !i || !j || yc && !yc[0];

    if ( b || xc && !xc[0] ) {
        return new BigNumber( b ? NaN : x );
    }

    x['s'] = y['s'] = 1;
    b = y['cmp'](x) == 1;
    x['s'] = i, y['s'] = j;

    return b
      ? new BigNumber(x)
      : ( i = DECIMAL_PLACES, j = ROUNDING_MODE,
        DECIMAL_PLACES = 0, ROUNDING_MODE = 1,
          x = x['div'](y),
            DECIMAL_PLACES = i, ROUNDING_MODE = j,
              this['minus']( x['times'](y) ) );
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * negated, i.e. multiplied by -1.
 */
P['negated'] = P['neg'] = function () {
    var x = new BigNumber(this);

    return x['s'] = -x['s'] || null, x;
};


/*
 *  n + 0 = n
 *  n + N = N
 *  n + I = I
 *  0 + n = n
 *  0 + 0 = 0
 *  0 + N = N
 *  0 + I = I
 *  N + n = N
 *  N + 0 = N
 *  N + N = N
 *  N + I = N
 *  I + n = I
 *  I + 0 = I
 *  I + N = N
 *  I + I = I
 *
 * Return a new BigNumber whose value is the value of this BigNumber plus
 * the value of BigNumber(y, b).
 */
P['plus'] = P['add'] = function ( y, b ) {
    var d,
        x = this,
        a = x['s'];

    b = ( id = 10, y = new BigNumber( y, b ) )['s'];

    // Either NaN?
    if ( !a || !b ) {
        return new BigNumber(NaN);
    }

    // Signs differ?
    if ( a != b ) {
        return y['s'] = -b, x['minus'](y);
    }

    var xe = x['e'],
        xc = x['c'],
        ye = y['e'],
        yc = y['c'];

    if ( !xe || !ye ) {

        // Either Infinity?
        if ( !xc || !yc ) {

            // Return +-Infinity.
            return new BigNumber( a / 0 );
        }

        // Either zero?
        if ( !xc[0] || !yc[0] ) {

            // y is non-zero?
            return yc[0]
              ? y

              // x is non-zero?
              : new BigNumber( xc[0]
                ? x

                // Both are zero. Return zero.
                : a * 0 );
        }
    }

    // Prepend zeros to equalise exponents.
    // Note: Faster to use reverse then do unshifts.
    if ( xc = xc.slice(), a = xe - ye ) {
        d = a > 0 ? ( ye = xe, yc ) : ( a = -a, xc );

        for ( d.reverse(); a--; d.push(0) ) {
        }
        d.reverse();
    }

    // Point xc to the longer array.
    if ( xc.length - yc.length < 0 ) {
        d = yc, yc = xc, xc = d;
    }

    /*
     * Only start adding at yc.length - 1 as the
     * further digits of xc can be left as they are.
     */
    for ( a = yc.length, b = 0; a;
         b = ( xc[--a] = xc[a] + yc[a] + b ) / 10 ^ 0, xc[a] %= 10 ) {
    }

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if ( b ) {
        xc.unshift(b);

        // Overflow? (MAX_EXP + 1 possible)
        if ( ++ye > MAX_EXP ) {

            // Infinity.
            xc = ye = null;
        }
    }

     // Remove trailing zeros.
    for ( a = xc.length; xc[--a] == 0; xc.pop() ) {
    }

    return y['c'] = xc, y['e'] = ye, y;
};


/*
 * Return a BigNumber whose value is the value of this BigNumber raised to
 * the power e. If e is negative round according to DECIMAL_PLACES and
 * ROUNDING_MODE.
 *
 * e {number} Integer, -MAX_POWER to MAX_POWER inclusive.
 */
P['toPower'] = P['pow'] = function ( e ) {

    // e to integer, avoiding NaN or Infinity becoming 0.
    var i = e * 0 == 0 ? e | 0 : e,
        x = new BigNumber(this),
        y = new BigNumber(ONE);

    // Use Math.pow?
    // Pass +-Infinity for out of range exponents.
    if ( ( ( ( outOfRange = e < -MAX_POWER || e > MAX_POWER ) &&
      (i = e * 1 / 0) ) ||

         /*
          * Any exponent that fails the parse becomes NaN.
          *
          * Include 'e !== 0' because on Opera -0 == parseFloat(-0) is false,
          * despite -0 === parseFloat(-0) && -0 == parseFloat('-0') is true.
          */
         parse(e) != e && e !== 0 && !(i = NaN) ) &&

          // 'pow() exponent not an integer: {e}'
          // 'pow() exponent out of range: {e}'
          !ifExceptionsThrow( e, 'exponent', 'pow' ) ||

            // Pass zero to Math.pow, as any value to the power zero is 1.
            !i ) {

        // i is +-Infinity, NaN or 0.
        return new BigNumber( Math.pow( x['toS'](), i ) );
    }

    for ( i = i < 0 ? -i : i; ; ) {

        if ( i & 1 ) {
            y = y['times'](x);
        }
        i >>= 1;

        if ( !i ) {
            break;
        }
        x = x['times'](x);
    }

    return e < 0 ? ONE['div'](y) : y;
};


/*
 * Return a BigNumber whose value is the value of this BigNumber raised to
 * the power m modulo n.
 *
 * m {BigNumber} the value to take the power of
 * n {BigNumber} the value to modulo by
 */
P['powm'] = function ( m, n ) {
    return this.pow(m).mod(n);
};


/*
 * Return a new BigNumber whose value is the value of this BigNumber
 * rounded to a maximum of dp decimal places using rounding mode rm, or to
 * 0 and ROUNDING_MODE respectively if omitted.
 *
 * [dp] {number} Integer, 0 to MAX inclusive.
 * [rm] {number} Integer, 0 to 8 inclusive.
 */
P['round'] = function ( dp, rm ) {

    dp = dp == null || ( ( ( outOfRange = dp < 0 || dp > MAX ) ||
      parse(dp) != dp ) &&

        // 'round() decimal places out of range: {dp}'
        // 'round() decimal places not an integer: {dp}'
        !ifExceptionsThrow( dp, 'decimal places', 'round' ) )
          ? 0
          : dp | 0;

    rm = rm == null || ( ( ( outOfRange = rm < 0 || rm > 8 ) ||

      // Include '&& rm !== 0' because with Opera -0 == parseFloat(-0) is false.
      parse(rm) != rm && rm !== 0 ) &&

        // 'round() mode not an integer: {rm}'
        // 'round() mode out of range: {rm}'
        !ifExceptionsThrow( rm, 'mode', 'round' ) )
          ? ROUNDING_MODE
          : rm | 0;

    return setMode( this, dp, rm );
};


/*
 *  sqrt(-n) =  N
 *  sqrt( N) =  N
 *  sqrt(-I) =  N
 *  sqrt( I) =  I
 *  sqrt( 0) =  0
 *  sqrt(-0) = -0
 *
 * Return a new BigNumber whose value is the square root of the value of
 * this BigNumber, rounded according to DECIMAL_PLACES and ROUNDING_MODE.
 */
P['squareRoot'] = P['sqrt'] = function () {
    var n, r, re, t,
        x = this,
        c = x['c'],
        s = x['s'],
        e = x['e'],
        dp = DECIMAL_PLACES,
        rm = ROUNDING_MODE,
        half = new BigNumber('0.5');

    // Negative/NaN/Infinity/zero?
    if ( s !== 1 || !c || !c[0] ) {

        return new BigNumber( !s || s < 0 && ( !c || c[0] )
          ? NaN
          : c ? x : 1 / 0 );
    }

    // Initial estimate.
    s = Math.sqrt( x['toS']() );
    ROUNDING_MODE = 1;

    /*
      Math.sqrt underflow/overflow?
      Pass x to Math.sqrt as integer, then adjust the exponent of the result.
     */
    if ( s == 0 || s == 1 / 0 ) {
        n = c.join('');

        if ( !( n.length + e & 1 ) ) {
            n += '0';
        }
        r = new BigNumber( Math.sqrt(n) + '' );

        // r may still not be finite.
        if ( !r['c'] ) {
            r['c'] = [1];
        }
        r['e'] = ( ( ( e + 1 ) / 2 ) | 0 ) - ( e < 0 || e & 1 );
    } else {
        r = new BigNumber( n = s.toString() );
    }
    re = r['e'];
    s = re + ( DECIMAL_PLACES += 4 );

    if ( s < 3 ) {
        s = 0;
    }
    e = s;

    // Newton-Raphson iteration.
    for ( ; ; ) {
        t = r;
        r = half['times']( t['plus']( x['div'](t) ) );

        if ( t['c'].slice( 0, s ).join('') === r['c'].slice( 0, s ).join('') ) {
            c = r['c'];

            /*
              The exponent of r may here be one less than the final result
              exponent (re), e.g 0.0009999 (e-4) --> 0.001 (e-3), so adjust
              s so the rounding digits are indexed correctly.
             */
            s = s - ( n && r['e'] < re );

            /*
              The 4th rounding digit may be in error by -1 so if the 4 rounding
              digits are 9999 or 4999 (i.e. approaching a rounding boundary)
              continue the iteration.
             */
            if ( c[s] == 9 && c[s - 1] == 9 && c[s - 2] == 9 &&
                    ( c[s - 3] == 9 || n && c[s - 3] == 4 ) ) {

                /*
                  If 9999 on first run through, check to see if rounding up
                  gives the exact result as the nines may infinitely repeat.
                 */
                if ( n && c[s - 3] == 9 ) {
                    t = r['round']( dp, 0 );

                    if ( t['times'](t)['eq'](x) ) {
                        ROUNDING_MODE = rm;
                        DECIMAL_PLACES = dp;

                        return t;
                    }
                }
                DECIMAL_PLACES += 4;
                s += 4;
                n = '';
            } else {

                /*
                  If the rounding digits are null, 0000 or 5000, check for an
                  exact result. If not, then there are further digits so
                  increment the 1st rounding digit to ensure correct rounding.
                 */
                if ( !c[e] && !c[e - 1] && !c[e - 2] &&
                        ( !c[e - 3] || c[e - 3] == 5 ) ) {

                    // Truncate to the first rounding digit.
                    if ( c.length > e - 2 ) {
                        c.length = e - 2;
                    }

                    if ( !r['times'](r)['eq'](x) ) {

                        while ( c.length < e - 3 ) {
                            c.push(0);
                        }
                        c[e - 3]++;
                    }
                }
                ROUNDING_MODE = rm;
                rnd( r, DECIMAL_PLACES = dp, 10 );

                return r;
            }
        }
    }
};


/*
 *  n * 0 = 0
 *  n * N = N
 *  n * I = I
 *  0 * n = 0
 *  0 * 0 = 0
 *  0 * N = N
 *  0 * I = N
 *  N * n = N
 *  N * 0 = N
 *  N * N = N
 *  N * I = N
 *  I * n = I
 *  I * 0 = N
 *  I * N = N
 *  I * I = I
 *
 * Return a new BigNumber whose value is the value of this BigNumber times
 * the value of BigNumber(y, b).
 */
P['times'] = P['mul'] = function ( y, b ) {
    var c,
        x = this,
        xc = x['c'],
        yc = ( id = 11, y = new BigNumber( y, b ) )['c'],
        i = x['e'],
        j = y['e'],
        a = x['s'];

    y['s'] = a == ( b = y['s'] ) ? 1 : -1;

    // Either NaN/Infinity/0?
    if ( !i && ( !xc || !xc[0] ) || !j && ( !yc || !yc[0] ) ) {

        // Either NaN?
        return new BigNumber( !a || !b ||

          // x is 0 and y is Infinity  or  y is 0 and x is Infinity?
          xc && !xc[0] && !yc || yc && !yc[0] && !xc

            // Return NaN.
            ? NaN

            // Either Infinity?
            : !xc || !yc

              // Return +-Infinity.
              ? y['s'] / 0

              // x or y is 0. Return +-0.
              : y['s'] * 0 );
    }
    y['e'] = i + j;

    if ( ( a = xc.length ) < ( b = yc.length ) ) {
        c = xc, xc = yc, yc = c, j = a, a = b, b = j;
    }

    for ( j = a + b, c = []; j--; c.push(0) ) {
    }

    // Multiply!
    for ( i = b - 1; i > -1; i-- ) {

        for ( b = 0, j = a + i;
              j > i;
              b = c[j] + yc[i] * xc[j - i - 1] + b,
              c[j--] = b % 10 | 0,
              b = b / 10 | 0 ) {
        }

        if ( b ) {
            c[j] = ( c[j] + b ) % 10;
        }
    }

    b && ++y['e'];

    // Remove any leading zero.
    !c[0] && c.shift();

    // Remove trailing zeros.
    for ( j = c.length; !c[--j]; c.pop() ) {
    }

    // No zero check needed as only x * 0 == 0 etc.

    // Overflow?
    y['c'] = y['e'] > MAX_EXP

      // Infinity.
      ? ( y['e'] = null )

      // Underflow?
      : y['e'] < MIN_EXP

        // Zero.
        ? [ y['e'] = 0 ]

        // Neither.
        : c;

    return y;
};

/*
 * Return a buffer containing the 
 */
P['toBuffer'] = function ( opts ) {

    if (typeof opts === 'string') {
        if (opts !== 'mpint') return 'Unsupported Buffer representation';

        var abs = this.abs();
        var buf = abs.toBuffer({ size : 1, endian : 'big' });
        var len = buf.length === 1 && buf[0] === 0 ? 0 : buf.length;
        if (buf[0] & 0x80) len ++;

        var ret = new Buffer(4 + len);
        if (len > 0) buf.copy(ret, 4 + (buf[0] & 0x80 ? 1 : 0));
        if (buf[0] & 0x80) ret[4] = 0;

        ret[0] = len & (0xff << 24);
        ret[1] = len & (0xff << 16);
        ret[2] = len & (0xff << 8);
        ret[3] = len & (0xff << 0);

        // two's compliment for negative integers:
        var isNeg = this.lt(0);
        if (isNeg) {
            for (var i = 4; i < ret.length; i++) {
                ret[i] = 0xff - ret[i];
            }
        }
        ret[4] = (ret[4] & 0x7f) | (isNeg ? 0x80 : 0);
        if (isNeg) ret[ret.length - 1] ++;

        return ret;
    }

    if (!opts) opts = {};

    var endian = { 1 : 'big', '-1' : 'little' }[opts.endian]
        || opts.endian || 'big'
    ;

    var hex = this.toString(16);
    if (hex.charAt(0) === '-') throw new Error(
        'converting negative numbers to Buffers not supported yet'
    );

    var size = opts.size === 'auto' ? Math.ceil(hex.length / 2) : (opts.size || 1);

    var len = Math.ceil(hex.length / (2 * size)) * size;
    var buf = new Buffer(len);

    // zero-pad the hex string so the chunks are all `size` long
    while (hex.length < 2 * len) hex = '0' + hex;

    var hx = hex
        .split(new RegExp('(.{' + (2 * size) + '})'))
        .filter(function (s) { return s.length > 0 })
    ;

    hx.forEach(function (chunk, i) {
        for (var j = 0; j < size; j++) {
            var ix = i * size + (endian === 'big' ? j : size - j - 1);
            buf[ix] = parseInt(chunk.slice(j*2,j*2+2), 16);
        }
    });

    return buf;
};

/*
 * Return a string representing the value of this BigNumber in exponential
 * notation to dp fixed decimal places and rounded using ROUNDING_MODE if
 * necessary.
 *
 * [dp] {number} Integer, 0 to MAX inclusive.
 */
P['toExponential'] = P['toE'] = function ( dp ) {

    return format( this,
      ( dp == null || ( ( outOfRange = dp < 0 || dp > MAX ) ||

        /*
         * Include '&& dp !== 0' because with Opera -0 == parseFloat(-0) is
         * false, despite -0 == parseFloat('-0') && 0 == -0 being true.
         */
        parse(dp) != dp && dp !== 0 ) &&

          // 'toE() decimal places not an integer: {dp}'
          // 'toE() decimal places out of range: {dp}'
          !ifExceptionsThrow( dp, 'decimal places', 'toE' ) ) && this['c']
            ? this['c'].length - 1
            : dp | 0, 1 );
};


/*
 * Return a string representing the value of this BigNumber in normal
 * notation to dp fixed decimal places and rounded using ROUNDING_MODE if
 * necessary.
 *
 * Note: as with JavaScript's number type, (-0).toFixed(0) is '0',
 * but e.g. (-0.00001).toFixed(0) is '-0'.
 *
 * [dp] {number} Integer, 0 to MAX inclusive.
 */
P['toFixed'] = P['toF'] = function ( dp ) {
    var n, str, d,
        x = this;

    if ( !( dp == null || ( ( outOfRange = dp < 0 || dp > MAX ) ||
        parse(dp) != dp && dp !== 0 ) &&

        // 'toF() decimal places not an integer: {dp}'
        // 'toF() decimal places out of range: {dp}'
        !ifExceptionsThrow( dp, 'decimal places', 'toF' ) ) ) {
          d = x['e'] + ( dp | 0 );
    }

    n = TO_EXP_NEG, dp = TO_EXP_POS;
    TO_EXP_NEG = -( TO_EXP_POS = 1 / 0 );

    // Note: str is initially undefined.
    if ( d == str ) {
        str = x['toS']();
    } else {
        str = format( x, d );

        // (-0).toFixed() is '0', but (-0.1).toFixed() is '-0'.
        // (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
        if ( x['s'] < 0 && x['c'] ) {

            // As e.g. -0 toFixed(3), will wrongly be returned as -0.000 from toString.
            if ( !x['c'][0] ) {
                str = str.replace(/^-/, '');

            // As e.g. -0.5 if rounded to -0 will cause toString to omit the minus sign.
            } else if ( str.indexOf('-') < 0 ) {
                str = '-' + str;
            }
        }
    }
    TO_EXP_NEG = n, TO_EXP_POS = dp;

    return str;
};


/*
 * Return a string array representing the value of this BigNumber as a
 * simple fraction with an integer numerator and an integer denominator.
 * The denominator will be a positive non-zero value less than or equal to
 * the specified maximum denominator. If a maximum denominator is not
 * specified, the denominator will be the lowest value necessary to
 * represent the number exactly.
 *
 * [maxD] {number|string|BigNumber} Integer >= 1 and < Infinity.
 */
P['toFraction'] = P['toFr'] = function ( maxD ) {
    var q, frac, n0, d0, d2, n, e,
        n1 = d0 = new BigNumber(ONE),
        d1 = n0 = new BigNumber('0'),
        x = this,
        xc = x['c'],
        exp = MAX_EXP,
        dp = DECIMAL_PLACES,
        rm = ROUNDING_MODE,
        d = new BigNumber(ONE);

    // NaN, Infinity.
    if ( !xc ) {
        return x['toS']();
    }

    e = d['e'] = xc.length - x['e'] - 1;

    // If max denominator is undefined or null...
    if ( maxD == null ||

         // or NaN...
         ( !( id = 12, n = new BigNumber(maxD) )['s'] ||

           // or less than 1, or Infinity...
           ( outOfRange = n['cmp'](n1) < 0 || !n['c'] ) ||

             // or not an integer...
             ( ERRORS && n['e'] < n['c'].length - 1 ) ) &&

               // 'toFr() max denominator not an integer: {maxD}'
               // 'toFr() max denominator out of range: {maxD}'
               !ifExceptionsThrow( maxD, 'max denominator', 'toFr' ) ||

                 // or greater than the maxD needed to specify the value exactly...
                 ( maxD = n )['cmp'](d) > 0 ) {

        // d is e.g. 10, 100, 1000, 10000... , n1 is 1.
        maxD = e > 0 ? d : n1;
    }

    MAX_EXP = 1 / 0;
    n = new BigNumber( xc.join('') );

    for ( DECIMAL_PLACES = 0, ROUNDING_MODE = 1; ; )  {
        q = n['div'](d);
        d2 = d0['plus']( q['times'](d1) );

        if ( d2['cmp'](maxD) == 1 ) {
            break;
        }

        d0 = d1, d1 = d2;

        n1 = n0['plus']( q['times']( d2 = n1 ) );
        n0 = d2;

        d = n['minus']( q['times']( d2 = d ) );
        n = d2;
    }

    d2 = maxD['minus'](d0)['div'](d1);
    n0 = n0['plus']( d2['times'](n1) );
    d0 = d0['plus']( d2['times'](d1) );

    n0['s'] = n1['s'] = x['s'];

    DECIMAL_PLACES = e * 2;
    ROUNDING_MODE = rm;

    // Determine which fraction is closer to x, n0 / d0 or n1 / d1?
    frac = n1['div'](d1)['minus'](x)['abs']()['cmp'](
      n0['div'](d0)['minus'](x)['abs']() ) < 1
      ? [ n1['toS'](), d1['toS']() ]
      : [ n0['toS'](), d0['toS']() ];

    return MAX_EXP = exp, DECIMAL_PLACES = dp, frac;
};


/*
 * Return a string representing the value of this BigNumber to sd significant
 * digits and rounded using ROUNDING_MODE if necessary.
 * If sd is less than the number of digits necessary to represent the integer
 * part of the value in normal notation, then use exponential notation.
 *
 * sd {number} Integer, 1 to MAX inclusive.
 */
P['toPrecision'] = P['toP'] = function ( sd ) {

    /*
     * ERRORS true: Throw if sd not undefined, null or an integer in range.
     * ERRORS false: Ignore sd if not a number or not in range.
     * Truncate non-integers.
     */
    return sd == null || ( ( ( outOfRange = sd < 1 || sd > MAX ) ||
      parse(sd) != sd ) &&

        // 'toP() precision not an integer: {sd}'
        // 'toP() precision out of range: {sd}'
        !ifExceptionsThrow( sd, 'precision', 'toP' ) )
          ? this['toS']()
          : format( this, --sd | 0, 2 );
};


/*
 * Return a string representing the value of this BigNumber in base b, or
 * base 10 if b is omitted. If a base is specified, including base 10,
 * round according to DECIMAL_PLACES and ROUNDING_MODE.
 * If a base is not specified, and this BigNumber has a positive exponent
 * that is equal to or greater than TO_EXP_POS, or a negative exponent equal
 * to or less than TO_EXP_NEG, return exponential notation.
 *
 * [b] {number} Integer, 2 to 64 inclusive.
 */
P['toString'] = P['toS'] = function ( b ) {
    var u, str, strL,
        x = this,
        xe = x['e'];

    // Infinity or NaN?
    if ( xe === null ) {
        str = x['s'] ? 'Infinity' : 'NaN';

    // Exponential format?
    } else if ( b === u && ( xe <= TO_EXP_NEG || xe >= TO_EXP_POS ) ) {
        return format( x, x['c'].length - 1, 1 );
    } else {
        str = x['c'].join('');

        // Negative exponent?
        if ( xe < 0 ) {

            // Prepend zeros.
            for ( ; ++xe; str = '0' + str ) {
            }
            str = '0.' + str;

        // Positive exponent?
        } else if ( strL = str.length, xe > 0 ) {

            if ( ++xe > strL ) {

                // Append zeros.
                for ( xe -= strL; xe-- ; str += '0' ) {
                }
            } else if ( xe < strL ) {
                str = str.slice( 0, xe ) + '.' + str.slice(xe);
            }

        // Exponent zero.
        } else {
            if ( u = str.charAt(0), strL > 1 ) {
                str = u + '.' + str.slice(1);

            // Avoid '-0'
            } else if ( u == '0' ) {
                return u;
            }
        }

        if ( b != null ) {

            if ( !( outOfRange = !( b >= 2 && b < 65 ) ) &&
              ( b == (b | 0) || !ERRORS ) ) {
                str = convert( str, b | 0, 10, x['s'] );

                // Avoid '-0'
                if ( str == '0' ) {
                    return str;
                }
            } else {

                // 'toS() base not an integer: {b}'
                // 'toS() base out of range: {b}'
                ifExceptionsThrow( b, 'base', 'toS' );
            }
        }

    }

    return x['s'] < 0 ? '-' + str : str;
};

P['toNumber'] = function () {
  return parseInt(this['toString'](), 10);
};


/*
 * Return as toString, but do not accept a base argument.
 */
P['valueOf'] = function () {
    return this['toS']();
};


// Add aliases for BigDecimal methods.
//P['add'] = P['plus'];
//P['subtract'] = P['minus'];
//P['multiply'] = P['times'];
//P['divide'] = P['div'];
//P['remainder'] = P['mod'];
//P['compareTo'] = P['cmp'];
//P['negate'] = P['neg'];


// EXPORT
BigNumber.config({EXPONENTIAL_AT: 9999999, DECIMAL_PLACES: 0, ROUNDING_MODE: 1});
module.exports = BigNumber;


}).call(this,require("buffer").Buffer)
},{"buffer":28}],26:[function(require,module,exports){
(function (process,__filename){

/**
 * Module dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , join = path.join
  , dirname = path.dirname
  , exists = fs.existsSync || path.existsSync
  , defaults = {
        arrow: process.env.NODE_BINDINGS_ARROW || ' → '
      , compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled'
      , platform: process.platform
      , arch: process.arch
      , version: process.versions.node
      , bindings: 'bindings.node'
      , try: [
          // node-gyp's linked version in the "build" dir
          [ 'module_root', 'build', 'bindings' ]
          // node-waf and gyp_addon (a.k.a node-gyp)
        , [ 'module_root', 'build', 'Debug', 'bindings' ]
        , [ 'module_root', 'build', 'Release', 'bindings' ]
          // Debug files, for development (legacy behavior, remove for node v0.9)
        , [ 'module_root', 'out', 'Debug', 'bindings' ]
        , [ 'module_root', 'Debug', 'bindings' ]
          // Release files, but manually compiled (legacy behavior, remove for node v0.9)
        , [ 'module_root', 'out', 'Release', 'bindings' ]
        , [ 'module_root', 'Release', 'bindings' ]
          // Legacy from node-waf, node <= 0.4.x
        , [ 'module_root', 'build', 'default', 'bindings' ]
          // Production "Release" buildtype binary (meh...)
        , [ 'module_root', 'compiled', 'version', 'platform', 'arch', 'bindings' ]
        ]
    }

/**
 * The main `bindings()` function loads the compiled bindings for a given module.
 * It uses V8's Error API to determine the parent filename that this function is
 * being invoked from, which is then used to find the root directory.
 */

function bindings (opts) {

  // Argument surgery
  if (typeof opts == 'string') {
    opts = { bindings: opts }
  } else if (!opts) {
    opts = {}
  }
  opts.__proto__ = defaults

  // Get the module root
  if (!opts.module_root) {
    opts.module_root = exports.getRoot(exports.getFileName())
  }

  // Ensure the given bindings name ends with .node
  if (path.extname(opts.bindings) != '.node') {
    opts.bindings += '.node'
  }

  var tries = []
    , i = 0
    , l = opts.try.length
    , n
    , b
    , err

  for (; i<l; i++) {
    n = join.apply(null, opts.try[i].map(function (p) {
      return opts[p] || p
    }))
    tries.push(n)
    try {
      b = opts.path ? require.resolve(n) : require(n)
      if (!opts.path) {
        b.path = n
      }
      return b
    } catch (e) {
      if (!/not find/i.test(e.message)) {
        throw e
      }
    }
  }

  err = new Error('Could not locate the bindings file. Tried:\n'
    + tries.map(function (a) { return opts.arrow + a }).join('\n'))
  err.tries = tries
  throw err
}
module.exports = exports = bindings


/**
 * Gets the filename of the JavaScript file that invokes this function.
 * Used to help find the root directory of a module.
 */

exports.getFileName = function getFileName () {
  var origPST = Error.prepareStackTrace
    , origSTL = Error.stackTraceLimit
    , dummy = {}
    , fileName

  Error.stackTraceLimit = 10

  Error.prepareStackTrace = function (e, st) {
    for (var i=0, l=st.length; i<l; i++) {
      fileName = st[i].getFileName()
      if (fileName !== __filename) {
        return
      }
    }
  }

  // run the 'prepareStackTrace' function above
  Error.captureStackTrace(dummy)
  dummy.stack

  // cleanup
  Error.prepareStackTrace = origPST
  Error.stackTraceLimit = origSTL

  return fileName
}

/**
 * Gets the root directory of a module, given an arbitrary filename
 * somewhere in the module tree. The "root directory" is the directory
 * containing the `package.json` file.
 *
 *   In:  /home/nate/node-native-module/lib/index.js
 *   Out: /home/nate/node-native-module
 */

exports.getRoot = function getRoot (file) {
  var dir = dirname(file)
    , prev
  while (true) {
    if (dir === '.') {
      // Avoids an infinite loop in rare cases, like the REPL
      dir = process.cwd()
    }
    if (exists(join(dir, 'package.json')) || exists(join(dir, 'node_modules'))) {
      // Found the 'package.json' file or 'node_modules' dir; we're done
      return dir
    }
    if (prev === dir) {
      // Got to the top
      throw new Error('Could not find module root given file: "' + file
                    + '". Do you have a `package.json` file? ')
    }
    // Try the parent dir next
    prev = dir
    dir = join(dir, '..')
  }
}

}).call(this,require("/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),"/node_modules/bitcore/node_modules/bindings/bindings.js")
},{"/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":43,"fs":27,"path":44}],27:[function(require,module,exports){

},{}],28:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":29,"ieee754":30}],29:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var ZERO   = '0'.charCodeAt(0)
	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	module.exports.toByteArray = b64ToByteArray
	module.exports.fromByteArray = uint8ToBase64
}())

},{}],30:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],31:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":28}],32:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":33,"./rng":34,"./sha":35,"./sha256":36,"buffer":28}],33:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":31}],34:[function(require,module,exports){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],35:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var helpers = require('./helpers');

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":31}],36:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
  /* append padding */
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":31}],37:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],38:[function(require,module,exports){
var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');
var url = require('url')

http.request = function (params, cb) {
    if (typeof params === 'string') {
        params = url.parse(params)
    }
    if (!params) params = {};
    if (!params.host && !params.port) {
        params.port = parseInt(window.location.port, 10);
    }
    if (!params.host && params.hostname) {
        params.host = params.hostname;
    }
    
    if (!params.scheme) params.scheme = window.location.protocol.split(':')[0];
    if (!params.host) {
        params.host = window.location.hostname || window.location.host;
    }
    if (/:/.test(params.host)) {
        if (!params.port) {
            params.port = params.host.split(':')[1];
        }
        params.host = params.host.split(':')[0];
    }
    if (!params.port) params.port = params.scheme == 'https' ? 443 : 80;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

http.STATUS_CODES = {
    100 : 'Continue',
    101 : 'Switching Protocols',
    102 : 'Processing',                 // RFC 2518, obsoleted by RFC 4918
    200 : 'OK',
    201 : 'Created',
    202 : 'Accepted',
    203 : 'Non-Authoritative Information',
    204 : 'No Content',
    205 : 'Reset Content',
    206 : 'Partial Content',
    207 : 'Multi-Status',               // RFC 4918
    300 : 'Multiple Choices',
    301 : 'Moved Permanently',
    302 : 'Moved Temporarily',
    303 : 'See Other',
    304 : 'Not Modified',
    305 : 'Use Proxy',
    307 : 'Temporary Redirect',
    400 : 'Bad Request',
    401 : 'Unauthorized',
    402 : 'Payment Required',
    403 : 'Forbidden',
    404 : 'Not Found',
    405 : 'Method Not Allowed',
    406 : 'Not Acceptable',
    407 : 'Proxy Authentication Required',
    408 : 'Request Time-out',
    409 : 'Conflict',
    410 : 'Gone',
    411 : 'Length Required',
    412 : 'Precondition Failed',
    413 : 'Request Entity Too Large',
    414 : 'Request-URI Too Large',
    415 : 'Unsupported Media Type',
    416 : 'Requested Range Not Satisfiable',
    417 : 'Expectation Failed',
    418 : 'I\'m a teapot',              // RFC 2324
    422 : 'Unprocessable Entity',       // RFC 4918
    423 : 'Locked',                     // RFC 4918
    424 : 'Failed Dependency',          // RFC 4918
    425 : 'Unordered Collection',       // RFC 4918
    426 : 'Upgrade Required',           // RFC 2817
    428 : 'Precondition Required',      // RFC 6585
    429 : 'Too Many Requests',          // RFC 6585
    431 : 'Request Header Fields Too Large',// RFC 6585
    500 : 'Internal Server Error',
    501 : 'Not Implemented',
    502 : 'Bad Gateway',
    503 : 'Service Unavailable',
    504 : 'Gateway Time-out',
    505 : 'HTTP Version Not Supported',
    506 : 'Variant Also Negotiates',    // RFC 2295
    507 : 'Insufficient Storage',       // RFC 4918
    509 : 'Bandwidth Limit Exceeded',
    510 : 'Not Extended',               // RFC 2774
    511 : 'Network Authentication Required' // RFC 6585
};
},{"./lib/request":39,"events":37,"url":57}],39:[function(require,module,exports){
var Stream = require('stream');
var Response = require('./response');
var Base64 = require('Base64');
var inherits = require('inherits');

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.writable = true;
    self.xhr = xhr;
    self.body = [];
    
    self.uri = (params.scheme || 'http') + '://'
        + params.host
        + (params.port ? ':' + params.port : '')
        + (params.path || '/')
    ;
    
    if (typeof params.withCredentials === 'undefined') {
        params.withCredentials = true;
    }

    try { xhr.withCredentials = params.withCredentials }
    catch (e) {}
    
    xhr.open(
        params.method || 'GET',
        self.uri,
        true
    );

    self._headers = {};
    
    if (params.headers) {
        var keys = objectKeys(params.headers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!self.isSafeRequestHeader(key)) continue;
            var value = params.headers[key];
            self.setHeader(key, value);
        }
    }
    
    if (params.auth) {
        //basic auth
        this.setHeader('Authorization', 'Basic ' + Base64.btoa(params.auth));
    }

    var res = new Response;
    res.on('close', function () {
        self.emit('close');
    });
    
    res.on('ready', function () {
        self.emit('response', res);
    });
    
    xhr.onreadystatechange = function () {
        // Fix for IE9 bug
        // SCRIPT575: Could not complete the operation due to error c00c023f
        // It happens when a request is aborted, calling the success callback anyway with readyState === 4
        if (xhr.__aborted) return;
        res.handle(xhr);
    };
};

inherits(Request, Stream);

Request.prototype.setHeader = function (key, value) {
    this._headers[key.toLowerCase()] = value
};

Request.prototype.getHeader = function (key) {
    return this._headers[key.toLowerCase()]
};

Request.prototype.removeHeader = function (key) {
    delete this._headers[key.toLowerCase()]
};

Request.prototype.write = function (s) {
    this.body.push(s);
};

Request.prototype.destroy = function (s) {
    this.xhr.__aborted = true;
    this.xhr.abort();
    this.emit('close');
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.push(s);

    var keys = objectKeys(this._headers);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = this._headers[key];
        if (isArray(value)) {
            for (var j = 0; j < value.length; j++) {
                this.xhr.setRequestHeader(key, value[j]);
            }
        }
        else this.xhr.setRequestHeader(key, value)
    }

    if (this.body.length === 0) {
        this.xhr.send('');
    }
    else if (typeof this.body[0] === 'string') {
        this.xhr.send(this.body.join(''));
    }
    else if (isArray(this.body[0])) {
        var body = [];
        for (var i = 0; i < this.body.length; i++) {
            body.push.apply(body, this.body[i]);
        }
        this.xhr.send(body);
    }
    else if (/Array/.test(Object.prototype.toString.call(this.body[0]))) {
        var len = 0;
        for (var i = 0; i < this.body.length; i++) {
            len += this.body[i].length;
        }
        var body = new(this.body[0].constructor)(len);
        var k = 0;
        
        for (var i = 0; i < this.body.length; i++) {
            var b = this.body[i];
            for (var j = 0; j < b.length; j++) {
                body[k++] = b[j];
            }
        }
        this.xhr.send(body);
    }
    else {
        var body = '';
        for (var i = 0; i < this.body.length; i++) {
            body += this.body[i].toString();
        }
        this.xhr.send(body);
    }
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return indexOf(Request.unsafeHeaders, headerName.toLowerCase()) === -1;
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var indexOf = function (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (xs[i] === x) return i;
    }
    return -1;
};

},{"./response":40,"Base64":41,"inherits":42,"stream":50}],40:[function(require,module,exports){
var Stream = require('stream');
var util = require('util');

var Response = module.exports = function (res) {
    this.offset = 0;
    this.readable = true;
};

util.inherits(Response, Stream);

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
            
                if (isArray(headers[key])) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = String(xhr.responseType).toLowerCase();
    if (respType === 'blob') return xhr.responseBlob || xhr.response;
    if (respType === 'arraybuffer') return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this._emitData(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this._emitData(res);
        
        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
        
        this.emit('close');
    }
};

Response.prototype._emitData = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{"stream":50,"util":59}],41:[function(require,module,exports){
;(function () {

  var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next input index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      input.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = input.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    input = input.replace(/=+$/, '');
    if (input.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],42:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],43:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],44:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":43}],45:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],46:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],47:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return obj[k].map(function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],48:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":46,"./encode":47}],49:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;
var inherits = require('inherits');
var setImmediate = require('process/browser.js').nextTick;
var Readable = require('./readable.js');
var Writable = require('./writable.js');

inherits(Duplex, Readable);

Duplex.prototype.write = Writable.prototype.write;
Duplex.prototype.end = Writable.prototype.end;
Duplex.prototype._write = Writable.prototype._write;

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  var self = this;
  setImmediate(function () {
    self.end();
  });
}

},{"./readable.js":53,"./writable.js":55,"inherits":42,"process/browser.js":51}],50:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('./readable.js');
Stream.Writable = require('./writable.js');
Stream.Duplex = require('./duplex.js');
Stream.Transform = require('./transform.js');
Stream.PassThrough = require('./passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"./duplex.js":49,"./passthrough.js":52,"./readable.js":53,"./transform.js":54,"./writable.js":55,"events":37,"inherits":42}],51:[function(require,module,exports){
module.exports=require(43)
},{}],52:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./transform.js');
var inherits = require('inherits');
inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./transform.js":54,"inherits":42}],53:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;
Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;
var Stream = require('./index.js');
var Buffer = require('buffer').Buffer;
var setImmediate = require('process/browser.js').nextTick;
var StringDecoder;

var inherits = require('inherits');
inherits(Readable, Stream);

function ReadableState(options, stream) {
  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = false;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // In streams that never have any data, and do push(null) right away,
  // the consumer can miss the 'end' event if they do some I/O before
  // consuming the stream.  So, we don't emit('end') until some reading
  // happens.
  this.calledRead = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (typeof chunk === 'string' && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null || chunk === undefined) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      // update the buffer info.
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront) {
        state.buffer.unshift(chunk);
      } else {
        state.reading = false;
        state.buffer.push(chunk);
      }

      if (state.needReadable)
        emitReadable(stream);

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || n === null) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  var state = this._readableState;
  state.calledRead = true;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;

  // if we currently have less than the highWaterMark, then also read some
  if (state.length - n <= state.highWaterMark)
    doRead = true;

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading)
    doRead = false;

  if (doRead) {
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read called its callback synchronously, then `reading`
  // will be false, and we need to re-evaluate how much data we
  // can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we happened to read() exactly the remaining amount in the
  // buffer, and the EOF has been seen at this point, then make sure
  // that we emit 'end' on the very next tick.
  if (state.ended && !state.endEmitted && state.length === 0)
    endReadable(this);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode &&
      !er) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // if we've ended and we have some data left, then emit
  // 'readable' now to make sure it gets picked up.
  if (state.length > 0)
    emitReadable(stream);
  else
    endReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (state.emittedReadable)
    return;

  state.emittedReadable = true;
  if (state.sync)
    setImmediate(function() {
      emitReadable_(stream);
    });
  else
    emitReadable_(stream);
}

function emitReadable_(stream) {
  stream.emit('readable');
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    setImmediate(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    setImmediate(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    if (readable !== src) return;
    cleanup();
  }

  function onend() {
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (!dest._writableState || dest._writableState.needDrain)
      ondrain();
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  // check for listeners before emit removes one-time listeners.
  var errListeners = EE.listenerCount(dest, 'error');
  function onerror(er) {
    unpipe();
    if (errListeners === 0 && EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  dest.once('error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    // the handler that waits for readable events after all
    // the data gets sucked out in flow.
    // This would be easier to follow with a .once() handler
    // in flow(), but that is too slow.
    this.on('readable', pipeOnReadable);

    state.flowing = true;
    setImmediate(function() {
      flow(src);
    });
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var dest = this;
    var state = src._readableState;
    state.awaitDrain--;
    if (state.awaitDrain === 0)
      flow(src);
  };
}

function flow(src) {
  var state = src._readableState;
  var chunk;
  state.awaitDrain = 0;

  function write(dest, i, list) {
    var written = dest.write(chunk);
    if (false === written) {
      state.awaitDrain++;
    }
  }

  while (state.pipesCount && null !== (chunk = src.read())) {

    if (state.pipesCount === 1)
      write(state.pipes, 0, null);
    else
      forEach(state.pipes, write);

    src.emit('data', chunk);

    // if anyone needs a drain, then we have to wait for that.
    if (state.awaitDrain > 0)
      return;
  }

  // if every destination was unpiped, either before entering this
  // function, or in the while loop, then stop flowing.
  //
  // NB: This is a pretty rare edge case.
  if (state.pipesCount === 0) {
    state.flowing = false;

    // if there were data event listeners added, then switch to old mode.
    if (EE.listenerCount(src, 'data') > 0)
      emitDataEvents(src);
    return;
  }

  // at this point, no one needed a drain, so we just ran out of data
  // on the next readable event, start it over again.
  state.ranOut = true;
}

function pipeOnReadable() {
  if (this._readableState.ranOut) {
    this._readableState.ranOut = false;
    flow(this);
  }
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data' && !this._readableState.flowing)
    emitDataEvents(this);

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        this.read(0);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  emitDataEvents(this);
  this.read(0);
  this.emit('resume');
};

Readable.prototype.pause = function() {
  emitDataEvents(this, true);
  this.emit('pause');
};

function emitDataEvents(stream, startPaused) {
  var state = stream._readableState;

  if (state.flowing) {
    // https://github.com/isaacs/readable-stream/issues/16
    throw new Error('Cannot switch to old mode now.');
  }

  var paused = startPaused || false;
  var readable = false;

  // convert to an old-style stream.
  stream.readable = true;
  stream.pipe = Stream.prototype.pipe;
  stream.on = stream.addListener = Stream.prototype.on;

  stream.on('readable', function() {
    readable = true;

    var c;
    while (!paused && (null !== (c = stream.read())))
      stream.emit('data', c);

    if (c === null) {
      readable = false;
      stream._readableState.needReadable = true;
    }
  });

  stream.pause = function() {
    paused = true;
    this.emit('pause');
  };

  stream.resume = function() {
    paused = false;
    if (readable)
      setImmediate(function() {
        stream.emit('readable');
      });
    else
      this.read(0);
    this.emit('resume');
  };

  // now make it start, just in case it hadn't already.
  stream.emit('readable');
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (typeof stream[i] === 'function' &&
        typeof this[i] === 'undefined') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, function (x) {
      return self.emit.apply(self, ev, x);
    });
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted && state.calledRead) {
    state.ended = true;
    setImmediate(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require("/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"./index.js":50,"/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":43,"buffer":28,"events":37,"inherits":42,"process/browser.js":51,"string_decoder":56}],54:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./duplex.js');
var inherits = require('inherits');
inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  var ts = this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('finish', function() {
    if ('function' === typeof this._flush)
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var rs = stream._readableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./duplex.js":49,"inherits":42}],55:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;
Writable.WritableState = WritableState;

var isUint8Array = typeof Uint8Array !== 'undefined'
  ? function (x) { return x instanceof Uint8Array }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'Uint8Array'
  }
;
var isArrayBuffer = typeof ArrayBuffer !== 'undefined'
  ? function (x) { return x instanceof ArrayBuffer }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'ArrayBuffer'
  }
;

var inherits = require('inherits');
var Stream = require('./index.js');
var setImmediate = require('process/browser.js').nextTick;
var Buffer = require('buffer').Buffer;

inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];
}

function Writable(options) {
  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Stream.Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  setImmediate(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    setImmediate(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (!Buffer.isBuffer(chunk) && isUint8Array(chunk))
    chunk = new Buffer(chunk);
  if (isArrayBuffer(chunk) && typeof Uint8Array !== 'undefined')
    chunk = new Buffer(new Uint8Array(chunk));
  
  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb))
    ret = writeOrBuffer(this, state, chunk, encoding, cb);

  return ret;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  state.needDrain = !ret;

  if (state.writing)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    setImmediate(function() {
      cb(er);
    });
  else
    cb(er);

  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && !state.bufferProcessing && state.buffer.length)
      clearBuffer(stream, state);

    if (sync) {
      setImmediate(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  for (var c = 0; c < state.buffer.length; c++) {
    var entry = state.buffer[c];
    var chunk = entry.chunk;
    var encoding = entry.encoding;
    var cb = entry.callback;
    var len = state.objectMode ? 1 : chunk.length;

    doWrite(stream, state, len, chunk, encoding, cb);

    // if we didn't call the onwrite immediately, then
    // it means that we need to wait until it does.
    // also, that means that the chunk and cb are currently
    // being processed, so move the buffer counter past them.
    if (state.writing) {
      c++;
      break;
    }
  }

  state.bufferProcessing = false;
  if (c < state.buffer.length)
    state.buffer = state.buffer.slice(c);
  else
    state.buffer.length = 0;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk, encoding);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      setImmediate(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./index.js":50,"buffer":28,"inherits":42,"process/browser.js":51}],56:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  this.charBuffer = new Buffer(6);
  this.charReceived = 0;
  this.charLength = 0;
};


StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  var offset = 0;

  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, offset, i);
    this.charReceived += (i - offset);
    offset = i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
    break;
  }

  var lenIncomplete = this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - lenIncomplete, end);
    this.charReceived = lenIncomplete;
    end -= lenIncomplete;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    this.charBuffer.write(charStr.charAt(charStr.length - 1), this.encoding);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  return i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 2;
  this.charLength = incomplete ? 2 : 0;
  return incomplete;
}

function base64DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 3;
  this.charLength = incomplete ? 3 : 0;
  return incomplete;
}

},{"buffer":28}],57:[function(require,module,exports){
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(delims),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = rest.indexOf('@');
    if (atSign !== -1) {
      var auth = rest.slice(0, atSign);

      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        if (auth.indexOf(nonAuthChars[i]) !== -1) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }

      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = decodeURIComponent(auth);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = rest.indexOf(nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = Object.keys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = out.hostname[0] === '[' &&
        out.hostname[out.hostname.length - 1] === ']';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else if (!ipv6Hostname) {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = out.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      out.hostname = newOut.join('.');
    }

    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;

    // strip [ and ] from the hostname
    if (ipv6Hostname) {
      out.hostname = out.hostname.substr(1, out.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = obj.protocol || '',
      pathname = obj.pathname || '',
      hash = obj.hash || '',
      host = false,
      query = '';

  if (obj.host !== undefined) {
    host = auth + obj.host;
  } else if (obj.hostname !== undefined) {
    host = auth + (obj.hostname.indexOf(':') === -1 ?
        obj.hostname :
        '[' + obj.hostname + ']');
    if (obj.port) {
      host += ':' + obj.port;
    }
  }

  if (obj.query && typeof obj.query === 'object' &&
      Object.keys(obj.query).length) {
    query = querystring.stringify(obj.query);
  }

  var search = obj.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && source.host.indexOf('@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && source.host.indexOf('@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      out.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}

}());

},{"punycode":45,"querystring":48}],58:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],59:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":58,"/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":43,"inherits":42}],60:[function(require,module,exports){

module.exports = function(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
};

},{}],61:[function(require,module,exports){
(function (process,global){
var path = require('path');
var callsite = require('callsite');
var realModulePaths = module.paths;
var realModuleFilename = module.filename;

// Decorate the given constructor with some useful
// object oriented constructs (mainly a convenient inherit()
// method and the ability to do a super send)
module.exports = function(constructor) {
  // inherit from the given constructor
  constructor.inherit = function(parent) {
    if (arguments.length > 1) {
      // this allows chaining multiple classes in the call
      parent.inherit(Array.prototype.slice.call(arguments, 1));
    }
    this.super_ = parent;
    this.prototype.__proto__ = parent.prototype;
    this.__proto__ = parent;
  };

  // invoke the given method of the parent
  constructor.super = function(receiver, method, args) {
    if (!this.super_) return;
    if (typeof method == 'string') {
      // invoke the named method
      return this.super_.prototype[method].apply(receiver, args);
    } else {
      // invoke the constructor of the parent
      return this.super_.apply(receiver, method);
    }
  };

  // a standarized way to access a cached default instance
  constructor.default = function() {
    if (!this._default) this._default = new this();
    return this._default;
  };

  // set the parent if one is specified
  if (constructor.parent) {
    constructor.inherit(constructor.parent);
  }

  return constructor;
};

// load the given module using the given imports
// @fname the module name (relative paths are relative to the caller's 
//        location in the file system
// @imports namespace for binding values in the loaded module
var load = function(fname, imports) {
  if((fname.slice(0,2) == './') || (fname.slice(0,3) == '../')) {
    var callerFilename = callsite()[1].getFileName();
    fname = path.resolve(path.dirname(callerFilename), fname);
  }

  // fake out module path resolution here
  module.paths = module.parent.paths;
  module.filename = module.parent.filename;
  fname = require.resolve(fname);
  module.paths = realModulePaths;
  module.filename = realModuleFilename;

  var cachedModule = require.cache[fname];
  if (cachedModule) delete require.cache[fname];
  global._imports = imports;
  var answer = require(fname);
  delete require.cache[fname];
  if (cachedModule) require.cache[fname] = cachedModule;
  return answer;
};

var load_browser = function(fname, imports) {
  global._imports = imports;
  var answer;
  try {
    answer = require('!' + fname);
  } catch (e) {
    console.log('SOOP:' + e.message + '\nNote that SOOP requires a custom browserify configuration. please check soop\'s readme');
    throw e;
  }
  return answer;
};

module.exports.load = process.versions ? load : load_browser;

// access the imports passed from a call to load()
module.exports.imports = function() {
  var answer = global._imports || {};
  global._imports = {};
  return answer;
};

}).call(this,require("/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"/Users/colkito/Devel/BitPay/copay/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":43,"callsite":60,"path":44}],"6xZkYb":[function(require,module,exports){

var imports     = require('soop').imports();
var EventEmitter= imports.EventEmitter || require('events').EventEmitter;

function Network(opts) {
}

Network.parent=EventEmitter;

Network.prototype.start = function(openCallback, opts) {
  // start! :D
};

Network.prototype.send = function(peerIds, data, cb) {
  // send! c:
};

Network.prototype.connectTo = function(peerId) {
  // connect C:
};


Network.prototype.disconnect = function(cb) {
  // disconect :c
};

module.exports = require('soop')(Network);

},{"events":37,"soop":61}],"./mocks/FakeNetwork":[function(require,module,exports){
module.exports=require('6xZkYb');
},{}],"q/5+08":[function(require,module,exports){

var FakeStorage = function(){
  this.storage = {};
}; 

FakeStorage.prototype._setPassphrase = function (password) {
  this.storage.passphrase = password;
};

FakeStorage.prototype.setGlobal = function (id, payload) {
  this.storage[id] = payload;
};

FakeStorage.prototype.getGlobal = function(id) {
  return this.storage[id];
}

FakeStorage.prototype.set = function (wid, id, payload) {
  this.storage[wid + '-' + id] = payload;
};

FakeStorage.prototype.get = function(wid, id) {
  return this.storage[wid + '-' +id];
}

FakeStorage.prototype.clear = function() {
  delete this['storage'];
}

FakeStorage.prototype.getWallets = function() {
  return [];
};

FakeStorage.prototype.setFromObj = function(walletId, obj) {
  for (var i in obj) {
    this.storage[walletId + '-' + i] = obj[i];
  };
};

module.exports = require('soop')(FakeStorage);

},{"soop":61}],"./mocks/FakeStorage":[function(require,module,exports){
module.exports=require('q/5+08');
},{}]},{},[])