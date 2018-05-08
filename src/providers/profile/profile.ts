import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';

// models
import { Profile } from '../../models/profile/profile.model';

@Injectable()
export class ProfileProvider {
  public wallet: any = {};
  public profile: Profile;

  private UPDATE_PERIOD = 15;
  private throttledBwsEvent: any;
  private validationLock: boolean = false;
  private errors: any = this.bwcProvider.getErrors();

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private configProvider: ConfigProvider,
    private bwcProvider: BwcProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private languageProvider: LanguageProvider,
    private events: Events,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService
  ) {
    this.throttledBwsEvent = _.throttle((n, wallet) => {
      this.newBwsEvent(n, wallet);
    }, 10000);
  }

  private updateWalletSettings(wallet: any): void {
    let config: any = this.configProvider.get();
    let defaults: any = this.configProvider.getDefaults();
    // this.config.whenAvailable( (config) => { TODO
    wallet.usingCustomBWS = config.bwsFor && config.bwsFor[wallet.id] && (config.bwsFor[wallet.id] != defaults.bws.url);
    wallet.name = (config.aliasFor && config.aliasFor[wallet.id]) || wallet.credentials.walletName;
    wallet.color = (config.colorFor && config.colorFor[wallet.id]) ? config.colorFor[wallet.id] : '#647ce8';
    wallet.email = config.emailFor && config.emailFor[wallet.id];
    // });
  }

  public setWalletOrder(walletId: string, index: number): void {
    this.persistenceProvider.setWalletOrder(walletId, index).then( () => {
      this.logger.debug('Wallet new order stored ' + this.wallet[walletId].name + ': ' + index);
    });
    if (this.wallet[walletId]) this.wallet[walletId]['order'] = index;
  }

  public getWalletOrder(wallet): Promise<any> {
    return new Promise(resolve => {
      this.persistenceProvider.getWalletOrder(wallet.credentials.walletId).then((order:any) => {
        return resolve(order);
      });
    });
  }

  public setBackupFlag(walletId: string): void {
    this.persistenceProvider.setBackupFlag(walletId);
    this.logger.debug('Backup flag stored');
    this.wallet[walletId].needsBackup = false;
  }

  private requiresBackup(wallet: any): boolean {
    if (wallet.isPrivKeyExternal()) return false;
    if (!wallet.credentials.mnemonic && !wallet.credentials.mnemonicEncrypted) return false;
    if (wallet.credentials.network == 'testnet') return false;

    return true;
  }

  private needsBackup(wallet: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.requiresBackup(wallet)) {
        return resolve(false);
      }

      this.persistenceProvider.getBackupFlag(wallet.credentials.walletId).then((val: string) => {
        if (val) {
          return resolve(false);
        }
        return resolve(true);
      }).catch((err) => {
        this.logger.error(err);
      });
    })
  }

  private isBalanceHidden(wallet: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getHideBalanceFlag(wallet.credentials.walletId).then((shouldHideBalance) => {
        let isHidden = shouldHideBalance && shouldHideBalance.toString() == 'true' ? true : false;
        return resolve(isHidden);
      }).catch((err) => {
        this.logger.error(err);
      });
    });
  }

  private bindWalletClient(wallet: any, opts?: any): boolean {
    opts = opts ? opts : {};
    let walletId = wallet.credentials.walletId;

    if ((this.wallet[walletId] && this.wallet[walletId].started) && !opts.force) return false;

    // INIT WALLET VIEWMODEL
    wallet.id = walletId;
    wallet.started = true;
    wallet.network = wallet.credentials.network;
    wallet.copayerId = wallet.credentials.copayerId;
    wallet.m = wallet.credentials.m;
    wallet.n = wallet.credentials.n;
    wallet.coin = wallet.credentials.coin;
    wallet.status = {};

    this.updateWalletSettings(wallet);
    this.wallet[walletId] = wallet;

    this.needsBackup(wallet).then((val: any) => {
      wallet.needsBackup = val;
    });

    this.isBalanceHidden(wallet).then((val: any) => {
      wallet.balanceHidden = val;
    });

    this.getWalletOrder(wallet).then((val: number) => {
      wallet.order = val;
    });

    wallet.removeAllListeners();

    wallet.on('report', (n: any) => {
      this.logger.info('BWC Report:' + n);
    });

    wallet.on('notification', (n: any) => {
      this.logger.debug('BWC Notification:', JSON.stringify(n));

      if (n.type == "NewBlock" && n.data.network == "testnet") {
        this.throttledBwsEvent(n, wallet);
      } else this.newBwsEvent(n, wallet);
    });

    wallet.on('walletCompleted', () => {
      this.logger.debug('Wallet completed');
      this.updateCredentials(JSON.parse(wallet.export()))
      this.events.publish('status:updated');
    });

    wallet.initialize({
      notificationIncludeOwn: true,
    }, (err: any) => {
      if (err) {
        this.logger.error('Could not init notifications err:', err);
        return;
      }
      wallet.setNotificationsInterval(this.UPDATE_PERIOD);
      wallet.openWallet((err: any) => {
        if (wallet.status !== true)
          this.logger.debug('Wallet + ' + walletId + ' status:' + JSON.stringify(wallet.status));
      });
    });
    this.events.subscribe('wallet:updated', (walletId: string) => {
      if (walletId && walletId == wallet.id) {
        this.logger.debug('Updating settings for wallet:' + wallet.id);
        this.updateWalletSettings(wallet);
      }
    });

    return true;
  }

  private newBwsEvent(n: any, wallet: any): void {
    if (wallet.cachedStatus)
      wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory)
      wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity)
      wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps)
      wallet.cachedTxps.isValid = false;

    this.events.publish('bwsEvent', wallet.id, n.type, n);
  }

  public updateCredentials(credentials: any): void {
    this.profile.updateWallet(credentials);
    this.persistenceProvider.storeProfile(this.profile);
  }

  public getLastKnownBalance(wid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getBalanceCache(wid).then((data: string) => {
        return resolve(data);
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  private addLastKnownBalance(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let now = Math.floor(Date.now() / 1000);
      let showRange = 600; // 10min;

      this.getLastKnownBalance(wallet.id).then((data: any) => {
        if (data) {
          let parseData: any = data;
          wallet.cachedBalance = parseData.balance;
          wallet.cachedBalanceUpdatedOn = (parseData.updatedOn < now - showRange) ? parseData.updatedOn : null;
        }
        return resolve();
      }).catch((err: any) => {
        this.logger.warn('Could not get last known balance: ', err);
      });
    });
  }

  public setLastKnownBalance(wid: string, balance: number): void {
    this.persistenceProvider.setBalanceCache(wid, { balance, updatedOn: Math.floor(Date.now() / 1000) });
  }

  private runValidation(wallet: any, delay?: number, retryDelay?: number) {

    delay = delay ? delay : 500;
    retryDelay = retryDelay ? retryDelay : 50;

    if (this.validationLock) {
      return setTimeout(() => {
        this.logger.debug('ValidatingWallet Locked: Retrying in: ' + retryDelay);
        return this.runValidation(wallet, delay, retryDelay);
      }, retryDelay);
    }
    this.validationLock = true;

    // IOS devices are already checked
    let skipDeviceValidation = this.platformProvider.isIOS || this.profile.isDeviceChecked(this.platformProvider.ua);
    let walletId = wallet.credentials.walletId;

    this.logger.debug('ValidatingWallet: ' + walletId + ' skip Device:' + skipDeviceValidation);
    setTimeout(() => {
      wallet.validateKeyDerivation({
        skipDeviceValidation,
      }, (err: any, isOK: any) => {
        this.validationLock = false;

        this.logger.debug('ValidatingWallet End:  ' + walletId + ' isOK:' + isOK);
        if (isOK) {
          this.profile.setChecked(this.platformProvider.ua, walletId);
        } else {
          this.logger.warn('Key Derivation failed for wallet:' + walletId);
          this.persistenceProvider.clearLastAddress(walletId).then(() => {
          });
        };

        this.storeProfileIfDirty();
      });
    }, delay);
  }

  public storeProfileIfDirty(): void {
    if (this.profile.dirty) {
      this.persistenceProvider.storeProfile(this.profile).then((err: any) => {
        this.logger.debug('Saved modified Profile');
        return;
      });
    } else {
      return;
    };
  }

  public importWallet(str: string, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let walletClient = this.bwcProvider.getClient(null, opts);

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
        return reject(this.translate.instant('Could not import. Check input file.'));
      }

      let strParsed: any = JSON.parse(str);

      if (!strParsed.n) {
        return reject("Backup format not recognized. If you are using a Copay Beta backup and version is older than 0.10, please see: https://github.com/bitpay/copay/issues/4730#issuecomment-244522614");
      }

      let addressBook = strParsed.addressBook ? strParsed.addressBook : {};

      this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }).then((walletId: string) => {
        this.setMetaData(walletClient, addressBook).then(() => {
          return resolve(walletClient);
        }).catch((err: any) => {
          this.logger.warn('Could not set meta data: ', err);
          return reject(err);
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  // An alert dialog
  private askPassword(warnMsg: string, title: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let opts = {
        type: 'password',
        useDanger: true
      }
      this.popupProvider.ionicPrompt(title, warnMsg, opts).then((res: any) => {
        return resolve(res);
      });
    });
  }

  private showWarningNoEncrypt(): Promise<any> {
    return new Promise((resolve, reject) => {
      let title = this.translate.instant('Are you sure?');
      let msg = this.translate.instant('Without encryption, a thief or another application on this device may be able to access your funds.');
      let okText = this.translate.instant('I\'m sure');
      let cancelText = this.translate.instant('Go Back');
      this.popupProvider.ionicConfirm(title, msg, okText, cancelText).then((res: any) => {
        return resolve(res);
      });
    });
  }

  private askToEncryptWallet(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {

      if (!wallet.canSign()) return resolve();

      var title = this.translate.instant('Would you like to protect this wallet with a password?');
      var message = this.translate.instant('Encryption can protect your funds if this device is stolen or compromised by malicious software.');
      var okText = this.translate.instant('Yes');
      var cancelText = this.translate.instant('No');
      this.popupProvider.ionicConfirm(title, message, okText, cancelText).then((res: any) => {
        if (!res) {
          return this.showWarningNoEncrypt().then((res) => {
            if (res) return resolve()
            return this.encrypt(wallet).then(() => {
              return resolve();
            });
          });
        }
        return this.encrypt(wallet).then(() => {
          return resolve();
        });
      });
    });
  }

  private encrypt(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let title = this.translate.instant('Enter a password to encrypt your wallet');
      let warnMsg = this.translate.instant('This password is only for this device, and it cannot be recovered. To avoid losing funds, write your password down.');
      this.askPassword(warnMsg, title).then((password: string) => {
        if (!password) {
          this.showWarningNoEncrypt().then((res: any) => {
            if (res) return resolve();
            this.encrypt(wallet).then(() => {
              return resolve();
            });
          });
        }
        else {
          title = this.translate.instant('Enter your encrypt password again to confirm');
          this.askPassword(warnMsg, title).then((password2: string) => {
            if (!password2 || password != password2) {
              this.encrypt(wallet).then(() => {
                return resolve();
              });
            } else {
              wallet.encryptPrivateKey(password);
              return resolve();
            }
          });
        }
      });
    });
  }

  // Adds and bind a new client to the profile
  private addAndBindWalletClient(wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet || !wallet.credentials) {
        return reject(this.translate.instant('Could not access wallet'));
      }

      // Encrypt wallet
      this.onGoingProcessProvider.pause();
      this.askToEncryptWallet(wallet).then(() => {
        this.onGoingProcessProvider.resume();

        let walletId: string = wallet.credentials.walletId

        if (!this.profile.addWallet(JSON.parse(wallet.export()))) {
          let message = "Wallet already in " + this.appProvider.info.nameCase; // TODO: translate
          return reject(message);
        }

        let skipKeyValidation: boolean = this.shouldSkipValidation(walletId);
        if (!skipKeyValidation)
          this.runValidation(wallet);

        this.bindWalletClient(wallet);

        let saveBwsUrl = (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let defaults: any = this.configProvider.getDefaults();
            let bwsFor: any = {};
            bwsFor[walletId] = opts.bwsurl || defaults.bws.url;

            // Dont save the default
            if (bwsFor[walletId] == defaults.bws.url) {
              return resolve();
            }

            this.configProvider.set({ bwsFor });
            return resolve();
          });
        };

        saveBwsUrl().then(() => {
          this.persistenceProvider.storeProfile(this.profile).then(() => {
            return resolve(wallet);
          }).catch((err: any) => {
            return reject(err);
          });
        });
      });
    });
  }

  private shouldSkipValidation(walletId: string): boolean {
    return this.profile.isChecked(this.platformProvider.ua, walletId) || this.platformProvider.isIOS;
  }

  private setMetaData(wallet: any, addressBook: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getAddressbook(wallet.credentials.network).then((localAddressBook: any) => {
        let localAddressBook1 = {};
        try {
          localAddressBook1 = JSON.parse(localAddressBook);
        } catch (ex) {
          this.logger.info('Address Book: JSON.parse not neccesary.', localAddressBook);
        }
        let mergeAddressBook = _.merge(addressBook, localAddressBook1);
        this.persistenceProvider.setAddressbook(wallet.credentials.network, JSON.stringify(mergeAddressBook)).then(() => {
          return resolve();
        }).catch((err: any) => {
          return reject(err);
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  public importExtendedPrivateKey(xPrivKey: string, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {

      let walletClient = this.bwcProvider.getClient(null, opts);
      this.logger.debug('Importing Wallet xPrivKey');

      walletClient.importFromExtendedPrivateKey(xPrivKey, opts, (err: any) => {
        if (err) {
          if (err instanceof this.errors.NOT_AUTHORIZED) return reject(err);
          this.bwcErrorProvider.cb(err, this.translate.instant('Could not import')).then((msg: string) => {
            return reject(msg);
          });
        } else {
          this.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl
          }).then((wallet: any) => {
            return resolve(wallet);
          }).catch((err: any) => {
            return reject(err);
          });
        };
      });
    });
  }

  private normalizeMnemonic(words: string): string {
    if (!words || !words.indexOf) return words;
    let isJA = words.indexOf('\u3000') > -1;
    let wordList = words.split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  };

  public importMnemonic(words: string, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {

      let walletClient = this.bwcProvider.getClient(null, opts);

      this.logger.debug('Importing Wallet Mnemonic');

      words = this.normalizeMnemonic(words);
      walletClient.importFromMnemonic(words, {
        network: opts.networkName,
        passphrase: opts.passphrase,
        entropySourcePath: opts.entropySourcePath,
        derivationStrategy: opts.derivationStrategy || 'BIP44',
        account: opts.account || 0,
        coin: opts.coin
      }, (err: any) => {
        if (err) {
          if (err instanceof this.errors.NOT_AUTHORIZED) {
            return reject(err);
          }

          this.bwcErrorProvider.cb(err, this.translate.instant('Could not import')).then((msg: string) => {
            return reject(msg);
          });

        }

        this.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }).then((wallet: any) => {
          return resolve(wallet);
        }).catch((err: any) => {
          return reject(err);
        });
      });
    });
  }

  public importExtendedPublicKey(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {

      let walletClient = this.bwcProvider.getClient(null, opts);
      this.logger.debug('Importing Wallet XPubKey');

      walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
        account: opts.account || 0,
        derivationStrategy: opts.derivationStrategy || 'BIP44',
        coin: opts.coin
      }, (err: any) => {
        if (err) {

          // in HW wallets, req key is always the same. They can't addAccess.
          if (err instanceof this.errors.NOT_AUTHORIZED)
            err.name = 'WALLET_DOES_NOT_EXIST';

          this.bwcErrorProvider.cb(err, this.translate.instant('Could not import')).then((msg: string) => {
            return reject(msg);
          });

        }

        this.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }).then((wallet: any) => {
          return resolve(wallet);
        }).catch((err: any) => {
          return reject(err);
        });
      });
    });
  }

  public createProfile(): void {
    this.logger.info('Creating profile');
    this.profile = new Profile();
    this.profile = this.profile.create();
    this.persistenceProvider.storeNewProfile(this.profile);
  }

  public bindProfile(profile: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let bindWallets = (): Promise<any> => {
        return new Promise((resolve, reject) => {

          let l = profile.credentials.length;
          let i = 0;
          let totalBound = 0;

          if (!l) {
            return resolve();
          }

          _.each(profile.credentials, (credentials) => {
            this.bindWallet(credentials).then((bound: number) => {
              i++;
              totalBound += bound;
              if (i == l) {
                this.logger.info('Bound ' + totalBound + ' out of ' + l + ' wallets');
                return resolve();
              }
            }).catch((err) => {
              return reject(err);
            });
          });
        });
      };

      bindWallets().then(() => {
        this.isOnboardingCompleted().then(() => {
          this.isDisclaimerAccepted().then(() => {
            return resolve();
          }).catch(() => {
            return reject(new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer'));
          });
        }).catch(() => {
          this.isDisclaimerAccepted().then(() => {
            this.setOnboardingCompleted().then(() => {
              return resolve();
            }).catch((err: any) => {
              this.logger.error(err);
            });
          }).catch(() => {
            return reject(new Error('ONBOARDINGNONCOMPLETED: Onboarding non completed'));
          });
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  public isDisclaimerAccepted(): Promise<any> {
    return new Promise((resolve, reject) => {

      let disclaimerAccepted = this.profile && this.profile.disclaimerAccepted;
      if (disclaimerAccepted) return resolve();

      // OLD flag
      this.persistenceProvider.getCopayDisclaimerFlag().then((val) => {
        if (val) {
          this.profile.disclaimerAccepted = true;
          return resolve();
        } else {
          return reject();
        }
      });
    });
  }

  public isOnboardingCompleted(): Promise<any> {
    return new Promise((resolve, reject) => {

      let onboardingCompleted = this.profile && this.profile.onboardingCompleted;
      if (onboardingCompleted) return resolve();

      this.persistenceProvider.getCopayOnboardingFlag().then((val) => {
        if (val) {
          this.profile.onboardingCompleted = true;
          return resolve();
        } else {
          return reject();
        }
      });
    });
  }


  private bindWallet(credentials: any): Promise<any> {
    return new Promise((resolve, reject) => {

      if (!credentials.walletId || !credentials.m) {
        return reject('bindWallet should receive credentials JSON');
      }

      // Create the client
      let getBWSURL = (walletId: string) => {
        let config: any = this.configProvider.get();
        let defaults: any = this.configProvider.getDefaults();
        return ((config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url);
      };

      let walletClient = this.bwcProvider.getClient(JSON.stringify(credentials), {
        bwsurl: getBWSURL(credentials.walletId),
      });

      let skipKeyValidation = this.shouldSkipValidation(credentials.walletId);
      if (!skipKeyValidation) this.runValidation(walletClient, 500);

      this.logger.info('Binding wallet:' + credentials.walletId + ' Validating?:' + !skipKeyValidation);
      return resolve(this.bindWalletClient(walletClient));
    });
  }

  public loadAndBindProfile(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getProfile().then((profile: any) => {

        if (!profile) {
          return resolve();
        }
        this.profile = new Profile();
        this.profile = this.profile.fromObj(profile);
        // Deprecated: storageService.tryToMigrate
        this.logger.debug('Profile read');
        this.bindProfile(this.profile).then(() => {
          return resolve(this.profile);
        }).catch((err: any) => {
          return reject(err);
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  private seedWallet(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {

      opts = opts ? opts : {};
      let walletClient = this.bwcProvider.getClient(null, opts);
      let network = opts.networkName || 'livenet';

      if (opts.mnemonic) {
        try {
          opts.mnemonic = this.normalizeMnemonic(opts.mnemonic);
          walletClient.seedFromMnemonic(opts.mnemonic, {
            network,
            passphrase: opts.passphrase,
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
            coin: opts.coin
          });

        } catch (ex) {
          this.logger.info('Invalid wallet recovery phrase: ', ex);
          return reject(this.translate.instant('Could not create: Invalid wallet recovery phrase'));
        }
      } else if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey, {
            network,
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
            coin: opts.coin,
          });
        } catch (ex) {
          this.logger.warn('Could not get seed from Extended Private Key: ', ex);
          return reject(this.translate.instant('Could not create using the specified extended private key'));
        }
      } else if (opts.extendedPublicKey) {
        try {
          walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
            coin: opts.coin
          });
          walletClient.credentials.hwInfo = opts.hwInfo;
        } catch (ex) {
          this.logger.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
          return reject(this.translate.instant('Could not create using the specified extended public key'));
        }
      } else {
        let lang = this.languageProvider.getCurrent();
        try {
          walletClient.seedFromRandomWithMnemonic({
            network,
            passphrase: opts.passphrase,
            language: lang,
            account: 0,
            coin: opts.coin
          });
        } catch (e) {
          this.logger.info('Error creating recovery phrase: ' + e.message);
          if (e.message.indexOf('language') > 0) {
            this.logger.info('Using default language for recovery phrase');
            walletClient.seedFromRandomWithMnemonic({
              network,
              passphrase: opts.passphrase,
              account: 0,
              coin: opts.coin
            });
          } else {
            return reject(e);
          }
        }
      }
      return resolve(walletClient);
    });
  }

  // Creates a wallet on BWC/BWS
  private doCreateWallet(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {

      let showOpts = _.clone(opts);
      if (showOpts.extendedPrivateKey) showOpts.extendedPrivateKey = '[hidden]';
      if (showOpts.mnemonic) showOpts.mnemonic = '[hidden]';

      this.logger.debug('Creating Wallet:', JSON.stringify(showOpts));
      setTimeout(() => {
        this.seedWallet(opts).then((walletClient: any) => {

          let name = opts.name || this.translate.instant('Personal Wallet');
          let myName = opts.myName || this.translate.instant('me');

          walletClient.createWallet(name, myName, opts.m, opts.n, {
            network: opts.networkName,
            singleAddress: opts.singleAddress,
            walletPrivKey: opts.walletPrivKey,
            coin: opts.coin
          }, (err: any, secret: any) => {
            if (err) {
              this.bwcErrorProvider.cb(err, this.translate.instant('Error creating wallet')).then((msg: string) => {
                return reject(msg);
              });
            } else {
              return resolve(walletClient);
            }
          });
        }).catch((err: any) => {
          return reject(err);
        });
      }, 50);
    });
  }

  // create and store a wallet
  public createWallet(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.doCreateWallet(opts).then((walletClient: any) => {
        this.addAndBindWalletClient(walletClient, {
          bwsurl: opts.bwsurl
        }).then((wallet: any) => {
          return resolve(wallet);
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  // joins and stores a wallet
  public joinWallet(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Joining Wallet:', opts);

      try {
        var walletData = this.bwcProvider.parseSecret(opts.secret);

        // check if exist
        if (_.find(this.profile.credentials, {
          'walletId': walletData.walletId
        })) {
          return reject(this.translate.instant('Cannot join the same wallet more that once'));
        }
      } catch (ex) {
        this.logger.debug(ex);
        return reject(this.translate.instant('Bad wallet invitation'));
      }
      opts.networkName = walletData.network;
      this.logger.debug('Joining Wallet:', opts);

      this.seedWallet(opts).then((walletClient: any) => {
        walletClient.joinWallet(opts.secret, opts.myName || 'me', {
          coin: opts.coin
        }, (err: any) => {
          if (err) {
            this.bwcErrorProvider.cb(err, this.translate.instant('Could not join wallet')).then((msg: string) => {
              return reject(msg);
            });
          } else {
            this.addAndBindWalletClient(walletClient, {
              bwsurl: opts.bwsurl
            }).then((wallet: any) => {
              return resolve(wallet);
            });
          };
        });
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  public getWallet(walletId: string): any {
    return this.wallet[walletId];
  };

  public deleteWalletClient(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let walletId = wallet.credentials.walletId;

      this.logger.debug('Deleting Wallet:', wallet.credentials.walletName);
      wallet.removeAllListeners();

      this.profile.deleteWallet(walletId);

      delete this.wallet[walletId];

      this.persistenceProvider.removeAllWalletData(walletId).catch((err: any) => {
        this.logger.warn('Could not remove all wallet data: ', err);
      });

      this.persistenceProvider.storeProfile(this.profile).then(() => {
        return resolve();
      }).catch((err: any) => {
        return reject(err);
      });
    });
  };

  public createDefaultWallet(): Promise<any> {
    return new Promise((resolve, reject) => {
      let opts: any = {};
      opts.m = 1;
      opts.n = 1;
      opts.networkName = 'livenet';
      opts.coin = 'btc';
      this.createWallet(opts).then((wallet: any) => {
        return resolve(wallet);
      }).catch((err) => {
        return reject(err);
      });
    });
  };

  public setDisclaimerAccepted(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.profile.disclaimerAccepted = true;
      this.persistenceProvider.storeProfile(this.profile).then(() => {
        return resolve();
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  public setOnboardingCompleted(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.profile.onboardingCompleted = true;
      this.persistenceProvider.storeProfile(this.profile).then(() => {
        return resolve();
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  public getWallets(opts?: any) {

    if (opts && !_.isObject(opts)) throw new Error("bad argument");

    opts = opts || {};

    let ret = _.values(this.wallet);

    if (opts.coin) {
      ret = _.filter(ret, (x: any) => {
        return (x.credentials.coin == opts.coin);
      });
    }

    if (opts.network) {
      ret = _.filter(ret, (x: any) => {
        return (x.credentials.network == opts.network);
      });
    }

    if (opts.n) {
      ret = _.filter(ret, (w: any) => {
        return (w.credentials.n == opts.n);
      });
    }

    if (opts.m) {
      ret = _.filter(ret, (w: any) => {
        return (w.credentials.m == opts.m);
      });
    }

    if (opts.hasFunds) {
      ret = _.filter(ret, (w: any) => {
        if (!w.status) return;
        return (w.status.availableBalanceSat > 0);
      });
    }

    if (opts.minAmount) {
      ret = _.filter(ret, (w: any) => {
        if (!w.status) return;
        return (w.status.availableBalanceSat > opts.minAmount);
      });
    }

    if (opts.onlyComplete) {
      ret = _.filter(ret, (w: any) => {
        return w.isComplete();
      });
    } else { }

    // Add cached balance async
    _.each(ret, (x: any) => {
      this.addLastKnownBalance(x);
    });

    return _.sortBy(ret, 'order');
  }

  public toggleHideBalanceFlag(walletId: string): void {
    this.wallet[walletId].balanceHidden = !this.wallet[walletId].balanceHidden;
    this.persistenceProvider.setHideBalanceFlag(walletId, this.wallet[walletId].balanceHidden);
  }

  public getNotifications(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};

      let TIME_STAMP = 60 * 60 * 6;
      let MAX = 30;

      let typeFilter = {
        'NewOutgoingTx': 1,
        'NewIncomingTx': 1
      };

      let w = this.getWallets();
      if (_.isEmpty(w)) return reject('Could not find any wallet');

      let l = w.length;
      let j = 0;
      let notifications = [];


      let isActivityCached = (wallet: any): boolean => {
        return wallet.cachedActivity && wallet.cachedActivity.isValid;
      }


      let updateNotifications = (wallet: any): Promise<any> => {
        return new Promise((resolve, reject) => {

          if (isActivityCached(wallet) && !opts.force) {
            return resolve();
          }

          wallet.getNotifications({
            timeSpan: TIME_STAMP,
            includeOwn: true,
          }, (err: any, n: any) => {
            if (err) {
              return reject(err);
            }
            wallet.cachedActivity = {
              n: n.slice(-MAX),
              isValid: true,
            };

            return resolve();
          });
        });
      }

      let process = (notifications: any): any[] => {
        if (!notifications) return [];

        let shown = _.sortBy(notifications, 'createdOn').reverse();

        shown = shown.splice(0, opts.limit || MAX);

        _.each(shown, (x: any) => {
          x.txpId = x.data ? x.data.txProposalId : null;
          x.txid = x.data ? x.data.txid : null;
          x.types = [x.type];

          x.action = () => {
            // TODO?
            // $state.go('tabs.wallet', {
            //   walletId: x.walletId,
            //   txpId: x.txpId,
            //   txid: x.txid,
            // });
          };
        });

        // let finale = shown; GROUPING DISABLED!

        let finale = [];
        let prev: any;


        // Item grouping... DISABLED.

        // REMOVE (if we want 1-to-1 notification) ????
        _.each(shown, (x: any) => {
          if (prev && prev.walletId === x.walletId && prev.txpId && prev.txpId === x.txpId && prev.creatorId && prev.creatorId === x.creatorId) {
            prev.types.push(x.type);
            prev.data = _.assign(prev.data, x.data);
            prev.txid = prev.txid || x.txid;
            prev.creatorName = prev.creatorName || x.creatorName;
          } else {
            finale.push(x);
            prev = x;
          }
        });

        let u = this.bwcProvider.getUtils();
        _.each(finale, (x: any) => {
          if (x.data && x.data.message && x.wallet && x.wallet.credentials.sharedEncryptingKey) {
            // TODO TODO TODO => BWC
            x.message = u.decryptMessage(x.data.message, x.wallet.credentials.sharedEncryptingKey);
          }
        });

        return finale;
      }

      let pr = (wallet, cb) => {
        updateNotifications(wallet).then(() => {
          let n = _.filter(wallet.cachedActivity.n, (x: any) => {
            return typeFilter[x.type];
          });

          let idToName = {};
          if (wallet.cachedStatus) {
            _.each(wallet.cachedStatus.wallet.copayers, (c: any) => {
              idToName[c.id] = c.name;
            });
          }

          _.each(n, (x: any) => {
            x.wallet = wallet;
            if (x.creatorId && wallet.cachedStatus) {
              x.creatorName = idToName[x.creatorId];
            };
          });

          notifications.push(n);
          return cb();
        }).catch((err: any) => {
          return cb(err);
        });
      };

      _.each(w, (wallet: any) => {
        pr(wallet, (err) => {
          if (err)
            this.logger.warn(this.bwcErrorProvider.msg(err, 'Error updating notifications for ' + wallet.name));
          if (++j == l) {
            notifications = _.sortBy(notifications, 'createdOn').reverse();
            notifications = _.compact(_.flatten(notifications)).slice(0, MAX);
            let total = notifications.length;
            let processArray = process(notifications);
            return resolve({ notifications: processArray, total });
          }
        });
      });
    });
  }

  public getTxps(opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let MAX = 100;
      opts = opts ? opts : {};

      let w = this.getWallets();
      if (_.isEmpty(w)) {
        return reject('No wallets available');
      }

      let txps = [];

      _.each(w, (x: any) => {
        if (x.pendingTxps)
          txps = txps.concat(x.pendingTxps);
      });
      let n = txps.length;
      txps = _.sortBy(txps, 'createdOn').reverse();
      txps = _.compact(_.flatten(txps)).slice(0, opts.limit || MAX);
      return resolve({ txps, n });
    });
  };

}
