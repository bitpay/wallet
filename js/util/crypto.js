/**
 * Small module for some helpers that wrap sjcl with some good practices.
 */
var sjcl = require('../../lib/sjcl');
var log = require('../log.js');
var _ = require('lodash');

var defaultSalt = 'mjuBtGybi/4=';
var defaultIterations = 100;

// var SEPARATOR = '&';
// var defaultOptions = {
//   adata: '',
//   cipher: 'aes',
//   ks: 128,
//   iter: 2000,
//   mode: 'ccm',
//   ts: 64
// };

module.exports = {

  kdf: function(value1, value2, salt, iterations) {
    iterations = iterations || defaultIterations;
    salt = salt || defaultSalt;
    return sjcl.codec.base64.fromBits(sjcl.misc.pbkdf2(value1 + (value2 || ''), salt, iterations));
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
