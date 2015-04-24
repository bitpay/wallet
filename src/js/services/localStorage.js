'use strict';

angular.module('copayApp.services')
  .factory('localStorageService', function(isChromeApp, $timeout) {
    var root = {};
    var ls = ((typeof window.localStorage !== "undefined") ? window.localStorage : null);

    if (isChromeApp && !ls) {
      ls = localStorage = chrome.storage.local;
      window.localStorage = chrome.storage.local;
    }

    if (!ls)
      throw new Error('localstorage not available');

    root.get = function(k, cb) {
      if (isChromeApp) {
        chrome.storage.local.get(k,
          function(data) {
            //TODO check for errors
            return cb(null, data[k]);
          });
      } else {
console.log('[localStorage.js.24]',k); //TODO
console.log('[localStorage.js.25:TODO:]'); //TODO
console.log('[localStorage.js.26:TODO:]'); //TODO
console.log('[localStorage.js.27:TODO:]'); //TODO
        $timeout(function() {
        return cb(null, ls.getItem(k));
        }, 1000);
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

    return root;
  });
