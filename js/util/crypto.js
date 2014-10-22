/**
 * Small module for some helpers that wrap CryptoJS with some good practices.
 */
var sjcl = require('sjcl');
var log = require('../log.js');
var _ = require('underscore');

var SALT = 'copay random string NWRlNmExMTE4NzIzYzYyYWMwODU1MTdkN';
var SEPARATOR = '&';
var defaultOptions = {
  adata: '',
  cipher: 'aes',
  ks: 128,
  iter: 2000,
  mode: 'ccm',
  ts: 64
};

module.exports = {

  kdf: function(value1, value2) {
    return sjcl.codec.base64.fromBits(sjcl.misc.pbkdf2(value1 + value2, SALT));
  },

  /**
   * Encrypts symmetrically using a passphrase
   */
  encrypt: function(key, message) {
    return sjcl.encrypt(key, message);
  },

  /**
   * Decrypts symmetrically using a passphrase
   */
  decrypt: function(key, cypher) {
    var output = {};
    try {
      return sjcl.decrypt(key, cypher);
    } catch (e) {
      log.error('Decryption failed due to error: ' + e.message);
      return null;
    }
  }
};
