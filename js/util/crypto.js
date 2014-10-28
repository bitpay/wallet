/**
 * Small module for some helpers that wrap sjcl with some good practices.
 */
var sjcl = require('../../lib/sjcl');
var log = require('../log.js');
var _ = require('lodash');

var defaultSalt = 'mjuBtGybi/4=';
var defaultIterations = 100;

module.exports = {

  /**
   * @param {string} password
   * @param {string} salt - base64 encoded, defaults to 'mjuBtGybi/4='
   * @param {number} iterations - defaults to 100
   * @param {number} length - bits, defaults to 512 bits
   * @returns {string} base64 encoded pbkdf2 derivation using sha1 for hmac
   */
  kdf: function(password, salt, iterations, length) {
    return sjcl.codec.base64.fromBits(
      this.kdfbinary(password, salt, iterations, length)
    );
  },

  /**
   * @param {string} password
   * @param {string} salt - base64 encoded, defaults to 'mjuBtGybi/4='
   * @param {number} iterations - defaults to 100
   * @param {number} length - bits, defaults to 512 bits
   * @returns {string} base64 encoded pbkdf2 derivation using sha1 for hmac
   */
  kdfbinary: function(password, salt, iterations, length) {
    iterations = iterations || defaultIterations;
    length = length || 512;
    salt = sjcl.codec.base64.toBits(salt || defaultSalt);

    var hash = sjcl.hash.sha256.hash(sjcl.hash.sha256.hash(password));
    var prff = function(key) {
      return new sjcl.misc.hmac(hash, sjcl.hash.sha1);
    };

    return sjcl.misc.pbkdf2(hash, salt, iterations, length, prff);
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
