import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { PlatformInfo } from './platform-info.service';
import { Profile } from './../models/profile.model';

@Injectable()
export class StorageService {
  win: any = this.win;

  // getConfig(cb) {
  //
  // }
  //
  // storeConfig(config, cb) {
  //
  // }
  //
  // removeConfig(cb) {
  //
  // }
  //
  // setBackupFlag(walletId, cb) {}
  //
  // getBackupFlag(walletId, cb) {}
  //
  // getHideBalanceFlag(walletId, cb) {}
  //
  // getProfile(cb) {}
  //
  // storeProfile(profile, cb) {}
  //
  // storeNewProfile(profile, cb) {}
  //
  // clearLastAddress(walletId, cb){}
  //
  // removeAllWalletData(walletId, cb) {}
  //
  // getAddressbook(network, cb) {}
  //
  // setAddressbook(network, addressBook, cb) {}
  //
  // setHideBalanceFlag(walletId, balanceHidden, cb) {}
  //
  // getCopayDisclaimerFlag(cb) {}
  //
  // tryToMigrate(cb) {}

  // File storage is not supported for writing according to
  // https://github.com/apache/cordova-plugin-file/#supported-platforms
  shouldUseFileStorage: boolean = false;
  storage: any;

  constructor(
    public logger: Logger,
    public platformInfo: PlatformInfo
  ) {
    this.shouldUseFileStorage = this.platformInfo.isCordova && !this.platformInfo.isWP;
    this.logger.debug('Using file storage:', shouldUseFileStorage);
    this.storage = this.shouldUseFileStorage ? fileStorageService : localStorageService;
  }

  getUUID(cb) {
    // TO SIMULATE MOBILE
    //return cb('hola');
    if (!this.win || !this.win.plugins || !this.win.plugins.uniqueDeviceID)
      return cb(null);

    this.win.plugins.uniqueDeviceID.get(
      function(uuid) {
        return cb(uuid);
      }, cb);
  }

  decryptOnMobile(text, cb) {
    var json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      this.logger.warn('Could not open profile:' + text);

      var i = text.lastIndexOf('}{');
      if (i > 0) {
        text = text.substr(i + 1);
        this.logger.warn('trying last part only:' + text);
        try {
          json = JSON.parse(text);
          this.logger.warn('Worked... saving.');
          this.storage.set('profile', text, function() {});
        } catch (e) {
          this.logger.warn('Could not open profile (2nd try):' + e);
        };
      };

    };

    if (!json) return cb('Could not access storage')

    if (!json.iter || !json.ct) {
      this.logger.debug('Profile is not encrypted');
      return cb(null, text);
    }

    this.logger.debug('Profile is encrypted');
    this.getUUID(function(uuid) {
      this.logger.debug('Device UUID:' + uuid);
      if (!uuid)
        return cb('Could not decrypt storage: could not get device ID');

      try {
        text = this.sjcl.decrypt(uuid, text);

        this.logger.info('Migrating to unencrypted profile');
        return this.storage.set('profile', text, function(err) {
          return cb(err, text);
        });
      } catch (e) {
        this.logger.warn('Decrypt error: ', e);
        return cb('Could not decrypt storage: device ID mismatch');
      };
      return cb(null, text);
    });
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // UPGRADING STORAGE
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
  // Upgraders are executed in numerical order per the '##_' object key prefix.
  //
  _upgraders: any = {
    '00_bitpayDebitCards' : this._upgrade_bitpayDebitCards  // 2016-11: Upgrade bitpayDebitCards-x to bitpayAccounts-x
  }

  _upgrade_bitpayDebitCards(key, network, cb) {
    key += '-' + network;
    this.storage.get(key, (err, data) => {
      if (err) return cb(err);
      if (data != null) {
        // Needs upgrade
        if (lodash.isString(data)) {
          data = JSON.parse(data);
        }
        data = data || {};
        this.setBitpayDebitCards(network, data, (err) => {
          if (err) return cb(err);
          this.storage.remove(key, () => {
            cb(null, 'replaced with \'bitpayAccounts\'');
          });
        });
      } else {
        cb();
      }
    });
  }
  //
  ////////////////////////////////////////////////////////////////////////////

