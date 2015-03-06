'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(localStorageService, sjcl, $log, lodash) {

    var root = {};

    var getUUID = function(cb) {
      // TO SIMULATE MOBILE
      //return cb('hola');
      if (!window || !window.plugins || !window.plugins.uniqueDeviceID)
        return cb(null);

      window.plugins.uniqueDeviceID.get(
        function(uuid) {
          return cb(uuid);
        }, cb);
    };

    var encryptOnMobile = function(text, cb) {
      getUUID(function(uuid) {
        if (uuid) {
          $log.debug('Encrypting profile');
          text = sjcl.encrypt(uuid, text);
        }
        return cb(null, text);
      });
    };


    var decryptOnMobile = function(text, cb) {
      var json;
      try {
        json = JSON.parse(text);
      } catch (e) {};

      if (!json.iter || !json.ct)
        return cb(null, text);

      $log.debug('Profile is encrypted');
      getUUID(function(uuid) {
        if (!uuid)
          return cb(new Error('Could not decrypt localstorage profile'));

        text = sjcl.decrypt(uuid, text);
        return cb(null, text);
      });
    };

    root.storeNewProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        localStorageService.create('profile', x, cb);
      });
    };

    root.storeProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        localStorageService.set('profile', x, cb);
      });
    };

    root.getProfile = function(cb) {
      localStorageService.get('profile', function(err, str) {
        if (err || !str) return cb(err);

        decryptOnMobile(str, function(err, str) {
          if (err) return cb(err);
          var p, err;
          try {
            p = Profile.fromString(str);
          } catch (e) {
            err = new Error('Could not read profile:' + p);
          }
          return cb(err, p);
        });
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

    root.getLastAddress = function(walletId, cb) {
      localStorageService.get('lastAddress-' + walletId, cb);
    };

    root.storeLastAddress = function(walletId, address, cb) {
      localStorageService.set('lastAddress-' + walletId, address, cb);
    };

    root.clearLastAddress = function(walletId, cb) {
      localStorageService.remove('lastAddress-' + walletId, cb);
    };

    root.setBackupFlag = function(walletId, cb) {
      localStorageService.set('backup-' + walletId, Date.now(), cb);
    };

    root.getBackupFlag = function(walletId, cb) {
      localStorageService.get('backup-' + walletId, cb);
    };

    return root;
  });
