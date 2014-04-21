'use strict';

var imports = require('soop').imports();
var parent = imports.parent || require('./Base');

function Storage() {
}
Storage.parent = parent;

Storage.prototype._read = function(k) {
  var ret;
  try {
    ret = JSON.parse(localStorage.getItem(k));
  } catch (e) {};
  return ret;
};

Storage.prototype._write = function(k,v) {
  localStorage.setItem(k, JSON.stringify(v));
};

Storage.prototype._getWalletKeys = function(walletId) {
  var keys = [];

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    var split = key.split('::');
    if (split.length == 2) {
      if (walletId = split[0])
        keys.push(split[1]);
    }
  } 

  return keys;
};

// get value by key
Storage.prototype.getGlobal = function(k) {
  return this._read(k);
};

// set value for key
Storage.prototype.setGlobal = function(k,v) {
  this._write(k,v);
};

// remove value for key
Storage.prototype.removeGlobal = function(k) {
  localStorage.removeItem(k);
};



Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k) {
  return this.getGlobal(this._key(walletId,k));
};

// set value for key
Storage.prototype.set = function(walletId, k,v) {
  this.setGlobal(this._key(walletId,k), v);
};

// remove value for key
Storage.prototype.remove = function(walletId, k) {
  this.removeGlobal(this._key(walletId,k));
};

Storage.prototype.getWalletIds = function() {
  var walletIds = [];
  var uniq = {};

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    var split = key.split('::');
    if (split.length == 2) {
      var walletId = split[0];
      if (typeof uniq[walletId] === 'undefined' ) {
        walletIds.push(walletId);
        uniq[walletId] = 1;
      }
    }
  } 

  return walletIds;
};

//obj contains keys to be set
Storage.prototype.setFromObj = function(walletId, obj) {
  for (var k in obj) {
    this.set(walletId, k, obj[k]);
  }
};

// remove all values
Storage.prototype.clearAll = function() {
  localStorage.clear();
};     

module.exports = require('soop')(Storage);
