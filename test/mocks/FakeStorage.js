var FakeStorage = function() {
  this.reset();
};


FakeStorage.prototype.reset = function(password) {
  this.storage = {};
};

FakeStorage.prototype._setPassphrase = function(password) {
  this.storage.passphrase = password;
};

FakeStorage.prototype.setGlobal = function(id, v, cb) {
  this.storage[id] = typeof v === 'object' ? JSON.stringify(v) : v;
  cb();
};

FakeStorage.prototype.getGlobal = function(id, cb) {
  return cb(this.storage[id]);
};

FakeStorage.prototype.getMany = function(wid, fields, cb) {
  var self= this;
  var ret = [];
  for(var ii in fields){
    var k = fields[ii];
    ret[k] = this.storage[wid + '::' + k];
  }

  return cb(ret);
};



FakeStorage.prototype.setLastOpened = function(val, cb) {
  this.storage['lastOpened'] = val;
  return cb();
};

FakeStorage.prototype.getLastOpened = function(cb) {
  return cb(this.storage['lastOpened']);
};

FakeStorage.prototype.setLock = function(id) {
  this.storage[id + '::lock'] = true;
  return cb();
}

FakeStorage.prototype.getLock = function(id, cb) {
  return cb(this.storage[id + '::lock']);
}

FakeStorage.prototype.getSessionId = function(cb) {
  this.sessionId = this.sessionId || 'aSessionId';
  return cb(this.sessionId);
};


FakeStorage.prototype.removeLock = function(id, cb) {
  delete this.storage[id + '::lock'];
  cb();
}

FakeStorage.prototype.removeGlobal = function(id, cb) {
  delete this.storage[id];
  cb();
};


FakeStorage.prototype.set = function(wid, id, payload, cb) {
  this.storage[wid + '::' + id] = payload;
  if (cb) return cb();
};

FakeStorage.prototype.get = function(wid, id, cb) {
  return cb(this.storage[wid + '::' + id]);
};

FakeStorage.prototype.clear = function(cb) {
  delete this['storage'];
  cb();
};

FakeStorage.prototype.getWalletIds = function(cb) {
  var walletIds = [];
  var uniq = {};

  for (var ii in this.storage) {
    var split = ii.split('::');
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
};

FakeStorage.prototype.deleteWallet = function(walletId, cb) {
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


FakeStorage.prototype.getName = function(walletId, cb) {
  return this.getGlobal('nameFor::' + walletId, cb);
};


FakeStorage.prototype.setName = function(walletId, name, cb) {
  this.setGlobal('nameFor::' + walletId, name, cb);
};


FakeStorage.prototype.getWallets = function(cb) {
  var wallets = [];
  var ids = this.getWalletIds();

  for (var i in ids) {
    wallets.push({
      id: ids[i],
      name: this.getName(ids[i]),
    });
  }
  return cb(wallets);
};

FakeStorage.prototype.setFromObj = function(walletId, obj, cb) {
  for (var k in obj) {
    this.set(walletId, k, obj[k]);
  }
  this.setName(walletId, obj.opts.name, cb);
};

module.exports = FakeStorage;
