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

Storage.prototype._encrypt = function(data) {
  return CryptoJS.AES.encrypt(data, this._getPassphrase());
};

Storage.prototype._decrypt = function(encrypted) {
  return CryptoJS.AES.decrypt(encrypted, this._getPassphrase());  
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

Storage.prototype.getEncryptedObj = function(walletId) {
  var keys = this._getWalletKeys();
  var obj = {};
  for (var i in keys) {
    var key = keys[0];
    obj[key] = this.get(walletId, key);
  }
  
  var str = JSON.stringify(obj);
  var hex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Base64.parse(this._encrypt(str).toString()));

  return hex;
};

module.exports = require('soop')(Storage);
