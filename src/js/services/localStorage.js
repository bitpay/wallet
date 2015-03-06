'use strict';

angular.module('copayApp.services')
  .factory('localStorageService', function() {

    var isChromeApp = typeof window !== "undefined" && window.chrome && chrome.runtime && chrome.runtime.id;
    var root = {};

    var ls = ((typeof localStorage !== "undefined") ? localStorage : null);

    if (isChromeApp && !ls) {
      ls = localStorage = chrome.storage.local;
      window.localStorage = chrome.storage.local;
    }

    if (!ls)
      throw new Error('localstorage not available, cannot run plugin');

    root.init = function() {};

    root.get = function(k, cb) {
      if (isChromeApp) {
        chrome.storage.local.get(k,
          function(data) {
            //TODO check for errors
            return cb(null, data[k]);
          });
      } else {
        return cb(null, ls.getItem(k));
      }
    };

    /**
     * Same as setItem, but fails if an item already exists
     */
    root.create = function(name, value, callback) {
      root.get(name,
        function(err, data) {
          if (data) {
            return callback('EEXISTS');
          } else {
            return root.set(name, value, callback);
          }
        });
    };

    root.set = function(k, v, cb) {
      if (isChromeApp) {
        var obj = {};
        obj[k] = v;

        chrome.storage.local.set(obj, cb);
      } else {
        ls.setItem(k, v);
        return cb();
      }

    };

    root.remove = function(k, cb) {
      if (isChromeApp) {
        chrome.storage.local.remove(k, cb);
      } else {
        ls.removeItem(k);
        return cb();
      }

    };

    root.clear = function(cb) {
      // NOP
      return cb();
    };

    root.list = function(cb) {
      if (isChromeApp) {
        chrome.storage.local.get(null, function(items) {
          return cb(null, lodash.keys(items));
        });
      } else {
        var ret = [];
        var l = ls.length;

        for (var i = 0; i < l; i++)
          ret.push(ls.key(i));

        return cb(null, ret);
      }
    };

    return root;
  });
