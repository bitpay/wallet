'use strict';

var CryptoJS = CryptoJS || require('crypto-js');

function Passphrase(config) {
  config = config || {};
  this.salt = config.salt || 'mjuBtGybi/4=';
  this.iterations = config.iterations || 1000;
};

Passphrase.prototype.get = function(password) {
  var hash = CryptoJS.SHA256(CryptoJS.SHA256(password));
  var salt = CryptoJS.enc.Base64.parse(this.salt);
  var key512 = CryptoJS.PBKDF2(hash, salt, {
    keySize: 512 / 32,
    iterations: this.iterations
  });
  return key512;
};

Passphrase.prototype.getBase64 = function(password) {
  var key512 = this.get(password);
  var keyBase64 = key512.toString(CryptoJS.enc.Base64);
  return keyBase64;
};

Passphrase.prototype.getBase64Async = function(password, cb) {
  var self = this;
  setTimeout(function() {
    var ret = self.getBase64(password);
    return cb(ret);
  }, 10);
};



module.exports = Passphrase;
