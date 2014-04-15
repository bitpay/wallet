'use strict';

var imports = require('soop').imports();

function Storage() {
  this.data = {};
}

Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k) {
  return JSON.parse(localStorage.getItem(this._key(walletId,k)));
};


// set value for key
Storage.prototype.set = function(walletId, k,v) {
  localStorage.setItem(this._key(walletId,k), JSON.stringify(v));
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
  localStorage.removeItem(this._key(walletId,k));
};

// remove all values
Storage.prototype.clearAll = function() {
  localStorage.clear();
};     

module.exports = require('soop')(Storage);
