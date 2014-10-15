'use strict';

// 65.7% typed (by google's closure-compiler account)

var sjcl = require('../../lib/sjcl');
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
  this.iterations = config.iterations;
};

/**
 * @desc Generate a WordArray expanding a password
 *
 * @param {string} password - the password to expand
 * @returns WordArray 512 bits with the expanded key generated from password
 */
Passphrase.prototype.get = function(password) {
  var hash = sjcl.hash.sha256.hash(sjcl.hash.sha256.hash(password));
  var salt = sjcl.codec.base64.toBits(this.salt);

  var crypto2 = function(key, salt, iterations, length, alg) {
    return sjcl.codec.hex.fromBits(sjcl.misc.pbkdf2(key, salt, iterations, length * 8,
      alg == 'sha1' ? function(key) {
        return new sjcl.misc.hmac(key, sjcl.hash.sha1)
      } : null
    ))
  };

  var key512 = crypto2(hash, salt, this.iterations, 64, 'sha1');

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

  var sbase64 = sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(key512));
  return sbase64;
};


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
