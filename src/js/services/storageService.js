'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, isCordova) {

    var root = {};

    // File storage is not supported for writting according to 
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = isCordova && !isMobile.Windows();
    $log.debug('Using file storage:', shouldUseFileStorage);


    var storage = shouldUseFileStorage ? fileStorageService : localStorageService;

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



    root.tryToMigrate = function(cb) {
      if (!shouldUseFileStorage) return cb();

      localStorageService.get('profile', function(err, str) {
        if (err) return cb(err);
        if (!str) return cb();

        $log.info('Starting Migration profile to File storage...');

        fileStorageService.create('profile', str, function(err) {
          if (err) cb(err);
          $log.info('Profile Migrated successfully');

          localStorageService.get('config', function(err, c) {
            if (err) return cb(err);
            if (!c) return root.getProfile(cb);

            fileStorageService.create('config', c, function(err) {

              if (err) {
                $log.info('Error migrating config: ignoring', err);
                return root.getProfile(cb);
              }
              $log.info('Config Migrated successfully');
              return root.getProfile(cb);
            });
          });
        });
      });
    };

    root.storeNewProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        storage.create('profile', x, cb);
      });
    };

    root.storeProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        storage.set('profile', x, cb);
      });
    };

    root.getProfile = function(cb) {
      storage.get('profile', function(err, str) {

        if (err || !str)
        // Migrate ?
          return cb(err);

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
      storage.remove('profile', cb);
    };

    root.storeFocusedWalletId = function(id, cb) {
      storage.set('focusedWalletId', id||'', cb);
    };

    root.getFocusedWalletId = function(cb) {
      storage.get('focusedWalletId', cb);
    };

    root.getLastAddress = function(walletId, cb) {
      storage.get('lastAddress-' + walletId, cb);
    };

    root.storeLastAddress = function(walletId, address, cb) {
      storage.set('lastAddress-' + walletId, address, cb);
    };

    root.clearLastAddress = function(walletId, cb) {
      storage.remove('lastAddress-' + walletId, cb);
    };

    root.setBackupFlag = function(walletId, cb) {
      storage.set('backup-' + walletId, Date.now(), cb);
    };

    root.getBackupFlag = function(walletId, cb) {
      storage.get('backup-' + walletId, cb);
    };

    root.setCleanAndScanAddresses = function(cb) {
      storage.set('CleanAndScanAddresses', Date.now(), cb);
    };

    root.getCleanAndScanAddresses = function(cb) {
      storage.get('CleanAndScanAddresses', cb);
    };

    root.removeCleanAndScanAddresses = function(cb) {
      storage.remove('CleanAndScanAddresses', cb);
    };

    root.getConfig = function(cb) {
      storage.get('config', cb);
    };

    root.storeConfig = function(val, cb) {
      $log.debug('Storing Preferences', val);
      storage.set('config', val, cb);
    };

    root.clearConfig = function(cb) {
      storage.remove('config', cb);
    };

    root.setCopayDisclaimer = function(cb) {
      storage.set('agreeDisclaimer', true, cb);
    };

    root.getCopayDisclaimer = function(cb) {
      storage.get('agreeDisclaimer', cb);
    };

    return root;
  });
