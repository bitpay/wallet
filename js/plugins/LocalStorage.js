'use strict';
var _ = require('lodash');
var preconditions = require('preconditions').singleton();
var isChromeApp = window.chrome && chrome.runtime && chrome.runtime.id;


function LocalStorage() {
  this.type = 'DB';

  if (isChromeApp) {
    localStorage = chrome.storage.local;
    window.localStorage = chrome.storage.local;
  }

  preconditions.checkState(typeof localStorage !== 'undefined',
    'localstorage not available, cannot run plugin');
};

LocalStorage.prototype.init = function() {};

LocalStorage.prototype.setCredentials = function(email, password, opts) {
  this.email = email;
  this.password = password;
};

LocalStorage.prototype.getItem = function(k, cb) {
  if (isChromeApp) {
    chrome.storage.local.get(k,
      function(data) {
        //TODO check for errors
        return cb(null, data[k]);
      });
  } else {
    return cb(null, localStorage.getItem(k));
  }
};

/**
 * Same as setItem, but fails if an item already exists
 */
LocalStorage.prototype.createItem = function(name, value, callback) {
  var self = this;
  console.log('createItem ');
  self.getItem(name,
    function(err, data) {
      console.log('error ', err);
      console.log('data ', data);
      if (data) {
        return callback('EEXISTS');
      } else {
        console.log('calling setitem ');
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
    localStorage.setItem(k, v);
    return cb();
  }

};

LocalStorage.prototype.removeItem = function(k, cb) {
  if (isChromeApp) {
    chrome.storage.remove(k, cb);
  } else {
    localStorage.removeItem(k);
    return cb();
  }

};

LocalStorage.prototype.clear = function(cb) {
  if (isChromeApp) {
    chrome.storage.clear();
  } else {
    localStorage.clear();
  }
  return cb();
};

LocalStorage.prototype.allKeys = function(cb) {

  if (isChromeApp) {
    chrome.storage.local.get(null, function(items) {
      return cb(null, _.keys(items));
    });
  } else {
    var ret = [];
    var l = localStorage.length;

    for (var i = 0; i < l; i++)
      ret.push(localStorage.key(i));

    return cb(null, ret);
  }
};

LocalStorage.prototype.getFirst = function(prefix, opts, cb) {
  opts = opts || {};
  var that = this;

  this.allKeys(function(err, allKeys) {
    var keys = _.filter(allKeys, function(k) {
      if ((k === prefix) || k.indexOf(prefix) === 0) return true;
    });

    if (keys.length === 0)
      return cb(new Error('not found'));

    if (opts.onlyKey)
      return cb(null, null, keys[0]);

    that.getItem(keys[0], function(err, data) {
      if (err) {
        return cb(err);
      }
      return cb(null, data, keys[0]);
    });
  });
};

module.exports = LocalStorage;
