'use strict';
var preconditions = require('preconditions').singleton();
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var bitcore = require('bitcore');
var Passphrase = require('./Passphrase');
var preconditions = require('preconditions').instance();
var log = require('../log');
var _ = require('underscore');
var CACHE_DURATION = 1000 * 60 * 5;
var id = 0;


/*
 * Storage wraps db plugin primitives
 * with encryption functionalities
 * and adds from some extra functionalities
 * and a common interfase
 */
function Storage(opts) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(!opts.passphrase);

  this.wListCache = {};
  this.__uniqueid = ++id;
  this.passphraseConfig = opts.passphraseConfig;

  if (opts.password)
    this.setPassword(opts.password);

  try {
    this.db = opts.db || localStorage;
    this.sessionStorage = opts.sessionStorage || sessionStorage;
  } catch (e) {
    console.log('Error in storage:', e);
  };

  preconditions.checkState(this.db, 'No db defined');
  preconditions.checkState(this.sessionStorage, 'No sessionStorage defined');
}

var pps = {};
Storage.prototype._getPassphrase = function() {

  if (!pps[this.__uniqueid])
    throw new Error('NOPASSPHRASE: No passphrase set');

  return pps[this.__uniqueid];
}


Storage.prototype.hasPassphrase = function() {
  return pps[this.__uniqueid] ? true : false;
};


Storage.prototype._setPassphrase = function(passphrase) {
  pps[this.__uniqueid] = passphrase;
};

Storage.prototype.setPassword = function(password, config) {
  var passphraseConfig = _.extend(this.passphraseConfig, config);
  var p = new Passphrase(passphraseConfig);
  log.debug('Setting passphrase... Iterations:' + (passphraseConfig.iterations || 'default'))
  this._setPassphrase(p.getBase64(password));
  log.debug('done.')
}

Storage.prototype._encrypt = function(string) {
  var encrypted = CryptoJS.AES.encrypt(string, this._getPassphrase());
  var encryptedBase64 = encrypted.toString();
  return encryptedBase64;
};

Storage.prototype._decrypt = function(base64) {
  var decryptedStr = null;
  try {
    var decrypted = CryptoJS.AES.decrypt(base64, this._getPassphrase());
    if (decrypted)
      decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    // Error while decrypting
    return null;
  }
  return decryptedStr;
};


Storage.prototype._read = function(k, cb) {
  preconditions.checkArgument(cb);

  var self = this;
  this.db.getItem(k, function(ret) {
    if (!ret) return cb(null);
    ret = self._decrypt(ret);
    if (!ret) return cb(null);

    ret = ret.toString(CryptoJS.enc.Utf8);
    ret = JSON.parse(ret);
    return cb(ret);
  });
};

Storage.prototype._write = function(k, v, cb) {
  preconditions.checkArgument(cb);

  v = JSON.stringify(v);
  v = this._encrypt(v);
  this.db.setItem(k, v, cb);
};

// get value by key
Storage.prototype.getGlobal = function(k, cb) {
  preconditions.checkArgument(cb);

  this.db.getItem(k, function(item) {
    cb(item == 'undefined' ? undefined : item);
  });
};

// set value for key
Storage.prototype.setGlobal = function(k, v, cb) {
  preconditions.checkArgument(cb);
  this.db.setItem(k, typeof v === 'object' ? JSON.stringify(v) : v, cb);
};

// remove value for key
Storage.prototype.removeGlobal = function(k, cb) {
  preconditions.checkArgument(cb);
  this.db.removeItem(k, cb);
};

Storage.prototype.getSessionId = function(cb) {
  preconditions.checkArgument(cb);
  var self = this;

  self.sessionStorage.getItem('sessionId', function(sessionId) {
    if (sessionId)
      return cb(sessionId);

    sessionId = bitcore.SecureRandom.getRandomBuffer(8).toString('hex');
    self.sessionStorage.setItem('sessionId', sessionId, function() {
      return cb(sessionId);
    });
  });
};

Storage.prototype.setSessionId = function(sessionId, cb) {
  this.sessionStorage.setItem('sessionId', sessionId, cb);
};

Storage.prototype.get = function(key, cb) {
  var self = this;
  self._read(key, function(v) {
    return cb(null, v);
  })
};

Storage.prototype.getFirst = function(prefix, cb) {
  var self = this;
  this.db.allKeys(function(allKeys) {
    var keys = _.filter(allKeys, function(k) {
      if ((k === prefix) || k.indexOf(prefix) === 0) return true;
    });
    if (keys.length === 0) return cb(new Error('not found'));
    self._read(keys[0], function(v) {
      if (_.isNull(v)) return cb(new Error('Could not decrypt data'), null, keys[0]);
      return cb(null, v, keys[0]);
    })
  });
};

