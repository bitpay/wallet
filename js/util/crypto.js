/**
 * Small module for some helpers that wrap sjcl with some good practices.
 */
var sjcl = require('../../lib/sjcl');
var log = require('../log.js');
var _ = require('lodash');

var defaultSalt = 'mjuBtGybi/4=';
var defaultIterations = 100;

sjcl.defaults = {
  v: 1,
  iter: 100,
  ks: 128,
  ts: 64,
  mode: "ccm",
  adata: "",
  cipher: "aes"
},

module.exports = {

  kdf: function(value1, value2, salt, iterations) {
    iterations = iterations || defaultIterations;
    salt = salt || defaultSalt;

    var password = value1 + (value2 || '');
    var hash = sjcl.hash.sha256.hash(sjcl.hash.sha256.hash(password));
    var salt = sjcl.codec.base64.toBits(salt);
    var prff = function(key) {
      return new sjcl.misc.hmac(hash, sjcl.hash.sha1);
    };

    var bits = sjcl.misc.pbkdf2(hash, salt, iterations, 64 * 8, prff);
    var base64 = sjcl.codec.base64.fromBits(bits);
    return base64;
  },

  /**
   * Encrypts symmetrically using a passphrase
   */
  encrypt: function(key, message) {
    if (!_.isString(message)) {
      message = JSON.stringify(message);
    }
    return sjcl.encrypt(key, message);
  },

  /**
   * Decrypts symmetrically using a passphrase
   */
  decrypt: function(key, cyphertext) {
    var output = {};
    try {
      return sjcl.decrypt(key, cyphertext);
    } catch (e) {
      log.error('Decryption failed due to error: ' + e.message);
      return null;
    }
  }
};
