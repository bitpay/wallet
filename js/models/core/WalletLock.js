'use strict';

var preconditions = require('preconditions').singleton();

function WalletLock(storage, walletId, timeoutMin) {
  preconditions.checkArgument(storage);
  preconditions.checkArgument(walletId);

  this.sessionId = storage.getSessionId();
  this.storage = storage;
  this.timeoutMin = timeoutMin || 5;
  this.key = WalletLock._keyFor(walletId);
  this.keepAlive();
}
WalletLock._keyFor = function(walletId) {
  return 'lock' + '::' + walletId;
};

WalletLock.prototype._isLockedByOther = function() {
  var wl = this.storage.getGlobal(this.key);

  if (!wl || wl.expireTs < Date.now() || wl.sessionId === this.sessionId)
    return false;

  return true;
};


WalletLock.prototype.keepAlive = function() {
  preconditions.checkState(this.sessionId);

  if (this._isLockedByOther())
    throw new Error('Could not adquire lock');

  this.storage.setGlobal(this.key, {
    sessionId: this.sessionId,
    expireTs: Date.now() + this.timeoutMin * 60 * 1000,
  });
};


WalletLock.prototype.release = function() {
  this.storage.removeGlobal(this.key);
};


module.exports = WalletLock;
