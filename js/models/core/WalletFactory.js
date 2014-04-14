'use strict';

var imports = require('soop').imports();

function Wallet(opts) {
  opts = opts || {};
  this.host = 'localhost';
  this.port = '3001';
}

WalletFactory = function() {
  this.storage = copay.Storage.default();
};

WalletFactory.prototype.create = function(config, opts) {
  var w = new Wallet(config, opts);
  w.store();
  this._addWalletId(w.id);
};

WalletFactory.prototype.get = function(walletId) {
  return Wallet.read(walletId);
};

WalletFactory.prototype.remove = function(walletId) {
  // TODO remove wallet contents, not only the id (Wallet.remove?)
  this._delWalletId(walletId);
};

WalletFactory.prototype._addWalletId = function(walletId) {
  var ids = this._getWalletIds();
  if (ids.indexOf(walletId) == -1) return;
  localStorage.setItem('walletIds', (ids ? ids + ',' : '') + walletId);
};

WalletFactory.prototype._delWalletId = function(walletId) {
  var ids = this._getWalletIds();
  var index = ids.indexOf(walletId);
  if (index == -1) return;
  ids.splice(index, 1); // removes walletId
  this.storage.set('walletIds', ids.join(','));
};

WalletFactory.prototype._getWalletIds = function() {
  var ids = this.storage.get('walletIds');
  return ids ? ids.split(',') : [];
};