Storage.prototype.set = function(key, obj, cb) {
  preconditions.checkArgument(key);
  preconditions.checkArgument(cb);
  this._write(key, obj, function() {
    return cb();
  });
};

Storage.prototype.delete = function(key, cb) {
  preconditions.checkArgument(cb);
  this.removeGlobal(key, function() {
    return cb();
  });
};

Storage.prototype.deletePrefix = function(prefix, cb) {
  var self = this;
  this.getFirst(prefix, function(err, v, k) {
    if (err || !v) return cb(err);

    self.delete(k, function(err) {
      if (err) return cb(err);
      self.deletePrefix(prefix, cb);
    })
  });
};


Storage.prototype.clearAll = function(cb) {
  this.sessionStorage.clear();
  this.db.clear(cb);
};

Storage.prototype.decrypt = function(base64, password) {
  // password

  var decryptedStr = this._decrypt(base64);
  return JSON.parse(decryptedStr);
};

Storage.prototype.encrypt = function(obj) {
  var string = JSON.stringify(obj);
  return this._encrypt(string);
};

/*
 * OLD functions, only for temporary backwards compatibility
 */


Storage.prototype.readWallet_Old = function(walletId, cb) {
  var self = this;
  this.db.allKeys(function(allKeys) {
    var obj = {};
    var keys = _.filter(allKeys, function(k) {
      if (k.indexOf(walletId + '::') === 0) return true;
    });
    if (keys.length === 0) return cb(new Error('Wallet ' + walletId + ' not found'));
    var count = keys.length;
    _.each(keys, function(k) {
      self._read(k, function(v) {
        obj[k.split('::')[1]] = v;
        if (--count === 0) return cb(null, obj);
      })
    });
  });
};


Storage.prototype.deleteWallet_Old = function(walletId, cb) {
  preconditions.checkArgument(walletId);
  preconditions.checkArgument(cb);
  var err;
  var self = this;

  var toDelete = {};

  this.db.allKeys(function(allKeys) {
    for (var ii in allKeys) {
      var key = allKeys[ii];
      var split = key.split('::');
      if (split.length == 2 && split[0] === walletId) {
        toDelete[key] = 1;
      };
    }
    var l = Object.keys(toDelete).length,
      j = 0;
    if (!l)
      return cb(new Error('WNOTFOUND: Wallet not found'));

    toDelete['nameFor::' + walletId] = 1;
    l++;

    for (var i in toDelete) {
      self.removeGlobal(i, function() {
        if (++j == l)
          return cb(err);
      });

    }
  });
};


// TODO
Storage.prototype._getWalletIds_Old = function(cb) {
  preconditions.checkArgument(cb);
  var walletIds = [];
  var uniq = {};
  this.db.allKeys(function(keys) {
    for (var ii in keys) {
      var key = keys[ii];
      var split = key.split('::');
      if (split.length == 2) {
        var walletId = split[0];

        if (!walletId || walletId === 'nameFor' || walletId === 'lock' || walletId === 'wallet')
          continue;

        if (typeof uniq[walletId] === 'undefined') {
          walletIds.push(walletId);
          uniq[walletId] = 1;
        }
      }
    }
    return cb(walletIds);
  });
};

// TODO
Storage.prototype.getWallets1_Old = function(cb) {
  preconditions.checkArgument(cb);

  if (this.wListCache.ts > Date.now())
    return cb(this.wListCache.data)

  var wallets = [];
  var self = this;

  this._getWalletIds_Old(function(ids) {
    var l = ids.length,
      i = 0;
    if (!l)
      return cb([]);

    _.each(ids, function(id) {
      self.getGlobal('nameFor::' + id, function(name) {
        wallets.push({
          id: id,
          name: name,
        });
        if (++i == l) {
          self.wListCache.data = wallets;
          self.wListCache.ts = Date.now() + CACHE_DURATION;
          return cb(wallets);
        }
      });
    });
  });
};


Storage.prototype.getWallets_Old = function(cb) {
  var self = this;
  self.getWallets2_Old(function(wallets) {
    self.getWallets1_Old(function(wallets2) {
      var ids = _.pluck(wallets, 'id');
      _.each(wallets2, function(w) {
        if (!_.contains(ids, w.id))
          wallets.push(w);
      });
      return cb(wallets);
    });
  })
};

module.exports = Storage;
