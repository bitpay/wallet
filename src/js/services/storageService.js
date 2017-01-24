'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, platformInfo, $timeout) {

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

    ////////////////////////////////////////////////////////////////////////////
    //
    // UPGRADING STORAGE
    //
    // Upgraders are executed in numerical order per the '##_' object key prefix. Each upgrader will run.
    // Each upgrader should detect storage configuraton and fail-safe; no upgrader should damage the ability
    // of another to function properly (in order). Each upgrader should upgrade storage incrementally; storage
    // upgrade is not complete until all upgraders have run.
    // 
    // 1. Write a function to upgrade the desired storage key(s).  The function should have the protocol:
    //
    //    _upgrade_x(key, network, cb), where:
    //
    //    `x` is the name of the storage key
    //    `key` is the name of the storage key being upgraded
    //    `network` is one of 'livenet', 'testnet'
    //
    // 2. Add the storage key to `_upgraders` object using the name of the key as the `_upgrader` object key
    //    with the value being the name of the upgrade function (e.g., _upgrade_x).  In order to avoid conflicts
    //    when a storage key is involved in multiple upgraders as well as predicte the order in which upgrades
    //    occur the `_upgrader` object key should be prefixed with '##_' (e.g., '01_') to create a unique and
    //    sortable name. This format is interpreted by the _upgrade() function.
    //    
    // 3. Any dependency functions called by upgraders should be copied/factored out and remain unchanged as
    //    long as the upgrader remains in effect.  By convention the dependency function is prefixed by '##_' to
    //    match the upgrader key.
    //
    var _upgraders = {
      '00_bitpayDebitCards'      : _upgrade_bitpayDebitCards,      // 2016-11: Upgrade bitpayDebitCards-x to bitpayAccounts-x
      '01_bitpayCardCredentials' : _upgrade_bitpayCardCredentials, // 2016-11: Upgrade bitpayCardCredentials-x to appIdentity-x
      '02_bitpayAccounts'        : _upgrade_bitpayAccounts,        // 2016-12: Upgrade bitpayAccounts-x to bitpayAccounts-v2-x
      '03_bitpayAccounts-v2'     : _validate_bitpayAccounts_v2     // 2017-01: Validate keys on bitpayAccounts-v2-x, remove if not valid
    };

    function _upgrade_bitpayDebitCards(key, network, cb) {
      key += '-' + network;
      storage.get(key, function(err, data) {
        if (err) return cb(err);
        if (data != null) {
          // Needs upgrade
          if (lodash.isString(data)) {
            data = JSON.parse(data);
          }
          data = data || {};
          _00_setBitpayDebitCards(network, data, function(err) {
            if (err) return cb(err);
            storage.remove(key, function() {
              cb(null, 'replaced with \'bitpayAccounts\'');
            });
          });
        } else {
          cb();
        }
      });
    };

    function _upgrade_bitpayCardCredentials(key, network, cb) {
      key += '-' + network;
      storage.get(key, function(err, data) {
        if (err) return cb(err);
        if (data != null) {
          // Needs upgrade
          _01_setAppIdentity(network, data, function(err) {
            if (err) return cb(err);
            storage.remove(key, function() {
              cb(null, 'replaced with \'appIdentity\'');
            });
          });
        } else {
          cb();
        }
      });
    };

    function _upgrade_bitpayAccounts(key, network, cb) {
      key += '-' + network;
      storage.get(key, function(err, data) {
        if (err) return cb(err);
        if (lodash.isString(data)) {
          data = JSON.parse(data);
        }
        data = data || {};
        var upgraded = '';
        _asyncEach(Object.keys(data), function(key, callback) {
          // Keys are account emails
          if (!data[key]['bitpayApi-' + network]) {
            // Needs upgrade
            upgraded += ' ' + key;
            var acctData = {
              acct: data[key],
              token: data[key]['bitpayDebitCards-' + network].token,
              email: key
            };
            _02_setBitpayAccount(network, acctData, function(err) {
              if (err) return cb(err);

              _02_setBitpayDebitCards(network, data[key]['bitpayDebitCards-' + network], function(err) {
                if (err) return cb(err);
                callback();
              });
            });
          }
        }, function() {
          // done
          // Remove obsolete key.
          storage.remove('bitpayAccounts-' + network, function() {
            if (upgraded.length > 0) {
              cb(null, 'upgraded to \'bitpayAccounts-v2-' + network + '\':' + upgraded);
            } else {
              cb();
            }          
          });
        });
      });
    };

    function _validate_bitpayAccounts_v2(key, network, cb) {
      key += '-' + network;
      storage.get(key, function(err, data) {
        if (err) return cb(err);
        if (lodash.isString(data)) {
          data = JSON.parse(data);
        }
        data = data || {};
        var verified = '';
        var toRemove = [];
        _asyncEach(Object.keys(data), function(key, callback) {
          // Verify account API data
          if (!data[key]['bitpayApi-' + network] ||
            !data[key]['bitpayApi-' + network].token) {
            // Invalid entry - one or more keys are missing
            toRemove.push(key);
            return callback();
          }
          // Verify debit cards
          if (Array.isArray(data[key]['bitpayDebitCards-' + network])) {
            for (var i = 0; i < data[key]['bitpayDebitCards-' + network].length; i++) {
              if (!data[key]['bitpayDebitCards-' + network][i].token ||
                !data[key]['bitpayDebitCards-' + network][i].eid ||
                !data[key]['bitpayDebitCards-' + network][i].id ||
                !data[key]['bitpayDebitCards-' + network][i].lastFourDigits) {
                // Invalid entry - one or more keys are missing
                toRemove.push(key);
                return callback();
              }
            }
          }
          verified += ' ' + key;
          return callback();
        }, function() {
          // done, remove invalid account entrys
          if (toRemove.length > 0) {
            var removed = '';
            for (var i = 0; i < toRemove.length; i++) {
              removed += ' ' + toRemove[i];
              delete data[toRemove[i]];
            }
            storage.set('bitpayAccounts-v2-' + network, JSON.stringify(data), function(err) {
              if (err) return cb(err);
              // Ensure next step for cards is visible
              storage.get('bitpayAccounts-v2-' + network, function(err, data) {
                if (err) return cb(err);
                if (lodash.isEmpty(data)) {
                  root.removeNextStep('BitpayCard', function(err) {});
                }
              });
              cb(null, 'removed invalid account records, please re-pair cards for these accounts:' + removed + '; ' +
                'the following accounts validated OK: ' + (verified.length > 0 ? verified : 'none'));
            });
          } else {
            cb(null, (verified.length > 0 ? 'accounts OK: ' + verified : ''));
          }
        });
      });
    };
    //
    ////////////////////////////////////////////////////////////////////////////
    //
    // UPGRADER DEPENDENCIES
    // These functions remain as long as the upgrader remains in effect.
    //
    var _00_setBitpayDebitCards = function(network, data, cb) {
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (lodash.isEmpty(data) || !data.email) return cb('No card(s) to set');
      storage.get('bitpayAccounts-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        bitpayAccounts[data.email] = bitpayAccounts[data.email] || {};
        bitpayAccounts[data.email]['bitpayDebitCards-' + network] = data;
        storage.set('bitpayAccounts-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };

    var _01_setAppIdentity = function(network, data, cb) {
      storage.set('appIdentity-' + network, data, cb);
    };

    var _02_setBitpayAccount = function(network, data, cb) {
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (lodash.isEmpty(data) || !data.email || !data.acct) return cb('No account to set');
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        bitpayAccounts[data.email] = data.acct;
        bitpayAccounts[data.email]['bitpayApi-' + network] = {};
        bitpayAccounts[data.email]['bitpayApi-' + network].token = data.token;
        storage.set('bitpayAccounts-v2-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };

    var _02_setBitpayDebitCards = function(network, data, cb) {
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (lodash.isEmpty(data) || !data.email) return cb('Cannot set cards: no account to set');
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        bitpayAccounts[data.email] = bitpayAccounts[data.email] || {};
        bitpayAccounts[data.email]['bitpayDebitCards-' + network] = data.cards;
        storage.set('bitpayAccounts-v2-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };
    //
    ////////////////////////////////////////////////////////////////////////////

    // IMPORTANT: This function is designed to block execution until it completes.
    // Ideally storage should not be used until it has been verified.
    root.verify = function(cb) {
      _upgrade(function(err) {
        cb(err);
      });
    };

    function _handleUpgradeError(key, err) {
      $log.error('Failed to upgrade storage for \'' + key + '\': ' + err);
    };

    function _handleUpgradeSuccess(key, msg) {
      $log.info('Storage upgraded for \'' + key + '\': ' + msg);
    };

    // IMPORTANT: This function is designed to block execution until it completes.
    // Ideally storage should not be used until it has been verified.
    function _upgrade(cb) {
      var errorCount = 0;
      var errorMessage = undefined;
      var keys = Object.keys(_upgraders).sort();
      var networks = ['livenet', 'testnet'];
      _asyncEach(keys, function(key, callback) {
        networks.forEach(function(network) {
          var storagekey = key.split('_')[1];
          _upgraders[key](storagekey, network, function(err, msg) {
            if (err) {
              _handleUpgradeError(storagekey + '-' + network, err);
              errorCount++;
              errorMessage = errorCount + ' storage upgrade failures';
            }
            if (msg) _handleUpgradeSuccess(storagekey + '-' + network, msg);
            callback();
          });
        });
      }, function() {
        //done
        cb(errorMessage);
      });
    };

    function _asyncEach(iterableList, callback, done) {
      var i = -1;
      var length = iterableList.length;

      function loop() {
        i++;
        if (i === length) {
          done(); 
          return;
        } else if (i < length) {
          callback(iterableList[i], loop);
        } else {
          return;
        }
      } 
      loop();
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

    root.setFeedbackInfo = function(feedbackValues, cb) {
      storage.set('feedback', feedbackValues, cb);
    };

    root.getFeedbackInfo = function(cb) {
      storage.get('feedback', cb);
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

    root.getHomeTipAccepted = function(cb) {
      storage.get('homeTip', cb);
    };

    root.setHomeTipAccepted = function(val, cb) {
      storage.set('homeTip', val, cb);
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

    root.setNextStep = function(service, status, cb) {
      storage.set('nextStep-' + service, status, cb);
    };

    root.getNextStep = function(service, cb) {
      storage.get('nextStep-' + service, cb);
    };

    root.removeNextStep = function(service, cb) {
      storage.remove('nextStep-' + service, cb);
    };

    root.setLastCurrencyUsed = function(lastCurrencyUsed, cb) {
      storage.set('lastCurrencyUsed', lastCurrencyUsed, cb)
    };

    root.getLastCurrencyUsed = function(cb) {
      storage.get('lastCurrencyUsed', cb)
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

    root.setBitpayDebitCardsHistory = function(network, data, cb) {
      storage.set('bitpayDebitCardsHistory-' + network, data, cb);
    };

    root.getBitpayDebitCardsHistory = function(network, cb) {
      storage.get('bitpayDebitCardsHistory-' + network, cb);
    };

    root.removeBitpayDebitCardHistory = function(network, card, cb) {
      root.getBitpayDebitCardsHistory(network, function(err, data) {
        if (err) return cb(err);
        if (lodash.isString(data)) {
          data = JSON.parse(data);
        }
        data = data || {};
        delete data[card.eid];
        root.setBitpayDebitCardsHistory(network, JSON.stringify(data), cb);
      });
    };

    // data: {
    //   cards: [
    //     eid: card id
    //     id: card id
    //     lastFourDigits: card number
    //     token: card token
    //   ]
    //   email: account email
    //   token: account token
    // }
    root.setBitpayDebitCards = function(network, data, cb) {
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (lodash.isEmpty(data) || !data.email) return cb('Cannot set cards: no account to set');
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        bitpayAccounts[data.email] = bitpayAccounts[data.email] || {};
        bitpayAccounts[data.email]['bitpayDebitCards-' + network] = data.cards;
        storage.set('bitpayAccounts-v2-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };

    // cb(err, cards)
    // cards: [
    //   eid: card id
    //   id: card id
    //   lastFourDigits: card number
    //   token: card token
    //   email: account email
    // ]
    root.getBitpayDebitCards = function(network, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        var cards = [];
        Object.keys(bitpayAccounts).forEach(function(email) {
          // For the UI, add the account email to the card object.
          var acctCards = bitpayAccounts[email]['bitpayDebitCards-' + network] || [];
          for (var i = 0; i < acctCards.length; i++) {
            acctCards[i].email = email;
          }
          cards = cards.concat(acctCards);
        });
        cb(err, cards);
      });
    };

    // card: {
    //   eid: card id
    //   id: card id
    //   lastFourDigits: card number
    //   token: card token
    // }
    root.removeBitpayDebitCard = function(network, card, cb) {
      if (lodash.isString(card)) {
        card = JSON.parse(card);
      }
      card = card || {};
      if (lodash.isEmpty(card) || !card.eid) return cb('No card to remove');
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        Object.keys(bitpayAccounts).forEach(function(email) {
          var data = bitpayAccounts[email]['bitpayDebitCards-' + network];
          var newCards = lodash.reject(data, {
            'eid': card.eid
          });
          data = {};
          data.cards = newCards;
          data.email = email;
          root.setBitpayDebitCards(network, data, function(err) {
            if (err) cb(err);
            // If there are no more cards in storage then re-enable the next step entry.
            root.getBitpayDebitCards(network, function(err, cards) {
              if (err) cb(err);
              if (cards.length == 0) {
                root.removeNextStep('BitpayCard', cb);
              } else {
                cb();
              }
            });
          });
        });
      });
    };

    // data: {
    //   email: account email
    //   token: account token
    // }
    root.setBitpayAccount = function(network, data, cb) {
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      if (lodash.isEmpty(data) || !data.email) return cb('No account to set');
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        bitpayAccounts[data.email] = bitpayAccounts[data.email] || {};
        bitpayAccounts[data.email]['bitpayApi-' + network] = bitpayAccounts[data.email]['bitpayApi-' + network] || {};
        bitpayAccounts[data.email]['bitpayApi-' + network].token = data.token;
        storage.set('bitpayAccounts-v2-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };

    // cb(err, accounts)
    // accounts: {
    //   email_1: {
    //     bitpayApi-<network>: {
    //       token: account token
    //     }
    //     bitpayDebitCards-<network>: {
    //       <card-data>
    //     }
    //   }
    //   ...
    //   email_n: {
    //     bitpayApi-<network>: {
    //       token: account token
    //     }
    //     bitpayDebitCards-<network>: {
    //       <card-data>
    //     }
    //   }
    // }
    root.getBitpayAccounts = function(network, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        cb(err, bitpayAccounts);
      });
    };

    root.setAppIdentity = function(network, data, cb) {
      storage.set('appIdentity-' + network, data, cb);
    };

    root.getAppIdentity = function(network, cb) {
      storage.get('appIdentity-' + network, function(err, data) {
        if (err) return cb(err);
        if (lodash.isString(data)) {
          data = JSON.parse(data);
        }
        cb(err, data);
      });
    };

    root.removeAppIdentity = function(network, cb) {
      storage.remove('appIdentity-' + network, cb);
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
