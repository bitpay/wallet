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
  var item = localStorage.getItem(k);
  return item == 'undefined' ? undefined : item;
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
