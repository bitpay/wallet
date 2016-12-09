import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { BwcErrorService } from './bwc-error.service';
import { BwcService } from './bwc.service';
import { ConfigService } from './config.service';
import { PlatformInfo } from './platform-info.service';
import { StorageService } from './storage.service';

import { Profile } from './../models/profile.model';

@Injectable()
export class ProfileService {

  isChromeApp: boolean = false;
  isCordova: boolean = false;
  isWP: boolean = false;
  isIOS: boolean = false;

  isBound: boolean = false;

  errors: any;

  usePushNotifications: boolean = false;

  UPDATE_PERIOD = 15;

  profile = null;

  sjcl: any;

  // Object.defineProperty(root, "focusedClient", {
  //   get: function() {
  //     throw "focusedClient is not used any more"
  //   },
  //   set: function() {
  //     throw "focusedClient is not used any more"
  //   }
  // });

  wallet = {}; // decorated version of client

  validationLock: boolean = false;
  _queue = [];

  pushNotificationsService: any = {
    init: () => {}
  }

  gettext: any = () => {};

  gettextCatalog: any = () => {};

  uxLanguage: any = {
    getCurrentLanguage: () => {}
  };

  txFormatService: any = {
    formatAmountStr: () => {}
  };

  constructor(
    public bwcError: BwcErrorService,
    public bwcService: BwcService,
    public configService: ConfigService,
    public logger: Logger,
    public platformInfo: PlatformInfo,
    public storageService: StorageService
  ) {
    this.isChromeApp = this.platformInfo.isChromeApp;
    this.isCordova = this.platformInfo.isCordova;
    this.isWP = this.platformInfo.isWP;
    this.isIOS = this.platformInfo.isIOS;
    this.errors = this.bwcService.getErrors();
    this.usePushNotifications = this.isCordova && !this.isWP;
    this.sjcl = this.bwcService.getSJCL();
  }

  updateWalletSettings(wallet) {
    let defaults = this.configService.getDefaults();
    this.configService.whenAvailable((config) => {
      wallet.usingCustomBWS = config.bwsFor && config.bwsFor[wallet.id] && (config.bwsFor[wallet.id] != defaults.bws.url);
      wallet.name = (config.aliasFor && config.aliasFor[wallet.id]) || wallet.credentials.walletName;
      wallet.color = (config.colorFor && config.colorFor[wallet.id]) || '#4A90E2';
      wallet.email = config.emailFor && config.emailFor[wallet.id];
    });
  }

  setBackupFlag(walletId) {
    this.storageService.setBackupFlag(walletId, (err) => {
      if (err) this.logger.error(err);
      this.logger.debug('Backup flag stored');
      this.wallet[walletId].needsBackup = false;
    });
  };

  _requiresBackup(wallet) {
    if (wallet.isPrivKeyExternal()) return false;
    if (!wallet.credentials.mnemonic) return false;
    if (wallet.credentials.network == 'testnet') return false;

    return true;
  };

  _needsBackup(wallet, cb) {
    if (!this._requiresBackup(wallet))
      return cb(false);

    this.storageService.getBackupFlag(wallet.credentials.walletId, (err, val) => {
      if (err) this.logger.error(err);
      if (val) return cb(false);
      return cb(true);
    });
  };

