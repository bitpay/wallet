'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(localStorageService) {

    var root = {};

    root.storeNewProfile = function(profile, cb) {
      localStorageService.create('profile', profile.toObj(), cb);
    };

    root.storeProfile = function(profile, cb) {
      localStorageService.set('profile', profile.toObj(), cb);
    };

    root.getProfile = function(cb) {
      localStorageService.get('profile', function(err, str) {
        if (err || !str) return cb(err);

        return cb(null, Profile.fromString(str));
      });
    };

    root.deleteProfile = function(cb) {
      localStorageService.remove('profile',
        function(err) {
          return cb(err);
        });
    };

    root.storeFocusedWalletId = function(id, cb) {
      localStorageService.set('focusedWalletId', id, cb);
    };

    root.getFocusedWalletId = function(cb) {
      localStorageService.get('focusedWalletId', cb);
    };

    return root;
  });
