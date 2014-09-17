var _ = require('underscore');

var FakeStorage = function() {
  this.reset();
};


FakeStorage.prototype.reset = function(password) {
  this.storage = {};
};

FakeStorage.prototype._setPassphrase = function(password) {
  this.storage.passphrase = password;
};

FakeStorage.prototype.setGlobal = function(id, v) {
  this.storage[id] = typeof v === 'object' ? JSON.stringify(v) : v;
};

FakeStorage.prototype.getGlobal = function(id) {
  return this.storage[id];
};

FakeStorage.prototype.setLastOpened = function(val) {
  this.storage['lastOpened'] = val;
};

FakeStorage.prototype.getLastOpened = function() {
  return this.storage['lastOpened'];
};

FakeStorage.prototype.setLock = function(id) {
  this.storage[id + '::lock'] = true;
}

FakeStorage.prototype.getLock = function(id) {
  return this.storage[id + '::lock'];
}

FakeStorage.prototype.getSessionId = function() {
  return this.sessionId || 'aSessionId';
};


FakeStorage.prototype.removeLock = function(id) {
  delete this.storage[id + '::lock'];
}

FakeStorage.prototype.removeGlobal = function(id) {
  delete this.storage[id];
};


FakeStorage.prototype.set = function(wid, id, payload) {
  this.storage[wid + '::' + id] = payload;
};

FakeStorage.prototype.get = function(wid, id) {
  return this.storage[wid + '::' + id];
};

FakeStorage.prototype.clear = function() {
  delete this['storage'];
};

FakeStorage.prototype.getWalletIds = function() {
  var walletIds = [];
  var uniq = {};
  var ignore = ['nameFor', 'lock', 'wallet'];

  for (var ii in this.storage) {
    var split = ii.split('::');
    if (split.length == 2) {
      var walletId = split[0];

      if (!walletId || _.contains(ignore, walletId))
        continue;

      if (typeof uniq[walletId] === 'undefined') {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
    }
  }
  return walletIds;
};

FakeStorage.prototype.legacyGetWallets = function() {
  var wallets = [];
  var ids = this.getWalletIds();

  for (var i in ids) {
    wallets.push({
      id: ids[i],
      name: this.getName(ids[i]),
    });
  }
  return wallets;
};

FakeStorage.prototype.getWallets = function() {
  var self = this;
  var re = /wallet::([^_]+)_(.*)/;

  var wallets = _.compact(_.map(_.keys(self.storage), function(key) {
    if (key.indexOf('wallet::') !== 0)
      return null;
    var match = key.match(re);
    if (match.length != 3)
      return null;
    return {
      id: match[1],
      name: match[2],
    };
  }));

  var legacy = this.legacyGetWallets();
  _.each(legacy, function(w) {
    if (!_.contains(_.pluck(wallets, 'id'), w.id))
      wallets.push(w);
  });

  return wallets;
};

FakeStorage.prototype.legacyDeleteWallet = function(walletId) {
  var toDelete = {};
  toDelete['nameFor::' + walletId] = 1;

  for (var key in this.storage) {
    var split = key.split('::');
    if (split.length == 2 && split[0] === walletId) {
      toDelete[key] = 1;
    }
  }
  for (var i in toDelete) {
    this.removeGlobal(i);
  }
};

FakeStorage.prototype.deleteWallet = function(walletId) {
  this.legacyDeleteWallet();
  var wallet = _.findWhere(this.getWallets(), {
    id: walletId
  });
  console.log(wallet);
  this.removeGlobal('wallet::' + walletId + '_' + wallet.name);
};

FakeStorage.prototype.getName = function(walletId) {
  return this.getGlobal('nameFor::' + walletId);
};


FakeStorage.prototype.setName = function(walletId, name) {
  this.setGlobal('nameFor::' + walletId, name);
};

FakeStorage.prototype.setFromObj = function(walletId, obj) {
  this.set(walletId, 'data', obj);
  this.setName(walletId, obj.opts.name);
};

module.exports = FakeStorage;
