'use strict';
var preconditions = require('preconditions').singleton();
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var bitcore = require('bitcore');
var preconditions = require('preconditions').instance();
var _ = require('underscore');
var CACHE_DURATION = 1000 * 60 * 5;
var id = 0;

function Storage(opts) {
  opts = opts || {};

  this.wListCache = {};
  this.__uniqueid = ++id;
  if (opts.password)
    this.setPassphrase(opts.password);

  try {
    this.storage = opts.storage || localStorage;
    this.sessionStorage = opts.sessionStorage || sessionStorage;
  } catch (e) {
    console.log('Error in storage:', e); //TODO
  };

  preconditions.checkState(this.storage, 'No storage defined');
  preconditions.checkState(this.sessionStorage, 'No sessionStorage defined');
}

var pps = {};
Storage.prototype._getPassphrase = function() {

  if (!pps[this.__uniqueid])
    throw new Error('NOPASSPHRASE: No passphrase set');

  return pps[this.__uniqueid];
}

Storage.prototype.setPassphrase = function(password) {
  pps[this.__uniqueid] = password;
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
  this.storage.getItem(k, function(ret) {
    if (!ret) return cb(null);
    var ret = self._decrypt(ret);
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
  this.storage.setItem(k, v, cb);
};

// get value by key
Storage.prototype.getGlobal = function(k, cb) {
  preconditions.checkArgument(cb);

  this.storage.getItem(k, function(item) {
    cb(item == 'undefined' ? undefined : item);
  });
};

// set value for key
Storage.prototype.setGlobal = function(k, v, cb) {
  preconditions.checkArgument(cb);
  this.storage.setItem(k, typeof v === 'object' ? JSON.stringify(v) : v, cb);
};

// remove value for key
Storage.prototype.removeGlobal = function(k, cb) {
  preconditions.checkArgument(cb);
  this.storage.removeItem(k, cb);
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

Storage.prototype._readHelper = function(walletId, k, cb) {
  var wk = this._key(walletId, k);
  this._read(wk, function(v) {
    return cb(v, k);
  });
};

Storage.prototype.readWallet_Old = function(walletId, cb) {
  var self = this;
  this.storage.allKeys(function(allKeys) {
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

Storage.prototype.readWallet = function(walletId, cb) {
  var self = this;
  this.storage.allKeys(function(allKeys) {
    var keys = _.filter(allKeys, function(k) {
      if ((k === 'wallet::' + walletId) || k.indexOf('wallet::' + walletId) === 0) return true;
    });
    if (keys.length === 0) return cb(new Error('Wallet ' + walletId + ' not found'));
    self._read(keys[0], function(v) {
      if (_.isNull(v)) return cb(new Error('Could not decrypt wallet data'));
      return cb(null, v);
    })
  });
};

Storage.prototype.getMany = function(walletId, keys, cb) {
  preconditions.checkArgument(cb);

  var self = this;
  var ret = {};

  var l = keys.length,
    i = 0;

  for (var ii in keys) {
    this._readHelper(walletId, keys[ii], function(v, k) {
      ret[k] = v;
      if (++i == l) {
        return cb(ret);
      }
    });
  }
};

Storage.prototype._getWalletIds = function(cb) {
  preconditions.checkArgument(cb);
  var walletIds = [];
  var uniq = {};
  this.storage.allKeys(function(keys) {
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

Storage.prototype.getWallets_Old = function(cb) {
  preconditions.checkArgument(cb);

  if (this.wListCache.ts > Date.now())
    return cb(this.wListCache.data)

  var wallets = [];
  var self = this;

  this._getWalletIds(function(ids) {
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

Storage.prototype.getWallets2 = function(cb) {
  var self = this;
  var re = /wallet::([^_]+)(_?(.*))/;

  this.storage.allKeys(function(allKeys) {
    var wallets = _.compact(_.map(allKeys, function(key) {
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
  });
};

Storage.prototype.getWallets = function(cb) {
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


Storage.prototype.deleteWallet_Old = function(walletId, cb) {
  preconditions.checkArgument(walletId);
  preconditions.checkArgument(cb);
  var err;
  var self = this;

  var toDelete = {};

  this.storage.allKeys(function(allKeys) {
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

Storage.prototype.deleteWallet = function(walletId, cb) {
  preconditions.checkArgument(walletId);
  preconditions.checkArgument(cb);

  var self = this;
  this.getWallets2(function(wallets) {
    var w = _.findWhere(wallets, {
      id: walletId
    });
    if (!w)
      return cb(new Error('WNOTFOUND: Wallet not found'));
    self.removeGlobal('wallet::' + walletId + (w.name ? '_' + w.name : ''), function() {
      return cb();
    });
  });
};

Storage.prototype.setLastOpened = function(walletId, cb) {
  this.setGlobal('lastOpened', walletId, cb);
};

Storage.prototype.getLastOpened = function(cb) {
  this.getGlobal('lastOpened', cb);
};

Storage.prototype.setFromObj = function(key, obj, cb) {
  preconditions.checkArgument(key);
  preconditions.checkArgument(cb);
  this._write(key, obj, function() {
    return cb();
  });
};


// remove all values
Storage.prototype.clearAll = function(cb) {
  this.storage.clear(cb);
};

Storage.prototype.import = function(base64) {
  var decryptedStr = this._decrypt(base64);
  return JSON.parse(decryptedStr);
};

Storage.prototype.export = function(obj) {
  var string = JSON.stringify(obj);
  return this._encrypt(string);
};


module.exports = Storage;
