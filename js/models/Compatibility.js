'use strict';

var Identity = require('./Identity');
var Wallet = require('./Wallet');
var cryptoUtils = require('../util/crypto');
var CryptoJS = require('node-cryptojs-aes').CryptoJS;

var Compatibility = {};

/**
 * Reads from localstorage wallets saved previously to 0.8
 */
Compatibility._getWalletIds = function(cb) {
  preconditions.checkArgument(cb);
  var walletIds = [];
  var uniq = {};
  for (key in localStorage) {
    var split = key.split('::');
    if (split.length == 2) {
      var walletId = split[0];

      if (!walletId
          || walletId === 'nameFor'
          || walletId === 'lock'
          || walletId === 'wallet') {
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
 * @param {string} passphrase - base64-encoded passphrase
 * @returns {Object}
 */
Compatibility.importLegacy = function(encryptedWallet, passphrase) {
  var ret = Compatibility._decrypt(encryptedWallet, passphrase);
  if (!ret) return null;
  ret = ret.toString(CryptoJS.enc.Utf8);
  ret = JSON.parse(ret);
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

  var keys = [];
  for (key in localStorage) {
    keys.push(key);
  }
  var wallets = _.compact(_.map(keys, function(key) {
    if (key.indexOf('wallet::') !== 0)
      return null;
    var match = key.match(re);
    if (match.length != 4)
      return null;
    return {
      id: match[1],
      name: match[3] ? match[3] : undefined,
    };
  }));

  return cb(wallets);
};

/**
 * Lists all wallets in localstorage
 */
Compatibility.listWalletsPre8 = function (cb) {
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

module.exports = Compatibility;
