'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, platformInfo) {

    var root = {};

    // File storage is not supported for writing according to
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = platformInfo.isCordova && !platformInfo.isWP;
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

    var decryptOnMobile = function(text, cb) {
      var json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        $log.warn('Could not open profile:' + text);

        var i = text.lastIndexOf('}{');
        if (i > 0) {
          text = text.substr(i + 1);
          $log.warn('trying last part only:' + text);
          try {
            json = JSON.parse(text);
            $log.warn('Worked... saving.');
            storage.set('profile', text, function() {});
          } catch (e) {
            $log.warn('Could not open profile (2nd try):' + e);
          };
        };

      };

      if (!json) return cb('Could not access storage')

      if (!json.iter || !json.ct) {
        $log.debug('Profile is not encrypted');
        return cb(null, text);
      }

      $log.debug('Profile is encrypted');
      getUUID(function(uuid) {
        $log.debug('Device UUID:' + uuid);
        if (!uuid)
          return cb('Could not decrypt storage: could not get device ID');

        try {
          text = sjcl.decrypt(uuid, text);

          $log.info('Migrating to unencrypted profile');
          return storage.set('profile', text, function(err) {
            return cb(err, text);
          });
        } catch (e) {
          $log.warn('Decrypt error: ', e);
          return cb('Could not decrypt storage: device ID mismatch');
        };
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
      storage.create('profile', profile.toObj(), cb);
    };

    root.storeProfile = function(profile, cb) {
      storage.set('profile', profile.toObj(), cb);
    };

    root.getProfile = function(cb) {
      storage.get('profile', function(err, str) {
        if (err || !str)
          return cb(err);

        decryptOnMobile(str, function(err, str) {
          if (err) return cb(err);
          var p, err;
          try {
            p = Profile.fromString(str);
          } catch (e) {
            $log.debug('Could not read profile:', e);
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
      storage.set('focusedWalletId', id || '', cb);
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

    root.clearBackupFlag = function(walletId, cb) {
      storage.remove('backup-' + walletId, cb);
    };

    root.setCleanAndScanAddresses = function(walletId, cb) {
      storage.set('CleanAndScanAddresses', walletId, cb);
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

    root.setHideBalanceFlag = function(walletId, val, cb) {
      storage.set('hideBalance-' + walletId, val, cb);
    };

    root.getHideBalanceFlag = function(walletId, cb) {
      storage.get('hideBalance-' + walletId, cb);
    };

    //for compatibility
    root.getCopayDisclaimerFlag = function(cb) {
      storage.get('agreeDisclaimer', cb);
    };

    root.setRemotePrefsStoredFlag = function(cb) {
      storage.set('remotePrefStored', true, cb);
    };

    root.getRemotePrefsStoredFlag = function(cb) {
      storage.get('remotePrefStored', cb);
    };

    root.setGlideraToken = function(network, token, cb) {
      storage.set('glideraToken-' + network, token, cb);
    };

    root.getGlideraToken = function(network, cb) {
      storage.get('glideraToken-' + network, cb);
    };

    root.removeGlideraToken = function(network, cb) {
      storage.remove('glideraToken-' + network, cb);
    };

    root.setCoinbaseRefreshToken = function(network, token, cb) {
      storage.set('coinbaseRefreshToken-' + network, token, cb);
    };

    root.getCoinbaseRefreshToken = function(network, cb) {
      storage.get('coinbaseRefreshToken-' + network, cb);
    };

    root.removeCoinbaseRefreshToken = function(network, cb) {
      storage.remove('coinbaseRefreshToken-' + network, cb);
    };

    root.setCoinbaseToken = function(network, token, cb) {
      storage.set('coinbaseToken-' + network, token, cb);
    };

    root.getCoinbaseToken = function(network, cb) {
      storage.get('coinbaseToken-' + network, cb);
    };

    root.removeCoinbaseToken = function(network, cb) {
      storage.remove('coinbaseToken-' + network, cb);
    };

    root.setAddressbook = function(network, addressbook, cb) {
      storage.set('addressbook-' + network, addressbook, cb);
    };

    root.getAddressbook = function(network, cb) {
      storage.get('addressbook-' + network, cb);
    };

    root.removeAddressbook = function(network, cb) {
      storage.remove('addressbook-' + network, cb);
    };


    root.checkQuota = function() {
      var block = '';
      // 50MB
      for (var i = 0; i < 1024 * 1024; ++i) {
        block += '12345678901234567890123456789012345678901234567890';
      }
      storage.set('test', block, function(err) {
        $log.error('CheckQuota Return:' + err);
      });
    };

    root.setTxHistory = function(txs, walletId, cb) {
      try {
        storage.set('txsHistory-' + walletId, txs, cb);
      } catch (e) {
        $log.error('Error saving tx History. Size:' + txs.length);
        $log.error(e);
        return cb(e);
      }
    }

    root.getTxHistory = function(walletId, cb) {
      storage.get('txsHistory-' + walletId, cb);
    }

    root.removeTxHistory = function(walletId, cb) {
      storage.remove('txsHistory-' + walletId, cb);
    }

    root.setCoinbaseTxs = function(network, ctx, cb) {
      storage.set('coinbaseTxs-' + network, ctx, cb);
    };

    root.getCoinbaseTxs = function(network, cb) {
      storage.get('coinbaseTxs-' + network, cb);
    };

    root.removeCoinbaseTxs = function(network, cb) {
      storage.remove('coinbaseTxs-' + network, cb);
    };

    root.setBitpayCard = function(network, data, cb) {
      storage.set('bitpayCard-' + network, data, cb);
    };

    root.getBitpayCard = function(network, cb) {
      storage.get('bitpayCard-' + network, cb);
    };

    root.removeBitpayCard = function(network, cb) {
      storage.remove('bitpayCard-' + network, cb);
    };

    root.removeAllWalletData = function(walletId, cb) {
      root.clearLastAddress(walletId, function(err) {
        if (err) return cb(err);
        root.removeTxHistory(walletId, function(err) {
          if (err) return cb(err);
          root.clearBackupFlag(walletId, function(err) {
            return cb(err);
          });
        });
      });
    };

    root.setAmazonGiftCards = function(network, gcs, cb) {
      storage.set('amazonGiftCards-' + network, gcs, cb);
    };

    root.getAmazonGiftCards = function(network, cb) {
      storage.get('amazonGiftCards-' + network, cb);
    };

    root.removeAmazonGiftCards = function(network, cb) {
      storage.remove('amazonGiftCards-' + network, cb);
    };

    return root;
  });
