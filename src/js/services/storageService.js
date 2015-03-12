'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(localStorageService) {

    var root = {};
    root.createProfile = function(profile, cb) {
      localStorageService.create('profile', profile.toObj(), cb);
    };

    root.storeProfile = function(profile, cb) {
      localStorageService.set('profile', profile.toObj(), cb);
    };

    root.deleteProfile = function(cb) {
      localStorageService.remove('profile',
        function(err) {
          return cb(err);
        });
    };

    return root;
  });
