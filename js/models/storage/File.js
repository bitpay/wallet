'use strict';
var fs = require('fs');
var CryptoJS = require('node-cryptojs-aes').CryptoJS;

var passwords = [];

function Storage(opts) {
  opts = opts || {};

  this.data = {};
  passwords[0] = opts.password;
}

Storage.prototype._encrypt = function(string) {
  var encrypted = CryptoJS.AES.encrypt(string, passwords[0]);
  var encryptedBase64 = encrypted.toString();
  return encryptedBase64;
};

Storage.prototype._encryptObj = function(obj) {
  var string = JSON.stringify(obj);
  return this._encrypt(string);
};

Storage.prototype._decrypt = function(base64) {
  var decrypted = CryptoJS.AES.decrypt(base64, passwords[0]);
  var decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
  return decryptedStr;
};

Storage.prototype._decryptObj = function(base64) {
  var decryptedStr = this._decrypt(base64);
  return JSON.parse(decryptedStr);
};

Storage.prototype.load = function(walletId, callback) {
  var self = this;
  fs.readFile(walletId, function(err, base64) {
    if (typeof base64 !== 'string')
      base64 = base64.toString();
    var data = self._decryptObj(base64);

    if (err) return callback(err);

    try {
      this.data[walletId] = JSON.parse(data);
    } catch (err) {
      if (callback)
        return callback(err);
    }

    if (callback)
      return callback(null);
  });
};

Storage.prototype.save = function(walletId, callback) {
  var obj = this.data[walletId];
  var encryptedBase64 = this._encryptObj(obj);

  //TODO: update to use a queue to ensure that saves are made sequentially
  fs.writeFile(walletId, encryptedBase64, function(err) {
    if (callback)
      return callback(err);
  });
};

Storage.prototype._read = function(k) {
  var split = k.split('::');
  var walletId = split[0];
  var key = split[1];
  return this.data[walletId][key];
};

Storage.prototype._write = function(k, v, callback) {
  var split = k.split('::');
  var walletId = split[0];
  var key = split[1];
  if (!this.data[walletId])
    this.data[walletId] = {};
  this.data[walletId][key] = v;
  this.save(walletId, callback);
};

// get value by key
Storage.prototype.getGlobal = function(k) {
  return this._read(k);
};

// set value for key
Storage.prototype.setGlobal = function(k, v, callback) {
  this._write(k, v, callback);
};

// remove value for key
Storage.prototype.removeGlobal = function(k, callback) {
  var split = k.split('::');
  var walletId = split[0];
  var key = split[1];
  delete this.data[walletId][key];
  this.save(walletId, callback);
};

Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};

// get value by key
Storage.prototype.get = function(walletId, k) {
  return this.getGlobal(this._key(walletId, k));
};

// set value for key
Storage.prototype.set = function(walletId, k, v, callback) {
  this.setGlobal(this._key(walletId, k), v, callback);
};

// remove value for key
Storage.prototype.remove = function(walletId, k, callback) {
  this.removeGlobal(this._key(walletId, k), callback);
};

Storage.prototype.getWalletIds = function() {
  return [];
};

Storage.prototype.setFromObj = function(walletId, obj, callback) {
  this.data[walletId] = obj;
  this.save(walletId, callback);
};

Storage.prototype.setFromEncryptedObj = function(walletId, base64, callback) {
  var obj = this._decryptObj(base64);
  this.setFromObj(walletId, obj, callback);
};

Storage.prototype.getEncryptedObj = function(walletId) {
  var encryptedBase64 = this._encryptObj(this.data[walletId]);

  return encryptedBase64;
};

// remove all values
Storage.prototype.clearAll = function(callback) {
  this.data = {};
  this.save(callback);
};

module.exports = Storage;
