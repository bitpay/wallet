'use strict';

var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var bitcore = require('bitcore');
var preconditions = require('preconditions').instance();
var id = 0;

function Storage(opts) {
  opts = opts || {};

  this.__uniqueid = ++id;
  if (opts.password)
    this._setPassphrase(opts.password);

  try {
    this.localStorage = opts.localStorage || localStorage;
    this.sessionStorage = opts.sessionStorage || sessionStorage;
  } catch (e) {}
  preconditions.checkState(this.localStorage, 'No localstorage found');
  preconditions.checkState(this.sessionStorage, 'No sessionStorage found');
}

var pps = {};
Storage.prototype._getPassphrase = function() {
  if (!pps[this.__uniqueid])
    throw new Error('No passprase set');

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

Storage.prototype._decrypt = function(base64) {
  var decryptedStr = null;
  try {
    var decrypted = CryptoJS.AES.decrypt(base64, this._getPassphrase());
    if (decrypted)
      decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    // Error while decrypting
    return null;
  }
  return decryptedStr;
};


Storage.prototype._read = function(k) {
  var ret;
  ret = this.localStorage.getItem(k);
  if (!ret) return null;
  ret = this._decrypt(ret);
  if (!ret) return null;
  ret = ret.toString(CryptoJS.enc.Utf8);
  ret = JSON.parse(ret);
  return ret;
};

Storage.prototype._write = function(k, v) {
  v = JSON.stringify(v);
  v = this._encrypt(v);

  this.localStorage.setItem(k, v);
};

// get value by key
Storage.prototype.getGlobal = function(k) {
  var item = this.localStorage.getItem(k);
  return item == 'undefined' ? undefined : item;
};

// set value for key
Storage.prototype.setGlobal = function(k, v) {
  this.localStorage.setItem(k, typeof v === 'object' ? JSON.stringify(v) : v);
};

// remove value for key
Storage.prototype.removeGlobal = function(k) {
  this.localStorage.removeItem(k);
};

Storage.prototype.getSessionId = function() {
  var sessionId = this.sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = bitcore.SecureRandom.getRandomBuffer(8).toString('hex');
    this.sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k) {
  var ret = this._read(this._key(walletId, k));
  return ret;
};

// set value for key
Storage.prototype.set = function(walletId, k, v) {
  this._write(this._key(walletId, k), v);
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
  this.removeGlobal(this._key(walletId, k));
};

Storage.prototype.setName = function(walletId, name) {
  this.setGlobal('nameFor::' + walletId, name);
};

Storage.prototype.getName = function(walletId) {
  var ret = this.getGlobal('nameFor::' + walletId);
  return ret;
};

Storage.prototype.getWalletIds = function() {
  var walletIds = [];
  var uniq = {};

  for (var i = 0; i < this.localStorage.length; i++) {
    var key = this.localStorage.key(i);
    var split = key.split('::');
    if (split.length == 2) {
      var walletId = split[0];

      if (!walletId || walletId === 'nameFor' || walletId === 'lock')
        continue;

      if (typeof uniq[walletId] === 'undefined') {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
    }
  }
  return walletIds;
};

Storage.prototype.getWallets = function() {
  var wallets = [];
  var ids = this.getWalletIds();

  for (var i in ids) {
    wallets.push({
      id: ids[i],
      name: this.getName(ids[i]),
    });
  }
  return wallets;
};

Storage.prototype.deleteWallet = function(walletId) {
  var toDelete = {};
  toDelete['nameFor::' + walletId] = 1;

  for (var i = 0; i < this.localStorage.length; i++) {
    var key = this.localStorage.key(i);
    var split = key.split('::');
    if (split.length == 2 && split[0] === walletId) {
      toDelete[key] = 1;
    }
  }
  for (var i in toDelete) {
    this.removeGlobal(i);
  }
};

Storage.prototype.setLastOpened = function(walletId) {
  this.setGlobal('lastOpened', walletId);
}

Storage.prototype.getLastOpened = function() {
  return this.getGlobal('lastOpened');
}

//obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj) {
  for (var k in obj) {
    this.set(walletId, k, obj[k]);
  }
  this.setName(walletId, obj.opts.name);
};

// remove all values
Storage.prototype.clearAll = function() {
  this.localStorage.clear();
};

Storage.prototype.import = function(base64) {
  var decryptedStr = this._decrypt(base64);
  return JSON.parse(decryptedStr);
};

Storage.prototype.export = function(obj) {
  var string = JSON.stringify(obj);
  return this._encrypt(string);
};

module.exports = Storage;
