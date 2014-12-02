'use strict';

var Identity = require('./Identity');
var Wallet = require('./Wallet');
var cryptoUtils = require('../util/crypto');
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var sjcl = require('../../lib/sjcl');
var log = require('../util/log');
var preconditions = require('preconditions').instance();
var _ = require('lodash');

var Compatibility = {};
Compatibility.iterations = 100;
Compatibility.salt = 'mjuBtGybi/4=';

/**
 * Reads from localstorage wallets saved previously to 0.8
 */
Compatibility._getWalletIds = function(cb) {
  preconditions.checkArgument(cb);
  var walletIds = [];
  var uniq = {};
  var key;
  for (key in localStorage) {
    var split = key.split('::');
    if (split.length == 2) {
      var walletId = split[0];

      if (!walletId || walletId === 'nameFor' || walletId === 'lock' || walletId === 'wallet') {
        continue;
      }

      if (typeof uniq[walletId] === 'undefined') {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
    }
  }
  return cb(walletIds);
};

/**
 * @param {string} encryptedWallet - base64-encoded encrypted wallet
 * @param {string} password
 * @returns {Object}
 */
Compatibility.importLegacy = function(encryptedWallet, password) {
  var passphrase = this.kdf(password);
  var ret = Compatibility._decrypt(encryptedWallet, passphrase);

  if (!ret) return null;
  return ret;
};

/**
 * Decrypts using the CryptoJS library (unknown encryption schema)
 *
 * Don't use CryptoJS to encrypt. This still exists for compatibility reasons only.
 */
Compatibility._decrypt = function(base64, passphrase) {
  var decryptedStr = null;
  try {
    var decrypted = CryptoJS.AES.decrypt(base64, passphrase);
    if (decrypted)
      decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    // Error while decrypting
    return null;
  }
  return decryptedStr;
};

/**
 * Reads an item from localstorage, decrypts it with passphrase
 */
Compatibility._read = function(k, passphrase, cb) {
  preconditions.checkArgument(cb);

  var localStorage;
  if (window.chrome && chrome.runtime && chrome.runtime.id) {
    console.log('Is a chrome app!..Compatibility.js');
    localStorage = chrome.storage.local;
  } else {
    console.log('Is web!');
    localStorage = window.localStorage;
  }

  var ret = localStorage.getItem(k);
  if (!ret) return cb(null);
  var ret = self._decrypt(ret, passphrase);
  if (!ret) return cb(null);

  ret = ret.toString(CryptoJS.enc.Utf8);
  ret = JSON.parse(ret);
  return ret;
};

Compatibility.getWallets_Old = function(cb) {
  preconditions.checkArgument(cb);

  var wallets = [];
  var self = this;

  this._getWalletIds(function(ids) {
    if (!ids.length) {
      return cb([]);
    }

    _.each(ids, function(id) {
      var name = localStorage.getItem('nameFor::' + id);
      if (name) {
        wallets.push({
          id: id,
          name: name,
        });
      }
    });
    return cb(wallets);
  });
};

Compatibility.getWallets2 = function(cb) {
  var self = this;
  var re = /wallet::([^_]+)(_?(.*))/;
  var va = /^{+/;

  var key;
  var keys = [];
  for (key in localStorage) {
    keys.push(key);
  }
  var wallets = _.compact(_.map(keys, function(key) {
    if (key.indexOf('wallet::') !== 0)
      return null;
    var match = key.match(re);
    var matchValue = localStorage[key].match(va);
    if (match.length != 4)
      return null;
    if (matchValue)
      return null;
    return {
      id: match[1],
      name: match[3] ? match[3] : undefined,
      value: localStorage[key]
    };
  }));

  return cb(wallets);
};

/**
 * Lists all wallets in localstorage
 */
Compatibility.listWalletsPre8 = function(cb) {
  var self = this;
  self.getWallets2(function(wallets) {
    self.getWallets_Old(function(wallets2) {
      var ids = _.pluck(wallets, 'id');
      _.each(wallets2, function(w) {
        if (!_.contains(ids, w.id))
          wallets.push(w);
      });
      return cb(wallets);
    });
  })
};

/**
 * Retrieves a wallet that predates the 0.8 release
 */
Compatibility.readWalletPre8 = function(walletId, password, cb) {
  var self = this;
  var passphrase = cryptoUtils.kdf(password);
  var obj = {};
  var key;

  for (key in localStorage) {
    if (key.indexOf('wallet::' + walletId) !== -1) {
      var ret = self._read(localStorage.getItem(key), passphrase);
      if (err) return cb(err);

      _.each(Wallet.PERSISTED_PROPERTIES, function(p) {
        obj[p] = ret[p];
      });

      if (!_.any(_.values(obj)))
        return cb(new Error('Wallet not found'));

      var w, err;
      obj.id = walletId;
      try {
        w = self.fromObj(obj);
      } catch (e) {
        if (e && e.message && e.message.indexOf('MISSOPTS')) {
          err = new Error('Could not read: ' + walletId);
        } else {
          err = e;
        }
        w = null;
      }
      return cb(err, w);
    }
  }
};

Compatibility.importEncryptedWallet = function(identity, cypherText, password, opts, cb) {
  var crypto = (opts && opts.cryptoUtil) || cryptoUtils;

  var obj = crypto.decrypt(password, cypherText);
  if (!obj) {
    // 0.7.3 broken KDF
    log.debug('Trying legacy encryption 0.7.2...');
    var passphrase = crypto.kdf(password, 'mjuBtGybi/4=', 100);
    obj = crypto.decrypt(passphrase, cypherText);
  }

  if (!obj) {
    log.info("Could not decrypt, trying legacy..");
    obj = Compatibility.importLegacy(cypherText, password);
  };

  if (!obj) {
    return cb('Could not decrypt', null);
  }


  try {
    obj = JSON.parse(obj);
  } catch (e) {
    return cb('Could not read encrypted wallet', null);
  }
  return identity.importWalletFromObj(obj, opts, cb);
};

/**
 * @desc Generate a WordArray expanding a password
 *
 * @param {string} password - the password to expand
 * @returns WordArray 512 bits with the expanded key generated from password
 */
Compatibility.kdf = function(password) {
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
  var sbase64 = sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(key512));
  return sbase64;
};

Compatibility.deleteOldWallet = function(walletObj) {
  localStorage.removeItem('wallet::' + walletObj.id + '_' + walletObj.name);
  log.info('Old wallet ' + walletObj.name + ' deleted: ' + walletObj.id);
};


module.exports = Compatibility;