  // IMPORTANT: This function is designed to block execution until it completes.
  // Ideally storage should not be used until it has been verified.
  verify(cb) {
    this._upgrade(function(err) {
      cb(err);
    });
  }

  _handleUpgradeError(key, err) {
    this.logger.error('Failed to upgrade storage for \'' + key + '\': ' + err);
  }

  _handleUpgradeSuccess(key, msg) {
    this.logger.info('Storage upgraded for \'' + key + '\': ' + msg);
  }

  _upgrade(cb) {
    var errorCount = 0;
    var errorMessage = undefined;
    var keys = Object.keys(this._upgraders).sort();
    var networks = ['livenet', 'testnet'];
    keys.forEach(function(key) {
      networks.forEach(function(network) {
        var storagekey = key.split('_')[1];
        this._upgraders[key](storagekey, network, function(err, msg) {
          if (err) {
            this._handleUpgradeError(storagekey, err);
            errorCount++;
            errorMessage = errorCount + ' storage upgrade failures';
          }
          if (msg) this._handleUpgradeSuccess(storagekey, msg);
        });
      });
    });
    cb(errorMessage);
  }

  tryToMigrate(cb) {
    if (!this.shouldUseFileStorage) return cb();

    this.localStorageService.get('profile', function(err, str) {
      if (err) return cb(err);
      if (!str) return cb();

      this.logger.info('Starting Migration profile to File this.storage...');

      this.fileStorageService.create('profile', str, function(err) {
        if (err) cb(err);
        this.logger.info('Profile Migrated successfully');

        this.localStorageService.get('config', function(err, c) {
          if (err) return cb(err);
          if (!c) return this.getProfile(cb);

          this.fileStorageService.create('config', c, function(err) {

            if (err) {
              this.logger.info('Error migrating config: ignoring', err);
              return this.getProfile(cb);
            }
            this.logger.info('Config Migrated successfully');
            return this.getProfile(cb);
          });
        });
      });
    });
  };

  storeNewProfile(profile, cb) {
    this.storage.create('profile', profile.toObj(), cb);
  };

  storeProfile(profile, cb) {
    this.storage.set('profile', profile.toObj(), cb);
  };

  getProfile(cb) {
    this.storage.get('profile', function(err, str) {
      if (err || !str)
        return cb(err);

      this.decryptOnMobile(str, function(err, str) {
        if (err) return cb(err);
        var p, err;
        try {
          p = Profile.fromString(str);
        } catch (e) {
          this.logger.debug('Could not read profile:', e);
          err = new Error('Could not read profile:' + p);
        }
        return cb(err, p);
      });
    });
  };

  deleteProfile(cb) {
    this.storage.remove('profile', cb);
  };

  setFeedbackInfo(feedbackValues, cb) {
    this.storage.set('feedback', feedbackValues, cb);
  };

  getFeedbackInfo(cb) {
    this.storage.get('feedback', cb);
  };

  storeFocusedWalletId(id, cb) {
    this.storage.set('focusedWalletId', id || '', cb);
  };

  getFocusedWalletId(cb) {
    this.storage.get('focusedWalletId', cb);
  };

  getLastAddress(walletId, cb) {
    this.storage.get('lastAddress-' + walletId, cb);
  };

  storeLastAddress(walletId, address, cb) {
    this.storage.set('lastAddress-' + walletId, address, cb);
  };

  clearLastAddress(walletId, cb) {
    this.storage.remove('lastAddress-' + walletId, cb);
  };

  setBackupFlag(walletId, cb) {
    this.storage.set('backup-' + walletId, Date.now(), cb);
  };

  getBackupFlag(walletId, cb) {
    this.storage.get('backup-' + walletId, cb);
  };

  clearBackupFlag(walletId, cb) {
    this.storage.remove('backup-' + walletId, cb);
  };

  setCleanAndScanAddresses(walletId, cb) {
    this.storage.set('CleanAndScanAddresses', walletId, cb);
  };

  getCleanAndScanAddresses(cb) {
    this.storage.get('CleanAndScanAddresses', cb);
  };

  removeCleanAndScanAddresses(cb) {
    this.storage.remove('CleanAndScanAddresses', cb);
  };

  getConfig(cb) {
    this.storage.get('config', cb);
  };

