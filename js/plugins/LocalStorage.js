'use strict';
var _ = require('lodash');
var preconditions = require('preconditions').singleton();
var isChromeApp = typeof window !== "undefined" && window.chrome && chrome.runtime && chrome.runtime.id;


function LocalStorage(opts) {
  this.type = 'DB';
  opts = opts || {};




  this.ls = opts.ls ||
    ((typeof localStorage !== "undefined") ? localStorage : null);

  if (isChromeApp && !this.ls) {
    this.ls = localStorage = chrome.storage.local;
    window.localStorage = chrome.storage.local;
  }

  preconditions.checkState(this.ls,
    'localstorage not available, cannot run plugin');
};

LocalStorage.prototype.init = function() {};

LocalStorage.prototype.setCredentials = function(email, password, opts) {
  // NOP
};

LocalStorage.prototype.getItem = function(k, cb) {
  if (isChromeApp) {
    chrome.storage.local.get(k,
      function(data) {
        //TODO check for errors
        return cb(null, data[k]);
      });
  } else {
    return cb(null, this.ls.getItem(k));
  }
};

/**
 * Same as setItem, but fails if an item already exists
 */
LocalStorage.prototype.createItem = function(name, value, callback) {
  var self = this;
  self.getItem(name,
    function(err, data) {
      if (data) {
        return callback('EEXISTS');
      } else {
        return self.setItem(name, value, callback);
      }
    });
};

LocalStorage.prototype.setItem = function(k, v, cb) {
  if (isChromeApp) {
    var obj = {};
    obj[k] = v;

    chrome.storage.local.set(obj, cb);
  } else {
    this.ls.setItem(k, v);
    return cb();
  }

};

LocalStorage.prototype.removeItem = function(k, cb) {
  if (isChromeApp) {
    chrome.storage.remove(k, cb);
  } else {
    this.ls.removeItem(k);
    return cb();
  }

};

LocalStorage.prototype.clear = function(cb) {
  // NOP
  return cb();
};

LocalStorage.prototype.allKeys = function(cb) {
  if (isChromeApp) {
    chrome.storage.local.get(null, function(items) {
      return cb(null, _.keys(items));
    });
  } else {
    var ret = [];
    var l = this.ls.length;

    for (var i = 0; i < l; i++)
      ret.push(this.ls.key(i));

    return cb(null, ret);
  }
};



module.exports = LocalStorage;