  _balanceIsHidden(wallet, cb) {
    this.storageService.getHideBalanceFlag(wallet.credentials.walletId, (err, shouldHideBalance) => {
      if (err) this.logger.error(err);
      let hideBalance = (shouldHideBalance == 'true') ? true : false;
      return cb(hideBalance);
    });
  };
  // Adds a wallet client to profileService
  bindWalletClient(wallet, opts?) {
    opts = opts || {};
    let walletId = wallet.credentials.walletId;

    if ((this.wallet[walletId] && this.wallet[walletId].started) && !opts.force) {
      return false;
    }

    // INIT WALLET VIEWMODEL
    wallet.id = walletId;
    wallet.started = true;
    wallet.doNotVerifyPayPro = this.isChromeApp;
    wallet.network = wallet.credentials.network;
    wallet.copayerId = wallet.credentials.copayerId;
    wallet.m = wallet.credentials.m;
    wallet.n = wallet.credentials.n;

    this.updateWalletSettings(wallet);
    this.wallet[walletId] = wallet;

    this._needsBackup(wallet, (val) => {
      wallet.needsBackup = val;
    });

    this._balanceIsHidden(wallet, (val) => {
      wallet.balanceHidden = val;
    });

    wallet.removeAllListeners();

    wallet.on('report', (n) => {
      this.logger.info('BWC Report:' + n);
    });

    wallet.on('notification', (n) => {

      this.logger.debug('BWC Notification:', n);

      if (n.type == "NewBlock" && n.data.network == "testnet") {
        this.throttledBwsEvent(n, wallet);
      } else this.newBwsEvent(n, wallet);
    });

    wallet.on('walletCompleted', () => {
      this.logger.debug('Wallet completed');

      this.updateCredentials(JSON.parse(wallet.export()), () => {
        //$rootScope.$emit('Local/WalletCompleted', walletId);
      });
    });

    wallet.initialize({
      notificationIncludeOwn: true,
    }, (err) => {
      if (err) {
        this.logger.error('Could not init notifications err:', err);
        return;
      }
      wallet.setNotificationsInterval(this.UPDATE_PERIOD);
      wallet.openWallet((err) => {
        if (wallet.status !== true)
          this.logger.log('Wallet + ' + walletId + ' status:' + wallet.status)
      });
    });

    // $rootScope.$on('Local/SettingsUpdated', function(e, walletId) {
    //   if (!walletId || walletId == wallet.id) {
    //     this.logger.debug('Updating settings for wallet:' + wallet.id);
    //     this.updateWalletSettings(wallet);
    //   }
    // });

    return true;
  };

  // let throttledBwsEvent = lodash.throttle(function(n, wallet) {
  //   newBwsEvent(n, wallet);
  // }, 10000);
  throttledBwsEvent(n, wallet) {
    lodash.throttle((n, wallet) => {
      this.newBwsEvent(n, wallet);
    }, 10000);
  }

