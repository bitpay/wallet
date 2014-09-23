'use strict';

// 65.7% typed (by google's closure-compiler account)

var CryptoJS = CryptoJS || require('crypto-js');
var preconditions = require('preconditions').instance();
var _ = require('underscore');

/**
 * @desc
 * Class for a Passphrase object, uses PBKDF2 to expand a password
 *
 * @constructor
 * @param {object} config
 * @param {string=} config.salt - 'mjuBtGybi/4=' by default
 * @param {number=} config.iterations - 1000 by default
 */
function Passphrase(config) {
  preconditions.checkArgument(!config || !config.salt || _.isString(config.salt));
  preconditions.checkArgument(!config || !config.iterations || _.isNumber(config.iterations));
  config = config || {};
  this.salt = config.salt || 'mjuBtGybi/4=';
  this.iterations = config.iterations || 1000;
};

/**
 * @desc Generate a WordArray expanding a password
 *
 * @param {string} password - the password to expand
 * @returns WordArray 512 bits with the expanded key generated from password
 */
Passphrase.prototype.get = function(password) {
  var hash = CryptoJS.SHA256(CryptoJS.SHA256(password));
  var salt = CryptoJS.enc.Base64.parse(this.salt);
  var key512 = CryptoJS.PBKDF2(hash, salt, {
    keySize: 512 / 32,
    iterations: this.iterations
  });
  return key512;
};

/**
 * @desc Generate a base64 encoded key
 *
 * @param {string} password - the password to expand
 * @returns {string} 512 bits of a base64 encoded passphrase based on password
 */
Passphrase.prototype.getBase64 = function(password) {
  var key512 = this.get(password);
  var keyBase64 = key512.toString(CryptoJS.enc.Base64);
  return keyBase64;
};


/**
 * @desc Callback for the Passphrase#getBase64Async method
 * @callback passphraseCallback
 * @param {string} passphrase 512 bits of a base64 encoded passphrase based on password
 */

/**
 * @desc Generate a base64 encoded key, without blocking
 *
 * @param {string} password - the password to expand
 * @param {passphraseCallback} cb
 */
Passphrase.prototype.getBase64Async = function(password, cb) {
  var self = this;
  setTimeout(function() {
    var ret = self.getBase64(password);
    return cb(ret);
  }, 0);
};

module.exports = Passphrase;
