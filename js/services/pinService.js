'use strict';

angular.module('copayApp.services')
  .factory('pinService', function($rootScope, $timeout, localstorageService) {

    var KEY = 'pinDATA';
    var SALT = '4gllotIKguqi0EkIslC0';
    var ITER = 5000;

    var ls = localstorageService;
    var root = {};

    var _firstpin;

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

    root.clearPin = function(scope) {
      scope.digits = [];
      scope.defined = [];     
    };

    root.pressPin = function(scope, digit, skipOpenWithPin) {
      scope.error = null;
      scope.digits.push(digit);
      scope.defined.push(true);
      if (scope.digits.length == 4) {
        var pin = scope.digits.join('');
        if (!$rootScope.hasPin) {
          if (!_firstpin) {
            _firstpin = pin;
            scope.askForPin = 2;
            $timeout(function() {
              scope.clear();
            }, 100);
            return;
          }
          else {
            if (pin === _firstpin) {
              _firstpin = null;
              scope.askForPin = null;
              scope.createPin(pin);
              return;
            }
            else {
              _firstpin = null;
              scope.askForPin = 1;
              $timeout(function() {
                scope.clear();
                scope.error = 'Entered PINs were not equal. Try again';
                $timeout(function() {
                  scope.error = null;
                }, 2000);
              }, 100);
              return;
            }
          }
        }
        if (!skipOpenWithPin) {
          scope.openWithPin(pin);
        }
      }   
    };

    root.skipPin = function(scope, creatingProfile) {
      if (!$rootScope.hasPin) {
        if (!creatingProfile) {
          scope.openWallets();
        }
        else {
          scope.createDefaultWallet()        
        }
      }
      else {
        scope.pinLogout();
      }   
    };

    return root;
  });
