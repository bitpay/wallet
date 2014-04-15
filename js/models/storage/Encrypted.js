'use strict';

var imports = require('soop').imports();
//var buffertools = imports.buffertools || require('buffertools');
var parent     = imports.parent || require('./Plain');

function Storage() {
}
Storage.parent = parent;


var passphrase = null;
Storage.prototype._getPassphrase = function() {
  return passphrase;
}

Storage.prototype._setPassphrase = function(password) {
  passphrase = password;
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

module.exports = require('soop')(Storage);