  storeConfig(val, cb) {
    this.logger.debug('Storing Preferences', val);
    this.storage.set('config', val, cb);
  };

  clearConfig(cb) {
    this.storage.remove('config', cb);
  };

  getHomeTipAccepted(cb) {
    this.storage.get('homeTip', cb);
  };

  setHomeTipAccepted(val, cb) {
    this.storage.set('homeTip', val, cb);
  };

  setHideBalanceFlag(walletId, val, cb) {
    this.storage.set('hideBalance-' + walletId, val, cb);
  };

  getHideBalanceFlag(walletId, cb) {
    this.storage.get('hideBalance-' + walletId, cb);
  };

  //for compatibility
  getCopayDisclaimerFlag(cb) {
    this.storage.get('agreeDisclaimer', cb);
  };

  setRemotePrefsStoredFlag(cb) {
    this.storage.set('remotePrefStored', true, cb);
  };

  getRemotePrefsStoredFlag(cb) {
    this.storage.get('remotePrefStored', cb);
  };

  setGlideraToken(network, token, cb) {
    this.storage.set('glideraToken-' + network, token, cb);
  };

  getGlideraToken(network, cb) {
    this.storage.get('glideraToken-' + network, cb);
  };

  removeGlideraToken(network, cb) {
    this.storage.remove('glideraToken-' + network, cb);
  };

  setCoinbaseRefreshToken(network, token, cb) {
    this.storage.set('coinbaseRefreshToken-' + network, token, cb);
  };

  getCoinbaseRefreshToken(network, cb) {
    this.storage.get('coinbaseRefreshToken-' + network, cb);
  };

  removeCoinbaseRefreshToken(network, cb) {
    this.storage.remove('coinbaseRefreshToken-' + network, cb);
  };

  setCoinbaseToken(network, token, cb) {
    this.storage.set('coinbaseToken-' + network, token, cb);
  };

  getCoinbaseToken(network, cb) {
    this.storage.get('coinbaseToken-' + network, cb);
  };

  removeCoinbaseToken(network, cb) {
    this.storage.remove('coinbaseToken-' + network, cb);
  };

  setAddressbook(network, addressbook, cb) {
    this.storage.set('addressbook-' + network, addressbook, cb);
  };

  getAddressbook(network, cb) {
    this.storage.get('addressbook-' + network, cb);
  };

  removeAddressbook(network, cb) {
    this.storage.remove('addressbook-' + network, cb);
  };

  setNextStep(service, status, cb) {
    this.storage.set('nextStep-' + service, status, cb);
  };

  getNextStep(service, cb) {
    this.storage.get('nextStep-' + service, cb);
  };

  removeNextStep(service, cb) {
    this.storage.remove('nextStep-' + service, cb);
  };

  checkQuota() {
    var block = '';
    // 50MB
    for (var i = 0; i < 1024 * 1024; ++i) {
      block += '12345678901234567890123456789012345678901234567890';
    }
    this.storage.set('test', block, function(err) {
      this.logger.error('CheckQuota Return:' + err);
    });
  };

  setTxHistory(txs, walletId, cb) {
    try {
      this.storage.set('txsHistory-' + walletId, txs, cb);
    } catch (e) {
      this.logger.error('Error saving tx History. Size:' + txs.length);
      this.logger.error(e);
      return cb(e);
    }
  }

  getTxHistory(walletId, cb) {
    this.storage.get('txsHistory-' + walletId, cb);
  }

  removeTxHistory(walletId, cb) {
    this.storage.remove('txsHistory-' + walletId, cb);
  }

  setCoinbaseTxs(network, ctx, cb) {
    this.storage.set('coinbaseTxs-' + network, ctx, cb);
  };

  getCoinbaseTxs(network, cb) {
    this.storage.get('coinbaseTxs-' + network, cb);
  };

  removeCoinbaseTxs(network, cb) {
    this.storage.remove('coinbaseTxs-' + network, cb);
  };

  setBitpayDebitCardsHistory(network, data, cb) {
    this.storage.set('bitpayDebitCardsHistory-' + network, data, cb);
  };

  getBitpayDebitCardsHistory(network, cb) {
    this.storage.get('bitpayDebitCardsHistory-' + network, cb);
  };

