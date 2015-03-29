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
      localStorageService.remove('profile', cb);
    };

    root.storeFocusedWalletId = function(id, cb) {
      localStorageService.set('focusedWalletId', id, cb);
    };

    root.getFocusedWalletId = function(cb) {
      localStorageService.get('focusedWalletId', cb);
    };

    root.getLastAddress = function(cb) {
      localStorageService.get('lastAddress', cb);
    };

    root.storeLastAddress = function(address, cb) {
      localStorageService.set('lastAddress', address, cb);
    };

    root.clearLastAddress = function(cb) {
      localStorageService.remove('lastAddress', cb);
    };

    return root;
  });
