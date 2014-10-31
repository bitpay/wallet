'use strict';

var preconditions = require('preconditions').singleton();

function WalletLock(storage, walletId, timeoutMin) {
  preconditions.checkArgument(storage);
  preconditions.checkArgument(walletId);

  this.storage = storage;
  this.timeoutMin = timeoutMin || 5;
  this.key = WalletLock._keyFor(walletId);
}

WalletLock.prototype.getSessionId = function(cb) {
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


WalletLock.prototype.init = function(cb) {
  preconditions.checkArgument(cb);
  var self = this;

  self.storage.getSessionId(function(sid) {
    preconditions.checkState(sid);

    self.sessionId = sid;
    cb();
  });
};

WalletLock._keyFor = function(walletId) {
  return 'lock' + '::' + walletId;
};

WalletLock.prototype._isLockedByOther = function(cb) {
  var self = this;

  this.storage.getGlobal(this.key, function(json) {
    var wl = json ? JSON.parse(json) : null;
    if (!wl || !wl.expireTs)
      return cb(false);

    var expiredSince = Date.now() - wl.expireTs;
    if (expiredSince >= 0)
      return cb(false);

    var isMyself = wl.sessionId === self.sessionId;

    if (isMyself)
      return cb(false);

    // Seconds remainding
    return cb(parseInt(-expiredSince / 1000));
  });
};


WalletLock.prototype._setLock = function(cb) {
  preconditions.checkArgument(cb);
  preconditions.checkState(this.sessionId);
  var self = this;

  this.storage.setGlobal(this.key, {
    sessionId: this.sessionId,
    expireTs: Date.now() + this.timeoutMin * 60 * 1000,
  }, function() {

    cb(null);
  });
};


WalletLock.prototype._doKeepAlive = function(cb) {
  preconditions.checkArgument(cb);
  preconditions.checkState(this.sessionId);

  var self = this;

  this._isLockedByOther(function(t) {
    if (t)
      return cb(new Error('LOCKED: Wallet is locked for ' + t + ' srcs'));

    self._setLock(cb);
  });
};



WalletLock.prototype.keepAlive = function(cb) {
  var self = this;

  if (!self.sessionId) {
    return self.init(self._doKeepAlive.bind(self, cb));
  };

  return this._doKeepAlive(cb);
};


WalletLock.prototype.release = function(cb) {
  this.storage.removeGlobal(this.key, cb);
};


module.exports = WalletLock;
