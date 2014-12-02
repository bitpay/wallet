'use strict';

angular.module('copayApp.services')
  .factory('pinService', function($rootScope) {
    var root = {};
    var storage = {
      pinData: {
        pin: 1234,
        credentials: {
          email: '4@queparece',
          password: '1',
        }
      }
    };
    root.check = function() {
      return storage.pinData ? true : false;
    };
    root.get = function(pin) {
      var storedPin = storage.pinData.pin;
      if (storedPin !== pin)
        return;

      return storage.pinData.credentials;
    };
    root.save = function(pin, email, password) {
      storage.pinData = {
        pin: pin,
        credentials: {
          email: email,
          password: password
        }
      };
    };
    root.clear = function(){
     delete storage['pinData'];
    };
    return root;
  });
