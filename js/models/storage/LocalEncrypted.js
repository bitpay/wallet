'use strict';

var imports = require('soop').imports();
//var buffertools = imports.buffertools || require('buffertools');
var parent     = imports.parent || require('./LocalPlain');

var id = 0;
function Storage(opts) {
  opts = opts || {};

  this.__uniqueid = ++id;

  if (opts.password)
    this._setPassphrase(opts.password);
}
Storage.parent = parent;


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
  var decrypted = CryptoJS.AES.decrypt(base64, this._getPassphrase());
  var decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
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
    ret = this._decrypt(ret);
    ret = ret.toString(CryptoJS.enc.Utf8);
    ret = JSON.parse(ret);
  } catch (e) {
    console.log('Error while decrypting: '+e);
    throw e;
  };
  return ret;
};

Storage.prototype._write = function(k,v) {
  v = JSON.stringify(v);
  v = this._encrypt(v);
  localStorage.setItem(k, v);
};

Storage.prototype.setFromObj = function(walletId, obj) {
  for (var i in keys) {
    var key = keys[0];
    obj[key] = this.get(walletId, key);
  }
};

Storage.prototype.setFromEncryptedObj = function(walletId, base64) {
  
};

Storage.prototype.getEncryptedObj = function(walletId) {
  var keys = this._getWalletKeys();
  var obj = {};
  for (var i in keys) {
    var key = keys[0];
    obj[key] = this.get(walletId, key);
  }
  
  var str = JSON.stringify(obj);
  var base64 = this._encrypt(str).toString();

  return base64;
};

module.exports = require('soop')(Storage);
