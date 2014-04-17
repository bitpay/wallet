'use strict';
var imports = require('soop').imports();
var fs = imports.fs || require('fs');
var parent = imports.parent || require('./Base');
var crypto = imports.crypto || require('crypto');
var CryptoJS = require('node-cryptojs-aes').CryptoJS;

var passwords = [];

function Storage(opts) {
  opts = opts || {};

  this.data = {};
  passwords[0] = opts.password;
}
Storage.parent = parent;

Storage.prototype.load = function(walletId, callback) {
  fs.readFile(walletId, function(err, data) {
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
  var data = JSON.stringify(this.data[walletId]);

  //TODO: update to use a queue to ensure that saves are made sequentially
  fs.writeFile(walletId, data, function(err) {
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
  this.setGlobal(this._key(walletId,k), v, callback);
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

Storage.prototype.setFromEncryptedObj = function(walletId) {
  //TODO: implement
};

Storage.prototype.getEncryptedObj = function(walletId) {
  var data = JSON.stringify(this.data[walletId]);
  var encrypted = CryptoJS.AES.encrypt(data, passwords[0]);
  var hex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Base64.parse(encrypted.toString()));

  return hex;
};

// remove all values
Storage.prototype.clearAll = function(callback) {
  this.data = {};
  this.save(callback);
};     

module.exports = require('soop')(Storage);
