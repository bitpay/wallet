'use strict';

angular.module('copayApp.services')
  .factory('localStorageService', function(platformInfo, $timeout, $log, lodash) {
    var isNW = platformInfo.isNW;
    var isChromeApp = platformInfo.isChromeApp;
    var root = {};
    var ls = ((typeof window.localStorage !== "undefined") ? window.localStorage : null);

    if (isChromeApp && !isNW && !ls) {
      $log.info('Using CHROME storage');
      ls = chrome.storage.local;
    }


    if (!ls)
      throw new Error('localstorage not available');

    root.get = function(k, cb) {
      if (isChromeApp || isNW) {
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

      if (lodash.isObject(v)) {
        v = JSON.stringify(v);
      }
      if (v && !lodash.isString(v)) {
        v = v.toString();
      }

      if (isChromeApp || isNW) {
        var obj = {};

        obj[k] = v;

        chrome.storage.local.set(obj, cb);
      } else {
        ls.setItem(k, v);
        return cb();
      }
    };

    root.remove = function(k, cb) {
      if (isChromeApp || isNW) {
        chrome.storage.local.remove(k, cb);
      } else {
        ls.removeItem(k);
        return cb();
      }

    };


    if (isNW) {
      $log.info('Overwritting localstorage with chrome storage for NW.JS');

      var ts = ls.getItem('migrationToChromeStorage');
      var p = ls.getItem('profile');

      // Need migration?
      if (!ts && p) {
        $log.info('### MIGRATING DATA! TO CHROME STORAGE');

        var j = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var k = ls.key(i);
          var v = ls.getItem(k);

          $log.debug('   Key: ' + k);
          root.set(k, v, function() {
            j++;
            if (j == localStorage.length) {
              $log.info('### MIGRATION DONE');
              ls.setItem('migrationToChromeStorage', Date.now())
              ls = chrome.storage.local;
            }
          })
        }
      } else if (p) {
        $log.info('# Data already migrated to Chrome storage on ' + ts);
      }
    }


    return root;
  });