  removeBitpayDebitCardHistory(network, card, cb) {
    this.getBitpayDebitCardsHistory(network, function(err, data) {
      if (err) return cb(err);
      if (lodash.isString(data)) {
        data = JSON.parse(data);
      }
      data = data || {};
      delete data[card.eid];
      this.setBitpayDebitCardsHistory(network, JSON.stringify(data), cb);
    });
  };

  setBitpayDebitCards(network, data, cb) {
    if (lodash.isString(data)) {
      data = JSON.parse(data);
    }
    data = data || {};
    if (lodash.isEmpty(data) || !data.email) return cb('No card(s) to set');
    this.storage.get('bitpayAccounts-' + network, function(err, bitpayAccounts) {
      if (err) return cb(err);
      if (lodash.isString(bitpayAccounts)) {
        bitpayAccounts = JSON.parse(bitpayAccounts);
      }
      bitpayAccounts = bitpayAccounts || {};
      bitpayAccounts[data.email] = bitpayAccounts[data.email] || {};
      bitpayAccounts[data.email]['bitpayDebitCards-' + network] = data;
      this.storage.set('bitpayAccounts-' + network, JSON.stringify(bitpayAccounts), cb);
    });
  };

  getBitpayDebitCards(network, cb) {
    this.storage.get('bitpayAccounts-' + network, function(err, bitpayAccounts) {
      if (lodash.isString(bitpayAccounts)) {
        bitpayAccounts = JSON.parse(bitpayAccounts);
      }
      bitpayAccounts = bitpayAccounts || {};
      var cards = [];
      Object.keys(bitpayAccounts).forEach(function(email) {
        // For the UI, add the account email to the card object.
        var acctCards = bitpayAccounts[email]['bitpayDebitCards-' + network].cards;
        for (var i = 0; i < acctCards.length; i++) {
          acctCards[i].email = email;
        }
        cards = cards.concat(acctCards);
      });
      cb(err, cards);
    });
  };

  removeBitpayDebitCard(network, card, cb) {
    if (lodash.isString(card)) {
      card = JSON.parse(card);
    }
    card = card || {};
    if (lodash.isEmpty(card) || !card.eid) return cb('No card to remove');
    this.storage.get('bitpayAccounts-' + network, function(err, bitpayAccounts) {
      if (err) cb(err);
      if (lodash.isString(bitpayAccounts)) {
        bitpayAccounts = JSON.parse(bitpayAccounts);
      }
      bitpayAccounts = bitpayAccounts || {};
      Object.keys(bitpayAccounts).forEach(function(userId) {
        var data = bitpayAccounts[userId]['bitpayDebitCards-' + network];
        var newCards = lodash.reject(data.cards, {'eid': card.eid});
        data.cards = newCards;
        this.setBitpayDebitCards(network, data, function(err) {
          if (err) cb(err);
          // If there are no more cards in storage then re-enable the next step entry.
          this.getBitpayDebitCards(network, function(err, cards){
            if (err) cb(err);
            if (cards.length == 0) {
              this.removeNextStep('BitpayCard', cb);
            } else {
              cb();
            }
          });
        });
      });
    });
  };

  setBitpayCardCredentials(network, data, cb) {
    this.storage.set('bitpayCardCredentials-' + network, data, cb);
  };

  getBitpayCardCredentials(network, cb) {
    this.storage.get('bitpayCardCredentials-' + network, cb);
  };

  removeBitpayCardCredentials(network, cb) {
    this.storage.remove('bitpayCardCredentials-' + network, cb);
  };

  removeAllWalletData(walletId, cb) {
    this.clearLastAddress(walletId, function(err) {
      if (err) return cb(err);
      this.removeTxHistory(walletId, function(err) {
        if (err) return cb(err);
        this.clearBackupFlag(walletId, function(err) {
          return cb(err);
        });
      });
    });
  };

  setAmazonGiftCards(network, gcs, cb) {
    this.storage.set('amazonGiftCards-' + network, gcs, cb);
  };

  getAmazonGiftCards(network, cb) {
    this.storage.get('amazonGiftCards-' + network, cb);
  };

  removeAmazonGiftCards(network, cb) {
    this.storage.remove('amazonGiftCards-' + network, cb);
  };

}
