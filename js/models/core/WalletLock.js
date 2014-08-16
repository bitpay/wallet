'use strict';

var preconditions = require('preconditions').singleton();

function WalletLock(storage, walletId, timeoutMin) {
  preconditions.checkArgument(storage);
  preconditions.checkArgument(walletId);

  this.sessionId = storage.getSessionId();
  this.storage = storage;
  this.timeoutMin = timeoutMin || 5;
  this.key = WalletLock._keyFor(walletId);
  this._setLock();
}

WalletLock._keyFor = function(walletId) {
  return 'lock' + '::' + walletId;
};

WalletLock.prototype._isLockedByOther = function() {
  var json = this.storage.getGlobal(this.key);
  var wl = json ? JSON.parse(json) : null;
  var t =  wl ? (Date.now() - wl.expireTs) : false;
  // is not locked?
  if (!wl || t > 0 || wl.sessionId === this.sessionId)
    return false;

  // Seconds remainding
  return parseInt(-t/1000.);
};


WalletLock.prototype._setLock = function() {
  this.storage.setGlobal(this.key, {
    sessionId: this.sessionId,
    expireTs: Date.now() + this.timeoutMin * 60 * 1000,
  });
};


WalletLock.prototype.keepAlive = function() {
  preconditions.checkState(this.sessionId);

  var t = this._isLockedByOther();
  if (t)
    throw new Error('Wallet is already open. Close it to proceed or wait '+ t + ' seconds if you close it already' );
  this._setLock();
};


WalletLock.prototype.release = function() {
  this.storage.removeGlobal(this.key);
};


module.exports = WalletLock;
