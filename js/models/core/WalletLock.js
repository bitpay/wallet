'use strict';

var preconditions = require('preconditions').singleton();

function WalletLock(storage, walletId, timeoutMin) {
  preconditions.checkArgument(storage);
  preconditions.checkArgument(walletId);

  this.sessionId = storage.getSessionId();
  this.storage = storage;
  this.timeoutMin = timeoutMin || 5;
  this.key = WalletLock._keyFor(walletId);
  //  this._setLock(function() {});
}

WalletLock._keyFor = function(walletId) {
  return 'lock' + '::' + walletId;
};

WalletLock.prototype._isLockedByOther = function(cb) {
  var self = this;

  this.storage.getGlobal(this.key, function(json) {
    var wl = json ? JSON.parse(json) : null;
    var t = wl ? (Date.now() - wl.expireTs) : false;
    // is not locked?
    if (!wl || t > 0 || wl.sessionId === self.sessionId)
      return cb(false);

    // Seconds remainding
    return cb(parseInt(-t / 1000.));
  });
};


WalletLock.prototype._setLock = function(cb) {

  this.storage.setGlobal(this.key, {
    sessionId: this.sessionId,
    expireTs: Date.now() + this.timeoutMin * 60 * 1000,
  }, function() {
    cb(null);
  });
};


WalletLock.prototype.keepAlive = function(cb) {
  preconditions.checkState(this.sessionId);
  var self = this;

  this._isLockedByOther(function(t) {

    if (t)
      return cb(new Error('Wallet is already open. Close it to proceed or wait ' + t + ' seconds if you close it already'));

    self._setLock(cb);
  });
};


WalletLock.prototype.release = function(cb) {
  this.storage.removeGlobal(this.key, cb);
};


module.exports = WalletLock;
