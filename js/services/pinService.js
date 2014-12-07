'use strict';

angular.module('copayApp.services')
  .factory('pinService', function($rootScope, localstorageService) {

    var KEY = 'pinDATA';
    var SALT = '4gllotIKguqi0EkIslC0';
    var ITER = 5000;

    var ls = localstorageService;
    var root = {};

    root.check = function(cb) {
      ls.getItem(KEY, function(err, value) {
        return cb(err, value ? true : false);
      });
    };

    root.get = function(pin, cb) {
      ls.getItem(KEY, function(err, value) {
        if (!value) return cb(null);
        var enc = value;
        var data = copay.crypto.decrypt('' + parseInt(pin), enc);
        var err = new Error('Could not decrypt');
        if (data) {
          var obj;
          try {
            obj = JSON.parse(data);
            err = null;
          } catch (e) {};
        }
        return cb(err, obj);
      });
    };

    root.save = function(pin, email, password, cb) {
      var credentials = {
        email: email,
        password: password,
      };
      var enc = copay.crypto.encrypt('' + parseInt(pin), credentials, SALT, ITER);
      ls.setItem(KEY, enc, function(err) {
        return cb(err);
      });
    };

    root.clear = function(cb) {
      ls.removeItem(KEY, cb);
    };


    root.makePinInput = function(scope, name, cb) {
      Object.defineProperty(scope, name, {
          get: function() {
            return this['_' + name];
          },
          set: function(newValue) {
            this['_' + name] = newValue;
            scope.error = null;
            if (newValue && newValue.length == 4) {
              return cb(newValue);
            }
          },
          enumerable: true,
          configurable: true
        });
    };


    return root;
  });
