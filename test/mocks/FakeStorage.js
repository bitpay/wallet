var FakeStorage = function() {
  this.reset();
};


FakeStorage.prototype.reset = function(password) {
  this.storage = {};
};

FakeStorage.prototype._setPassphrase = function(password) {
  this.storage.passphrase = password;
};

FakeStorage.prototype.setGlobal = function(id, payload) {
  this.storage[id] = payload;
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

  for (var ii in this.storage) {
    var split = ii.split('::');
    if (split.length == 2) {
      var walletId = split[0];
      if (walletId !== 'nameFor' && typeof uniq[walletId] === 'undefined') {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
    }
  }
  return walletIds;
};

FakeStorage.prototype.deleteWallet = function(walletId) {
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


FakeStorage.prototype.getName = function(walletId) {
  return this.getGlobal('nameFor::' + walletId);
};


FakeStorage.prototype.setName = function(walletId, name) {
  this.setGlobal('nameFor::' + walletId, name);
};


FakeStorage.prototype.getWallets = function() {
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

FakeStorage.prototype.setFromObj = function(walletId, obj) {
  for (var k in obj) {
    this.set(walletId, k, obj[k]);
  }
  this.setName(walletId, obj.opts.name);
};

module.exports = FakeStorage;