  newBwsEvent(n, wallet) {
    if (wallet.cachedStatus)
      wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory)
      wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity)
      wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps)
      wallet.cachedTxps.isValid = false;

    //$rootScope.$emit('bwsEvent', wallet.id, n.type, n);
  };

  runValidation(client, delay?, retryDelay?) {

    delay = delay || 500;
    retryDelay = retryDelay || 50;

    if (this.validationLock) {
      return setTimeout(() => {
        this.logger.debug('ValidatingWallet Locked: Retrying in: ' + retryDelay);
        return this.runValidation(client, delay, retryDelay);
      }, retryDelay);
    }
    this.validationLock = true;

    // IOS devices are already checked
    let skipDeviceValidation = this.isIOS || this.profile.isDeviceChecked(this.platformInfo.ua);
    let walletId = client.credentials.walletId;

    this.logger.debug('ValidatingWallet: ' + walletId + ' skip Device:' + skipDeviceValidation);
    setTimeout(() => {
      client.validateKeyDerivation({
        skipDeviceValidation: skipDeviceValidation,
      }, (err, isOK) => {
        this.validationLock = false;

        this.logger.debug('ValidatingWallet End:  ' + walletId + ' isOK:' + isOK);
        if (isOK) {
          this.profile.setChecked(this.platformInfo.ua, walletId);
        } else {
          this.logger.warn('Key Derivation failed for wallet:' + walletId);
          this.storageService.clearLastAddress(walletId, () => {});
        }

        this.storeProfileIfDirty();
      });
    }, delay);
  };

  // Used when reading wallets from the profile
  bindWallet(credentials, cb) {
    if (!credentials.walletId || !credentials.m)
      return cb('bindWallet should receive credentials JSON');

    // Create the client
    let getBWSURL = (walletId) => {
      let config = this.configService.getSync();
      let defaults = this.configService.getDefaults();
      return ((config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url);
    };


    let client = this.bwcService.getClient(JSON.stringify(credentials), {
      bwsurl: getBWSURL(credentials.walletId),
    });

    let skipKeyValidation = this.profile.isChecked(this.platformInfo.ua, credentials.walletId);
    if (!skipKeyValidation)
      this.runValidation(client, 500);

    this.logger.info('Binding wallet:' + credentials.walletId + ' Validating?:' + !skipKeyValidation);
    return cb(null, this.bindWalletClient(client));
  };

  bindProfile(profile, cb) {
    this.profile = profile;

    this.configService.get((err) => {
      this.logger.debug('Preferences read');
      if (err) return cb(err);

      let bindWallets = (cb) => {
        let l = this.profile.credentials.length;
        let i = 0,
          totalBound = 0;

        if (!l) return cb();

        lodash.each(this.profile.credentials, (credentials) => {
          this.bindWallet(credentials, (err, bound) => {
            i++;
            totalBound += bound;
            if (i == l) {
              this.logger.info('Bound ' + totalBound + ' out of ' + l + ' wallets');
              return cb();
            }
          });
        });
      }

      bindWallets(() => {
        this.isBound = true;

        lodash.each(this._queue, (x) => {
          setTimeout(() => {
            return x();
          }, 1);
        });
        this._queue = [];



        this.isDisclaimerAccepted((val) => {
          if (!val) {
            return cb(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
          }
          let config = this.configService.getSync();
          if (config.pushNotifications.enabled && this.usePushNotifications)
            this.pushNotificationsInit();
          return cb();
        });
      });
    });
  };

  whenAvailable(cb) {
    if (!this.isBound) {
      this._queue.push(cb);
      return;
    }
    return cb();
  };

  pushNotificationsInit() {
    //let defaults = this.configService.getDefaults();
    let push = this.pushNotificationsService.init(this.wallet);

    if (!push) return;

    push.on('notification', (data) => {
      if (!data.additionalData.foreground) {
        this.logger.debug('Push notification event: ', data.message);

        setTimeout(() => {
          let wallets = this.getWallets();
          let walletToFind = data.additionalData.walletId;

          let walletFound = lodash.find(wallets, (w) => {
            return (lodash.isEqual(walletToFind, this.sjcl.codec.hex.fromBits(this.sjcl.hash.sha256.hash(w.id))));
          });

          if (!walletFound) return this.logger.debug('Wallet not found');
        }, 100);
      }
    });

    push.on('error', (e) => {
      this.logger.warn('Error with push notifications:' + e.message);
    });

  };

  loadAndBindProfile(cb) {
    this.storageService.getProfile((err, profile) => {
      if (err) {
        //$rootScope.$emit('Local/DeviceError', err);
        return cb(err);
      }
      if (!profile) {
        // Migration??
        this.storageService.tryToMigrate((err, migratedProfile) => {
          if (err) return cb(err);
          if (!migratedProfile)
            return cb(new Error('NOPROFILE: No profile'));

          profile = migratedProfile;
          return this.bindProfile(profile, cb);
        })
      } else {
        this.logger.debug('Profile read');
        return this.bindProfile(profile, cb);
      }
    });
  };

  seedWallet(opts, cb) {
    opts = opts || {};
    let walletClient = this.bwcService.getClient(null, opts);
    let network = opts.networkName || 'livenet';

    if (opts.mnemonic) {
      try {
        opts.mnemonic = this._normalizeMnemonic(opts.mnemonic);
        walletClient.seedFromMnemonic(opts.mnemonic, {
          network: network,
          passphrase: opts.passphrase,
          account: opts.account || 0,
          derivationStrategy: opts.derivationStrategy || 'BIP44',
        });

      } catch (ex) {
        this.logger.info(ex);
        return cb(this.gettext('Could not create: Invalid wallet recovery phrase'));
      }
    } else if (opts.extendedPrivateKey) {
      try {
        walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey);
      } catch (ex) {
        this.logger.warn(ex);
        return cb(this.gettext('Could not create using the specified extended private key'));
      }
    } else if (opts.extendedPublicKey) {
      try {
        walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
          account: opts.account || 0,
          derivationStrategy: opts.derivationStrategy || 'BIP44',
        });
      } catch (ex) {
        this.logger.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
        return cb(this.gettext('Could not create using the specified extended public key'));
      }
    } else {
      let lang = this.uxLanguage.getCurrentLanguage();
      try {
        walletClient.seedFromRandomWithMnemonic({
          network: network,
          passphrase: opts.passphrase,
          language: lang,
          account: 0,
        });
      } catch (e) {
        this.logger.info('Error creating recovery phrase: ' + e.message);
        if (e.message.indexOf('language') > 0) {
          this.logger.info('Using default language for recovery phrase');
          walletClient.seedFromRandomWithMnemonic({
            network: network,
            passphrase: opts.passphrase,
            account: 0,
          });
        } else {
          return cb(e);
        }
      }
    }
    return cb(null, walletClient);
  };

  // Creates a wallet on BWC/BWS
  doCreateWallet(opts, cb) {
    this.logger.debug('Creating Wallet:', opts);
    setTimeout(() => {
      this.seedWallet(opts, (err, walletClient) => {
        if (err) return cb(err);

        let name = opts.name || this.gettextCatalog.getString('Personal Wallet');
        let myName = opts.myName || this.gettextCatalog.getString('me');

        walletClient.createWallet(name, myName, opts.m, opts.n, {
          network: opts.networkName,
          singleAddress: opts.singleAddress,
          walletPrivKey: opts.walletPrivKey,
        }, (err, secret) => {
          if (err) return this.bwcError.cb(err, this.gettext('Error creating wallet'), cb);
          return cb(null, walletClient, secret);
        });
      });
    }, 50);
  };

  // create and store a wallet
  createWallet(opts, cb) {
    this.doCreateWallet(opts, (err, walletClient, secret) => {
      if (err) return cb(err);

      this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }, cb);
    });
  };

  // joins and stores a wallet
  joinWallet(opts, cb) {
    //let walletClient = this.bwcService.getClient();
    this.logger.debug('Joining Wallet:', opts);

    let walletData;

    try {
      walletData = this.bwcService.parseSecret(opts.secret);

      // check if exist
      if (lodash.find(this.profile.credentials, {
          'walletId': walletData.walletId
        })) {
        return cb(this.gettext('Cannot join the same wallet more that once'));
      }
    } catch (ex) {
      this.logger.debug(ex);
      return cb(this.gettext('Bad wallet invitation'));
    }
    opts.networkName = walletData.network;
    this.logger.debug('Joining Wallet:', opts);

    this.seedWallet(opts, (err, walletClient) => {
      if (err) return cb(err);

      walletClient.joinWallet(opts.secret, opts.myName || 'me', {}, (err) => {
        if (err) return this.bwcError.cb(err, this.gettext('Could not join wallet'), cb);
        this.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }, cb);
      });
    });
  };

  getWallet(walletId) {
    return this.wallet[walletId];
  };


  deleteWalletClient(client, cb) {
    let walletId = client.credentials.walletId;

    this.pushNotificationsService.unsubscribe(this.getWallet(walletId), (err) => {
      if (err) this.logger.warn('Unsubscription error: ' + err.message);
      else this.logger.debug('Unsubscribed from push notifications service');
    });

    this.logger.debug('Deleting Wallet:', client.credentials.walletName);
    client.removeAllListeners();

    this.profile.deleteWallet(walletId);

    delete this.wallet[walletId];

    this.storageService.removeAllWalletData(walletId, (err) => {
      if (err) this.logger.warn(err);
    });

    this.storageService.storeProfile(this.profile, (err) => {
      if (err) return cb(err);
      return cb();
    });
  };

  setMetaData(walletClient, addressBook, cb) {
    this.storageService.getAddressbook(walletClient.credentials.network, (err, localAddressBook) => {
      let localAddressBook1 = {};
      try {
        localAddressBook1 = JSON.parse(localAddressBook);
      } catch (ex) {
        this.logger.warn(ex);
      }
      lodash.merge(addressBook, localAddressBook1);
      this.storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), (err) => {
        if (err) return cb(err);
        return cb(null);
      });
    });
  }

  // Adds and bind a new client to the profile
  addAndBindWalletClient(client, opts, cb) {
    if (!client || !client.credentials)
      return cb(this.gettext('Could not access wallet'));

    let walletId = client.credentials.walletId

    if (!this.profile.addWallet(JSON.parse(client.export())))
      return cb(this.gettext('Wallet already in Copay'));


    let skipKeyValidation = this.profile.isChecked(this.platformInfo.ua, walletId);
    if (!skipKeyValidation)
      this.runValidation(client);

    this.bindWalletClient(client);

    let saveBwsUrl = (cb) => {
      let defaults = this.configService.getDefaults();
      let bwsFor = {};
      bwsFor[walletId] = opts.bwsurl || defaults.bws.url;

      // Dont save the default
      if (bwsFor[walletId] == defaults.bws.url)
        return cb();

      this.configService.set({
        bwsFor: bwsFor,
      }, (err) => {
        if (err) this.logger.warn(err);
        return cb();
      });
    };

    saveBwsUrl(() => {
      this.storageService.storeProfile(this.profile, (err) => {
        let config = this.configService.getSync();
        if (config.pushNotifications.enabled)
          this.pushNotificationsService.enableNotifications(this.wallet);
        return cb(err, client);
      });
    });
  };

  storeProfileIfDirty(cb?) {
    if (this.profile.dirty) {
      this.storageService.storeProfile(this.profile, (err) => {
        this.logger.debug('Saved modified Profile');
        if (cb) return cb(err);
      });
    } else {
      if (cb) return cb();
    };
  };

  importWallet(str, opts, cb) {

    let walletClient = this.bwcService.getClient(null, opts);

    this.logger.debug('Importing Wallet:', opts);

    try {
      let c = JSON.parse(str);

      if (c.xPrivKey && c.xPrivKeyEncrypted) {
        this.logger.warn('Found both encrypted and decrypted key. Deleting the encrypted version');
        delete c.xPrivKeyEncrypted;
        delete c.mnemonicEncrypted;
      }

      str = JSON.stringify(c);

      walletClient.import(str, {
        compressed: opts.compressed,
        password: opts.password
      });
    } catch (err) {
      return cb(this.gettext('Could not import. Check input file and spending password'));
    }

    str = JSON.parse(str);

    if (!str.n) {
      return cb("Backup format not recognized. If you are using a Copay Beta backup and version is older than 0.10, please see: https://github.com/bitpay/copay/issues/4730#issuecomment-244522614");
    }

    let addressBook = str.addressBook || {};

    this.addAndBindWalletClient(walletClient, {
      bwsurl: opts.bwsurl
    }, (err, walletId) => {
      if (err) return cb(err);
      this.setMetaData(walletClient, addressBook, (error) => {
        if (error) this.logger.warn(error);
        return cb(err, walletClient);
      });
    });
  };

  importExtendedPrivateKey(xPrivKey, opts, cb) {
    let walletClient = this.bwcService.getClient(null, opts);
    this.logger.debug('Importing Wallet xPrivKey');

    walletClient.importFromExtendedPrivateKey(xPrivKey, opts, (err) => {
      if (err) {
        if (err instanceof this.errors.NOT_AUTHORIZED)
          return cb(err);

        return this.bwcError.cb(err, this.gettext('Could not import'), cb);
      }

      this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }, cb);
    });
  };

  _normalizeMnemonic(words) {
    let isJA = words.indexOf('\u3000') > -1;
    let wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  };

  importMnemonic(words, opts, cb) {
    let walletClient = this.bwcService.getClient(null, opts);

    this.logger.debug('Importing Wallet Mnemonic');

    words = this._normalizeMnemonic(words);
    walletClient.importFromMnemonic(words, {
      network: opts.networkName,
      passphrase: opts.passphrase,
      account: opts.account || 0,
    }, (err) => {
      if (err) {
        if (err instanceof this.errors.NOT_AUTHORIZED)
          return cb(err);

        return this.bwcError.cb(err, this.gettext('Could not import'), cb);
      }

      this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }, cb);
    });
  };

  importExtendedPublicKey(opts, cb) {
    let walletClient = this.bwcService.getClient(null, opts);
    this.logger.debug('Importing Wallet XPubKey');

    walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
      account: opts.account || 0,
      derivationStrategy: opts.derivationStrategy || 'BIP44',
    }, (err) => {
      if (err) {

        // in HW wallets, req key is always the same. They can't addAccess.
        if (err instanceof this.errors.NOT_AUTHORIZED)
          err.name = 'WALLET_DOES_NOT_EXIST';

        return this.bwcError.cb(err, this.gettext('Could not import'), cb);
      }

      this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }, cb);
    });
  };

  createProfile(cb) {
    this.logger.info('Creating profile');
    //let defaults = this.configService.getDefaults();

    this.configService.get((err) => {
      if (err) this.logger.debug(err);

      let p = new Profile();
      this.storageService.storeNewProfile(p, (err) => {
        if (err) return cb(err);
        this.bindProfile(p, (err) => {
          // ignore NONAGREEDDISCLAIMER
          if (err && err.toString().match('NONAGREEDDISCLAIMER')) return cb();
          return cb(err);
        });
      });
    });
  };

  createDefaultWallet(cb) {
    let opts: any = {};
    opts.m = 1;
    opts.n = 1;
    opts.network = 'livenet';
    this.createWallet(opts, cb);
  };

  setDisclaimerAccepted(cb) {
    this.profile.disclaimerAccepted = true;
    this.storageService.storeProfile(this.profile, (err) => {
      return cb(err);
    });
  };

  isDisclaimerAccepted(cb) {
    let disclaimerAccepted = this.profile && this.profile.disclaimerAccepted;
    if (disclaimerAccepted)
      return cb(true);

    // OLD flag
    this.storageService.getCopayDisclaimerFlag((err, val) => {
      if (val) {
        this.profile.disclaimerAccepted = true;
        return cb(true);
      } else {
        return cb();
      }
    });
  };

  updateCredentials(credentials, cb) {
    this.profile.updateWallet(credentials);
    this.storageService.storeProfile(this.profile, cb);
  };

  getWallets(opts?) {

    if (opts && !lodash.isObject(opts))
      throw "bad argument";

    opts = opts || {};

    let ret = lodash.values(this.wallet);

    if (opts.network) {
      ret = lodash.filter(ret, (x) => {
        return (x.credentials.network == opts.network);
      });
    }

    if (opts.n) {
      ret = lodash.filter(ret, (w) => {
        return (w.credentials.n == opts.n);
      });
    }

    if (opts.onlyComplete) {
      ret = lodash.filter(ret, (w) => {
        return w.isComplete();
      });
    } else {}

    return lodash.sortBy(ret, [
      (x) => {
        return x.isComplete();
      }, 'createdOn'
    ]);
  };

  toggleHideBalanceFlag(walletId, cb) {
    this.wallet[walletId].balanceHidden = !this.wallet[walletId].balanceHidden;
    this.storageService.setHideBalanceFlag(walletId, this.wallet[walletId].balanceHidden.toString(), cb);
  };

  getNotifications(opts, cb) {
    opts = opts || {};

    let TIME_STAMP = 60 * 60 * 6;
    let MAX = 100;

    let typeFilter = {
      'NewOutgoingTx': 1,
      'NewIncomingTx': 1
    };

    let w = this.getWallets();
    if (lodash.isEmpty(w)) return cb();

    let l = w.length,
      j = 0,
      notifications = [];


    function isActivityCached(wallet) {
      return wallet.cachedActivity && wallet.cachedActivity.isValid;
    };


    function updateNotifications(wallet, cb2) {
      if (isActivityCached(wallet) && !opts.force) return cb2();

      wallet.getNotifications({
        timeSpan: TIME_STAMP,
        includeOwn: true,
      }, (err, n) => {
        if (err) return cb2(err);

        wallet.cachedActivity = {
          n: n.slice(-MAX),
          isValid: true,
        };

        return cb2();
      });
    };

    function process(notifications) {
      if (!notifications) return [];

      let shown = lodash.sortBy(notifications, 'createdOn').reverse();

      shown = shown.splice(0, opts.limit || MAX);

      lodash.each(shown, (x) => {
        x.txpId = x.data ? x.data.txProposalId : null;
        x.txid = x.data ? x.data.txid : null;
        x.types = [x.type];

        if (x.data && x.data.amount)
          x.amountStr = this.txFormatService.formatAmountStr(x.data.amount);

        x.action = () => {
          // TODO?
          // $state.go('tabs.wallet', {
          //   walletId: x.walletId,
          //   txpId: x.txpId,
          //   txid: x.txid,
          // });
        };
      });

      //let finale = shown; // GROUPING DISABLED!

      let finale = [],
        prev;


      // Item grouping... DISABLED.

      // REMOVE (if we want 1-to-1 notification) ????
      lodash.each(shown, (x) => {
        if (prev && prev.walletId === x.walletId && prev.txpId && prev.txpId === x.txpId && prev.creatorId && prev.creatorId === x.creatorId) {
          prev.types.push(x.type);
          prev.data = lodash.assign(prev.data, x.data);
          prev.txid = prev.txid || x.txid;
          prev.amountStr = prev.amountStr || x.amountStr;
          prev.creatorName = prev.creatorName || x.creatorName;
        } else {
          finale.push(x);
          prev = x;
        }
      });

      let u = this.bwcService.getUtils();
      lodash.each(finale, (x) => {
        if (x.data && x.data.message && x.wallet && x.wallet.credentials.sharedEncryptingKey) {
          // TODO TODO TODO => BWC
          x.message = u.decryptMessage(x.data.message, x.wallet.credentials.sharedEncryptingKey);
        }
      });

      return finale;
    };

    lodash.each(w, (wallet) => {
      updateNotifications(wallet, (err) => {
        j++;
        if (err) {
          this.logger.warn('Error updating notifications:' + err);
        } else {

          let n;

          n = lodash.filter(wallet.cachedActivity.n, (x) => {
            return typeFilter[x.type];
          });

          let idToName = {};
          if (wallet.cachedStatus) {
            lodash.each(wallet.cachedStatus.wallet.copayers, (c) => {
              idToName[c.id] = c.name;
            });
          }

          lodash.each(n, (x) => {
            x.wallet = wallet;
            if (x.creatorId && wallet.cachedStatus) {
              x.creatorName = idToName[x.creatorId];
            };
          });

          notifications.push(n);
        }
        if (j == l) {
          notifications = lodash.sortBy(notifications, 'createdOn');
          notifications = lodash.compact(lodash.flatten(notifications)).slice(0, MAX);
          return cb(null, process(notifications));
        };
      });
    });
  };


  getTxps(opts, cb) {
    let MAX = 100;
    opts = opts || {};

    let w = this.getWallets();
    if (lodash.isEmpty(w)) return cb();

    let txps = [];

    lodash.each(w, (x) => {
      if (x.pendingTxps)
        txps = txps.concat(x.pendingTxps);
    });
    let n = txps.length;
    txps = lodash.sortBy(txps, 'pendingForUs', 'createdOn');
    txps = lodash.compact(lodash.flatten(txps)).slice(0, opts.limit || MAX);
    return cb(null, txps, n);
  };

}
