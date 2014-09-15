'use strict';
var preconditions = require('preconditions').singleton();
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var bitcore = require('bitcore');
var preconditions = require('preconditions').instance();
var _ = require('underscore');

var id = 0;

function Storage(opts) {
  opts = opts || {};

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

Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k, cb) {
  preconditions.checkArgument(walletId, k, cb);
  this._read(this._key(walletId, k), cb);
};


Storage.prototype._readHelper = function(walletId, k, cb) {
  var wk = this._key(walletId, k);
  this._read(wk, function(v) {
    return cb(v, k);
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

// set value for key
Storage.prototype.set = function(walletId, k, v, cb) {
  preconditions.checkArgument(walletId && k && !_.isUndefined(v) && cb);

  this._write(this._key(walletId, k), v, cb);
};

// remove value for key
Storage.prototype.remove = function(walletId, k, cb) {
  preconditions.checkArgument(walletId && k && cb);
  this.removeGlobal(this._key(walletId, k), cb);
};

Storage.prototype.setName = function(walletId, name, cb) {
  preconditions.checkArgument(walletId && name && cb);
  this.setGlobal('nameFor::' + walletId, name, cb);
};

Storage.prototype.getName = function(walletId, cb) {
  preconditions.checkArgument(walletId && cb);
  this.getGlobal('nameFor::' + walletId, cb);
};

Storage.prototype.getWalletIds = function(cb) {
  preconditions.checkArgument(cb);
  var walletIds = [];
  var uniq = {};

  this.storage.allKeys(function(keys) {
    for (var ii in keys) {
      var key = keys[ii];
      var split = key.split('::');
      if (split.length == 2) {
        var walletId = split[0];

        if (!walletId || walletId === 'nameFor' || walletId === 'lock')
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

Storage.prototype.getWallets = function(cb) {
  preconditions.checkArgument(cb);

  var wallets = [];
  var self = this;

  this.getWalletIds(function(ids) {
    var l = ids.length,
      i = 0;
    if (!l)
      return cb([]);

    for (var ii in ids) {
      var id = ids[ii];
      self.getName(id, function(name) {
        wallets.push({
          id: id,
          name: name,
        });
        if (++i == l) {
          return cb(wallets);
        }
      })
    }
  });
};

Storage.prototype.deleteWallet = function(walletId, cb) {
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

Storage.prototype.setLastOpened = function(walletId, cb) {
  this.setGlobal('lastOpened', walletId, cb);
}

Storage.prototype.getLastOpened = function(cb) {
  this.getGlobal('lastOpened', cb);
}

//obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj, cb) {
  preconditions.checkArgument(cb);
  var self = this;

  var l = Object.keys(obj).length,
    i = 0;
  for (var k in obj) {
    self.set(walletId, k, obj[k], function() {
      if (++i == l) {
        self.setName(walletId, obj.opts.name, cb);
      }
    });
  }
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
