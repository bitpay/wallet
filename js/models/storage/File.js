'use strict';
var imports = require('soop').imports();
var fs = imports.fs || require('fs');

function Storage(opts) {
  opts = opts || {};

  this.data = {};
  this.filename = opts.filename;
}

Storage.prototype.load = function(callback) {
  if (!this.filename)
    throw new Error('No filename');

  fs.readFile(this.filename, function(err, data) {
    if (err) return callback(err);

    try {
      this.data = JSON.parse(data);
    } catch (err) {
      return callback(err);
    }

    return callback(null);
  });
};

Storage.prototype.save = function(callback) {
  var data = JSON.stringify(this.data);

  //TODO: update to use a queue to ensure that saves are made sequentially
  fs.writeFile(this.filename, data, function(err) {
    return callback(err);
  });
};

Storage.prototype._read = function(k) {
  return this.data[k];
};

Storage.prototype._write = function(k, v, callback) {
  this.data[k] = v;
  this.save(callback);
};

// get value by key
Storage.prototype.getGlobal = function(k) {
  return this.data[k];
};

// set value for key
Storage.prototype.setGlobal = function(k, v, callback) {
  this._write(k, v, callback);
};

// remove value for key
Storage.prototype.removeGlobal = function(k, callback) {
  delete this.data[k];
  this.save(callback);
};

Storage.prototype._key = function(walletId, k) {
  return walletId + '::' + k;
};
// get value by key
Storage.prototype.get = function(walletId, k) {
  return this.getGlobal(this._key(walletId, k));
};

// set value for key
Storage.prototype.set = function(walletId, k, v, callback) {
  this.setGlobal(this._key(walletId,k), v, callback);
};

// remove value for key
Storage.prototype.remove = function(walletId, k, callback) {
  this.removeGlobal(this._key(walletId, k), callback);
};

// remove all values
Storage.prototype.clearAll = function(callback) {
  this.data = {};
  this.save(callback);
};     

module.exports = require('soop')(Storage);
