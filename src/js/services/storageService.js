'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, platformInfo, $timeout) {

    var root = {};
    var storage;

    // File storage is not supported for writing according to
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = platformInfo.isCordova && !platformInfo.isWP;

    if (shouldUseFileStorage) {
      $log.debug('Using: FileStorage');
      storage = fileStorageService;
    } else {
      $log.debug('Using: LocalStorage');
      storage = localStorageService;
    }

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

    // This is only used in Copay, we used to encrypt profile
    // using device's UUID.

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

    // This is only use in Copay, for very old instalations
    // in which we use to use localStorage instead of fileStorage
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

    root.setGlideraPermissions = function(network, p, cb) {
      storage.set('glideraPermissions-' + network, p, cb);
    };

    root.getGlideraPermissions = function(network, cb) {
      storage.get('glideraPermissions-' + network, cb);
    };

    root.removeGlideraPermissions = function(network, cb) {
      storage.remove('glideraPermissions-' + network, cb);
    };

    root.setGlideraStatus = function(network, status, cb) {
      storage.set('glideraStatus-' + network, status, cb);
    };

    root.getGlideraStatus = function(network, cb) {
      storage.get('glideraStatus-' + network, cb);
    };

    root.removeGlideraStatus = function(network, cb) {
      storage.remove('glideraStatus-' + network, cb);
    };

    root.setGlideraTxs = function(network, txs, cb) {
      storage.set('glideraTxs-' + network, txs, cb);
    };

    root.getGlideraTxs = function(network, cb) {
      storage.get('glideraTxs-' + network, cb);
    };

    root.removeGlideraTxs = function(network, cb) {
      storage.remove('glideraTxs-' + network, cb);
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

    root.setBalanceCache = function(cardId, data, cb) {
      storage.set('balanceCache-' + cardId, data, cb);
    };

    root.getBalanceCache = function(cardId, cb) {
      storage.get('balanceCache-' + cardId, cb);
    };

    root.removeBalanceCache = function(cardId, cb) {
      storage.remove('balanceCache-' + cardId, cb);
    };

    // cards: [
    //   eid: card id
    //   id: card id
    //   lastFourDigits: card number
    //   token: card token
    // ]
    root.setBitpayDebitCards = function(network, email, cards, cb) {
      root.getBitpayAccounts(network, function(err, allAccounts) {
        if (err) return cb(err);

        if (!allAccounts[email]) {
          return cb('Cannot set cards for unknown account ' + email);
        }

        allAccounts[email].cards = cards;
        storage.set('bitpayAccounts-v2-' + network, allAccounts, cb);
      });
    };

    // cb(err, cards)
    // cards: [{
    //   token: card token
    //   email: account email
    //   eid: card id
    //   id: card id
    //   lastFourDigits: card number
    // }]
    root.getBitpayDebitCards = function(network, cb) {
      root.getBitpayAccounts(network, function(err, allAccounts) {
        if (err) return cb(err);

        var allCards = [];

        lodash.each(allAccounts, function(account, email) {

          if (account.cards) {
            // Add account's email to each card
            var cards = lodash.clone(account.cards);
            lodash.each(cards, function(x) {
              x.email = email;
            });

            allCards = allCards.concat(cards);
          }
        });

        return cb(null, allCards);
      });
    };

    root.removeBitpayDebitCard = function(network, cardEid, cb) {
      root.getBitpayAccounts(network, function(err, allAccounts) {

        lodash.each(allAccounts, function(account) {
          account.cards = lodash.reject(account.cards, {
            'eid': cardEid
          });
        });

        storage.set('bitpayAccounts-v2-' + network, allAccounts, cb);
      });
    };

    root.setPayrollRecordsOnAccount = function(network, email, records, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) return cb(err);
        if (lodash.isString(bitpayAccounts) && bitpayAccounts.length > 0) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        bitpayAccounts[email] = bitpayAccounts[email] || {};
        bitpayAccounts[email]['payrollRecords'] = records;
        storage.set('bitpayAccounts-v2-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };

    root.getPayrollRecords = function(network, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (lodash.isString(bitpayAccounts) && bitpayAccounts.length > 0) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        var records = [];
        Object.keys(bitpayAccounts).forEach(function(email) {
          // For the UI, add the account email to the record object.
          var acctRecords = bitpayAccounts[email]['payrollRecords'] || [];
          for (var i = 0; i < acctRecords.length; i++) {
            acctRecords[i].email = email;
          }
          records = records.concat(acctRecords);
        });
        cb(err, records);
      });
    };

    root.updatePayrollRecord = function(network, record, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) cb(err);
        if (lodash.isString(bitpayAccounts) && bitpayAccounts.length > 0) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        asyncEach(Object.keys(bitpayAccounts), function(email, callback) {
          var data = bitpayAccounts[email]['payrollRecords'];
          // Remove the existing record and replace it.
          var newRecords = lodash.reject(data, {
            'eid': record.eid
          });
          newRecords.push(record);
          root.setPayrollRecordsOnAccount(network, email, newRecords, function(err) {
            if (err) return cb(err);
            callback();
          });
        }, function() {
          // done
          cb();
        });
      });
    };

    root.removePayrollRecord = function(network, id, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) cb(err);
        if (lodash.isString(bitpayAccounts) && bitpayAccounts.length > 0) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        asyncEach(Object.keys(bitpayAccounts), function(email, callback) {
          var data = bitpayAccounts[email]['payrollRecords'];
          var newRecords = lodash.reject(data, {
            'eid': id
          });
          root.setPayrollRecordsOnAccount(network, email, newRecords, function(err) {
            if (err) return cb(err);
            callback();
          });
        }, function() {
          // done
          cb();
        });
      });
    };

    root.addPayrollEligibilityRecord = function(network, record, cb) {
      record = record || {};
      if (lodash.isEmpty(record)) return cb('Cannot add payroll eligibility record: no record content');
      storage.get('payrollEligibility-' + network, function(err, records) {
        if (err) return cb(err);
        if (lodash.isString(records) && records.length > 0) {
          records = JSON.parse(records);
        }
        records = records || [];
        records.push(record);
        storage.set('payrollEligibility-' + network, JSON.stringify(records), cb);
      });
    };

    root.getPayrollEligibilityRecords = function(network, cb) {
      storage.get('payrollEligibility-' + network, function(err, records) {
        if (lodash.isString(records) && records.length > 0) {
          records = JSON.parse(records);
        }
        records = records || [];
        cb(err, records);
      });
    };

    root.updatePayrollEligibilityRecord = function(network, record, cb) {
      root.getPayrollEligibilityRecords(network, function(err, records) {
        if (err) {
          return cb(err);
        }
        var index = lodash.findIndex(records, function(r) {
          return r.id == record.id;
        });
        records[index] = record;
        storage.set('payrollEligibility-' + network, JSON.stringify(records), cb);
      });
    };

    root.removePayrollEligibilityRecord = function(network, id, cb) {
      storage.get('payrollEligibility-' + network, function(err, records) {
        if (err) cb(err);
        if (lodash.isString(records) && records.length > 0) {
          records = JSON.parse(records);
        }
        records = records || [];
        records = lodash.reject(records, function(r) {
          return r.id == id;
        });
        storage.set('payrollEligibility-' + network, JSON.stringify(records), cb);
      });
    };

    root.setPayrollTransactions = function(network, data, cb) {
      storage.set('payrollTransactions-' + network, JSON.stringify(data), cb);
    };

    root.getPayrollTransactions = function(network, cb) {
      storage.get('payrollTransactions-' + network, cb);
    };

    root.removePayrollTransactions = function(network, id, cb) {
      root.getPayrollTransactions(network, function(err, data) {
        if (err) return cb(err);
        if (lodash.isString(data) && data.length > 0) {
          data = JSON.parse(data);
        }
        data = data || {};
        delete data[id];
        root.setPayrollTransactions(network, JSON.stringify(data), cb);
      });
    };

    // cb(err, accounts)
    // accounts: {
    //   email_1: {
    //     token: account token
    //     cards: {
    //       <card-data>
    //     }
    //   }
    //   ...
    //   email_n: {
    //    token: account token
    //    cards: {
    //       <card-data>
    //     }
    //   }
    // }
    //
    root.getBitpayAccounts = function(network, cb) {
      storage.get('bitpayAccounts-v2-' + network, function(err, allAccountsStr) {
        if (err) return cb(err);

        if (!allAccountsStr)
          return cb(null, {});

        var allAccounts = {};
        try {
          allAccounts = JSON.parse(allAccountsStr);
        } catch (e) {
          $log.error('Bad storage value for bitpayAccount-v2' + allAccountsStr)
          return cb(null, {});
        };

        var anyMigration;

        lodash.each(allAccounts, function(account, email) {

          // Migrate old `'bitpayApi-' + network` key, if exists
          if (!account.token && account['bitpayApi-' + network] && account['bitpayApi-' + network].token) {

            $log.info('Migrating all bitpayApi-network branch');
            account.token = account['bitpayApi-' + network].token;
            account.cards = lodash.clone(account['bitpayApi-' + network].cards);
            if (!account.cards) {
              account.cards = lodash.clone(account['bitpayDebitCards-' + network]);
            }

            delete account['bitpayDebitCards-' + network];
            delete account['bitpayApi-' + network];
            anyMigration = true;

          }
        });

        if (anyMigration) {
          storage.set('bitpayAccounts-v2-' + network, allAccounts, function() {
            return cb(err, allAccounts);
          });
        } else
          return cb(err, allAccounts);

      });
    };

    // data: {
    //   email: account email
    //   token: account token
    //   facade: facade associated with token
    //   familyName: account family (last) name
    //   givenName: account given (first) name
    // }
    root.setBitpayAccount = function(network, data, cb) {
      if (!lodash.isObject(data) || !data.email || !data.token)
        return cb('No account to set');

      root.getBitpayAccounts(network, function(err, allAccounts) {
        if (err) return cb(err);

        allAccounts = allAccounts || {};
        var account = allAccounts[data.email] || {};
        account.tokens = account.tokens || [];
        //////
        // Migration
        // account.token replaced with account.tokens[]
        if (account.token && account.token.length > 0 && account.tokens.length == 0) {
          $log.info('Migrating account token');
          account.tokens.push({
            token: account.token,
            facade: 'visaUser' // All legacy tokens are for visaUser
          });
          delete account.token;
          $log.info('Successfully migrated account token');
        }
        //////
        // Remove old token for the specified facade.
        lodash.remove(account.tokens, function(t) {
          return t.facade == data.facade;
        });
        // Add new token for the specified facade.
        account.tokens.push({
          token: data.token,
          facade: data.facade
        });

        account.familyName = data.familyName;
        account.givenName = data.givenName;

        allAccounts[data.email] = account;

        $log.info('Storing BitPay accounts with new account:' + data.email);
        storage.set('bitpayAccounts-v2-' + network, allAccounts, cb);
      });
    };

    // account: {
    //   email: account email
    //   apiContext: the context needed for making future api calls
    //   cards: an array of cards
    // }
    root.removeBitpayAccount = function(network, account, cb) {
      if (lodash.isString(account)) {
        account = JSON.parse(account);
      }
      account = account || {};
      if (lodash.isEmpty(account)) return cb('No account to remove');
      storage.get('bitpayAccounts-v2-' + network, function(err, bitpayAccounts) {
        if (err) cb(err);
        if (lodash.isString(bitpayAccounts)) {
          bitpayAccounts = JSON.parse(bitpayAccounts);
        }
        bitpayAccounts = bitpayAccounts || {};
        delete bitpayAccounts[account.email];
        storage.set('bitpayAccounts-v2-' + network, JSON.stringify(bitpayAccounts), cb);
      });
    };

    root.setAppIdentity = function(network, data, cb) {
      storage.set('appIdentity-' + network, data, cb);
    };

    root.getAppIdentity = function(network, cb) {
      storage.get('appIdentity-' + network, function(err, data) {
        if (err) return cb(err);
        cb(err, JSON.parse(data || '{}'));
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

    var asyncEach = function(iterableList, callback, done) {
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

    return root;
  });
