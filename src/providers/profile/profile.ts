import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs';

// providers
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { AppProvider } from '../app/app';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { DerivationPathHelperProvider } from '../derivation-path-helper/derivation-path-helper';
import { LanguageProvider } from '../language/language';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { ReplaceParametersProvider } from '../replace-parameters/replace-parameters';
import { TxFormatProvider } from '../tx-format/tx-format';
import { Coin, WalletOptions, WalletProvider } from '../wallet/wallet';

// models
import { Profile } from '../../models/profile/profile.model';

@Injectable()
export class ProfileProvider {
  public wallet: any = {};
  public profile: Profile;

  public UPDATE_PERIOD = 15;
  public UPDATE_PERIOD_FAST = 5;
  private throttledBwsEvent;
  private validationLock: boolean = false;
  private errors = this.bwcProvider.getErrors();
  private availableCoins: Array<{ coin: Coin; derivationPath: string }>;

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private bwcProvider: BwcProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private languageProvider: LanguageProvider,
    private events: Events,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    this.throttledBwsEvent = _.throttle((n, wallet) => {
      this.newBwsEvent(n, wallet);
    }, 10000);

    this.availableCoins = [
      {
        coin: Coin.BTC,
        derivationPath: this.derivationPathHelperProvider.defaultBTC
      },
      {
        coin: Coin.BCH,
        derivationPath: this.derivationPathHelperProvider.defaultBCH
      },
      {
        coin: Coin.BTC,
        derivationPath: this.derivationPathHelperProvider.defaultTestnet
      },
      {
        coin: Coin.BCH,
        derivationPath: this.derivationPathHelperProvider.defaultTestnet
      }
    ]
  }

  private updateWalletFromConfig(wallet): void {
    const config = this.configProvider.get();
    const defaults = this.configProvider.getDefaults();
    // this.config.whenAvailable( (config) => { TODO
    wallet.usingCustomBWS =
      config.bwsFor &&
      config.bwsFor[wallet.id] &&
      config.bwsFor[wallet.id] != defaults.bws.url;
    wallet.name =
      (config.aliasFor && config.aliasFor[wallet.id]) ||
      wallet.credentials.walletName;
    wallet.email = config.emailFor && config.emailFor[wallet.id];
    // });
  }

  public setWalletOrder(walletId: string, index: number): void {
    this.persistenceProvider.setWalletOrder(walletId, index).then(() => {
      this.logger.debug(
        'Wallet new order stored for ' + walletId + ': ' + index
      );
    });
    if (this.wallet[walletId]) this.wallet[walletId]['order'] = index;
  }

  public async getWalletOrder(walletId: string) {
    const order = await this.persistenceProvider.getWalletOrder(walletId);
    return order;
  }

  public setBackupFlag(walletId: string): void {
    this.persistenceProvider.setBackupFlag(walletId);
    this.logger.debug('Backup flag stored');
    this.wallet[walletId].needsBackup = false;
  }

  private requiresBackup(wallet): boolean {
    if (wallet.isPrivKeyExternal()) return false;
    if (!wallet.credentials.mnemonic && !wallet.credentials.mnemonicEncrypted)
      return false;
    if (wallet.credentials.network == 'testnet') return false;

    return true;
  }

  private getBackupInfo(wallet): Promise<any> {
    if (!this.requiresBackup(wallet)) {
      return Promise.resolve({ needsBackup: false });
    }
    return this.persistenceProvider
      .getBackupFlag(wallet.credentials.walletId)
      .then(timestamp => {
        if (timestamp) {
          return Promise.resolve({ needsBackup: false, timestamp });
        }
        return Promise.resolve({ needsBackup: true });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private isBalanceHidden(wallet): Promise<boolean> {
    return new Promise(resolve => {
      this.persistenceProvider
        .getHideBalanceFlag(wallet.credentials.walletId)
        .then(shouldHideBalance => {
          const isHidden =
            shouldHideBalance && shouldHideBalance.toString() == 'true'
              ? true
              : false;
          return resolve(isHidden);
        })
        .catch(err => {
          this.logger.error(err);
        });
    });
  }

  private async bindWalletClient(wallet, opts?): Promise<boolean> {
    opts = opts ? opts : {};
    const walletId = wallet.credentials.walletId;
    if (this.wallet[walletId] && this.wallet[walletId].started && !opts.force) {
      this.logger.info('This wallet has been initialized. Skip. ' + walletId);
      return false;
    }

    // INIT WALLET VIEWMODEL
    wallet.id = walletId;
    wallet.started = true;
    wallet.network = wallet.credentials.network;
    wallet.copayerId = wallet.credentials.copayerId;
    wallet.m = wallet.credentials.m;
    wallet.n = wallet.credentials.n;
    wallet.coin = wallet.credentials.coin;
    wallet.account = wallet.credentials.account;
    wallet.cachedStatus = {};

    this.updateWalletFromConfig(wallet);
    this.wallet[walletId] = wallet;

    const backupInfo = await this.getBackupInfo(wallet);
    wallet.backupTimestamp = backupInfo.timestamp ? backupInfo.timestamp : '';
    wallet.needsBackup = backupInfo.needsBackup;
    wallet.balanceHidden = await this.isBalanceHidden(wallet);
    wallet.order = await this.getWalletOrder(wallet.id);

    wallet.removeAllListeners();

    wallet.on('report', n => {
      this.logger.info('BWC Report:' + n);
    });

    wallet.on('notification', n => {
      if (this.platformProvider.isElectron) {
        this.showDesktopNotifications(n, wallet);
      }

      // TODO many NewBlocks notifications...if many blocks
      if (n.type == 'NewBlock' && n.data.network == 'testnet') {
        this.throttledBwsEvent(n, wallet);
      } else {
        this.newBwsEvent(n, wallet);
      }
    });

    wallet.on('walletCompleted', () => {
      this.logger.debug('Wallet completed');
      this.updateCredentials(JSON.parse(wallet.export()));
      this.events.publish('Local/WalletListChange');
      this.events.publish('Local/WalletUpdate', { walletId: wallet.id });
    });

    wallet.initialize(
      {
        notificationIncludeOwn: true
      },
      err => {
        if (err) {
          this.logger.error('Could not init notifications err:', err);
          return;
        }
        wallet.setNotificationsInterval(this.UPDATE_PERIOD);
        wallet.openWallet(() => { });
      }
    );
    this.events.subscribe('Local/ConfigUpdate', opts => {
      this.logger.debug('Local/ConfigUpdate handler @profile', opts);

      if (opts.walletId && opts.walletId == wallet.id) {
        this.logger.debug('Updating wallet from config ' + wallet.id);
        this.updateWalletFromConfig(wallet);
      }
    });

    const isEncrypted = this.walletProvider.isEncrypted(wallet) ? true : false;
    const backedUp = wallet.needsBackup ? false : true;
    let date;
    if (wallet.backupTimestamp) date = new Date(Number(wallet.backupTimestamp));
    this.logger.info(
      `Binding wallet: ${wallet.id} - Backed up: ${backedUp} ${
      date ? date : ''
      } - Encrypted: ${isEncrypted}`
    );

    return true;
  }

  public setFastRefresh(wallet): void {
    this.logger.debug(`Wallet ${wallet.id} set to fast refresh`);
    wallet.setNotificationsInterval(this.UPDATE_PERIOD_FAST);
  }

  public setSlowRefresh(wallet): void {
    this.logger.debug(`Wallet ${wallet.id} back to slow refresh`);
    wallet.setNotificationsInterval(this.UPDATE_PERIOD);
  }

  private showDesktopNotifications(n, wallet): void {
    if (!this.configProvider.get().desktopNotificationsEnabled) return;

    const creatorId = n && n.data && n.data.creatorId;
    const amount = n && n.data && n.data.amount;
    const walletName = wallet.name;
    let title: string;
    let body: string;
    let translatedMsg: string;

    switch (n.type) {
      case 'NewCopayer':
        if (wallet.copayerId != creatorId) {
          title = this.translate.instant('New copayer');
          translatedMsg = this.translate.instant(
            'A new copayer just joined your wallet {{walletName}}.'
          );
          body = this.replaceParametersProvider.replace(translatedMsg, {
            walletName
          });
        }
        break;
      case 'WalletComplete':
        title = this.translate.instant('Wallet complete');
        translatedMsg = this.translate.instant(
          'Your wallet {{walletName}} is complete.'
        );
        body = this.replaceParametersProvider.replace(translatedMsg, {
          walletName
        });
        break;
      case 'NewTxProposal':
        if (wallet && wallet.m > 1 && wallet.copayerId != creatorId) {
          title = this.translate.instant('New payment proposal');
          translatedMsg = this.translate.instant(
            'A new payment proposal has been created in your wallet {{walletName}}.'
          );
          body = this.replaceParametersProvider.replace(translatedMsg, {
            walletName
          });
        }
        break;
      case 'NewIncomingTx':
        title = this.translate.instant('New payment received');
        const amountStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          amount
        );
        translatedMsg = this.translate.instant(
          'A payment of {{amountStr}} has been received into your wallet {{walletName}}.'
        );
        body = this.replaceParametersProvider.replace(translatedMsg, {
          amountStr,
          walletName
        });
        break;
      case 'TxProposalFinallyRejected':
        title = this.translate.instant('Payment proposal rejected');
        translatedMsg = this.translate.instant(
          'A payment proposal in your wallet {{walletName}} has been rejected.'
        );
        body = this.replaceParametersProvider.replace(translatedMsg, {
          walletName
        });
        break;
      case 'TxConfirmation':
        title = this.translate.instant('Transaction confirmed');
        translatedMsg = this.translate.instant(
          'The transaction from {{walletName}} that you were waiting for has been confirmed.'
        );
        body = this.replaceParametersProvider.replace(translatedMsg, {
          walletName
        });
        break;
    }

    if (!body) return;

    const OS = this.platformProvider.getOS();
    if (OS && OS.OSName === 'MacOS') this.showOsNotifications(title, body);
    else this.showInAppNotification(title, body);
  }

  private async showInAppNotification(title: string, body: string) {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'in-app-notification',
      {
        title,
        body
      }
    );
    await infoSheet.present();
    await Observable.timer(7000).toPromise();
    infoSheet.dismiss();
  }

  private showOsNotifications(title: string, body: string): void {
    const { ipcRenderer } = (window as any).require('electron');
    ipcRenderer.send('new-notification', {
      title,
      body
    });
  }

  private newBwsEvent(n, wallet): void {
    this.events.publish('bwsEvent', wallet.id, n.type, n);
  }

  public updateCredentials(credentials): void {
    this.profile.updateWallet(credentials);
    this.persistenceProvider.storeProfile(this.profile).then(
      () => {
        this.logger.debug('Updated modified Profile(updateCredentials)');
      },
      e => {
        this.logger.error('Could not save Profile(updateCredentials)', e);
      }
    );
  }

  private runValidation(wallet, delay?: number, retryDelay?: number) {
    delay = delay ? delay : 500;
    retryDelay = retryDelay ? retryDelay : 50;

    if (this.validationLock) {
      return setTimeout(() => {
        return this.runValidation(wallet, delay, retryDelay);
      }, retryDelay);
    }
    this.validationLock = true;

    // IOS devices are already checked
    const skipDeviceValidation =
      this.platformProvider.isIOS ||
      this.profile.isDeviceChecked(this.platformProvider.ua);
    const walletId = wallet.credentials.walletId;

    this.logger.debug(
      'ValidatingWallet: ' + walletId + ' skip Device:' + skipDeviceValidation
    );
    setTimeout(() => {
      wallet.validateKeyDerivation(
        {
          skipDeviceValidation
        },
        (_, isOK) => {
          this.validationLock = false;

          this.logger.debug(
            'ValidatingWallet End:  ' + walletId + ' isOK:' + isOK
          );
          if (isOK) {
            this.profile.setChecked(this.platformProvider.ua, walletId);
          } else {
            this.logger.warn('Key Derivation failed for wallet:' + walletId);
            this.persistenceProvider.clearLastAddress(walletId).then(() => { });
          }

          this.storeProfileIfDirty();
        }
      );
    }, delay);
  }

  public storeProfileIfDirty(): void {
    if (this.profile.dirty) {
      this.persistenceProvider.storeProfile(this.profile).then(
        () => {
          this.logger.debug('Saved modified Profile');
          return;
        },
        e => {
          this.logger.error('Could not save Profile(Dirty)', e);
          return;
        }
      );
    } else {
      return;
    }
  }

  public async importWallet(str: string, opts): Promise<any> {
    this.logger.info('Importing Wallet:', opts);
    const walletClient = this.bwcProvider.getClient(null, opts);

    try {
      const c = JSON.parse(str);

      if (c.xPrivKey && c.xPrivKeyEncrypted) {
        this.logger.warn(
          'Found both encrypted and decrypted key. Deleting the encrypted version'
        );
        delete c.xPrivKeyEncrypted;
        delete c.mnemonicEncrypted;
      }

      str = JSON.stringify(c);

      walletClient.import(str, {
        compressed: opts.compressed,
        password: opts.password
      });
    } catch (err) {
      return Promise.reject(
        this.translate.instant('Could not import. Check input file.')
      );
    }

    const strParsed = JSON.parse(str);

    if (!strParsed.n) {
      return Promise.reject(
        'Backup format not recognized. If you are using a Copay Beta backup and version is older than 0.10, please see: https://github.com/bitpay/copay/issues/4730#issuecomment-244522614'
      );
    }

    const addressBook = strParsed.addressBook ? strParsed.addressBook : {};

    await this.storeInWalletGroup([].concat(walletClient), null, false);
    return this.addAndBindWalletClient(walletClient, {
      bwsurl: opts.bwsurl
    }).then(() => {
      this.events.publish('Local/WalletListChange');
      this.setMetaData(walletClient, addressBook)
        .then(() => {
          return Promise.resolve(walletClient);
        })
        .catch(err => {
          this.logger.warn('Could not set meta data: ', err);
          return Promise.reject(err);
        });
    });
  }

  public importWalletGroup(words, opts): Promise<any> {
    const options: Partial<WalletOptions> = opts || {};
    const promises = [];

    this.availableCoins.forEach(availableCoin => {
      const derivationPath = availableCoin.derivationPath;

      opts.networkName = this.derivationPathHelperProvider.getNetworkName(
        derivationPath
      );
      opts.derivationStrategy = this.derivationPathHelperProvider.getDerivationStrategy(
        derivationPath
      );
      opts.account = this.derivationPathHelperProvider.getAccount(
        derivationPath
      );

      opts.coin = availableCoin.coin;
      promises.push(
        this.importMnemonic(words, _.clone(opts), true) // ignore "no copayer found" error
      );
    });
    return Promise.all(promises).then(async walletClients => {
      walletClients = _.compact(walletClients);
      await this.storeInWalletGroup(walletClients, null, false);
      return this.addAndBindWalletClients(walletClients, {
        bwsurl: options.bwsurl
      });
    });
  }

  // An alert dialog
  private askPassword(warnMsg: string, title: string): Promise<any> {
    return new Promise(resolve => {
      const opts = {
        type: 'password',
        useDanger: true
      };
      this.popupProvider.ionicPrompt(title, warnMsg, opts).then(res => {
        return resolve(res);
      });
    });
  }

  private showWarningNoEncrypt(): Promise<any> {
    return new Promise(resolve => {
      const title = this.translate.instant('Are you sure?');
      const msg = this.translate.instant(
        'Without encryption, a thief or another application on this device may be able to access your funds.'
      );
      const okText = this.translate.instant("I'm sure");
      const cancelText = this.translate.instant('Go Back');
      this.popupProvider
        .ionicConfirm(title, msg, okText, cancelText)
        .then(res => {
          return resolve(res);
        });
    });
  }

  private checkIfCanSign(walletsArray: any[]): boolean {
    let canSign = true;
    walletsArray.forEach(wallet => {
      if (!wallet.canSign()) canSign = false;
    });
    return canSign;
  }

  private askToEncryptWallets(walletsArray: any[]): Promise<any> {
    return new Promise(resolve => {
      const canSign = this.checkIfCanSign(walletsArray);
      if (!canSign) return resolve();

      const title = this.translate.instant(
        'Would you like to protect this wallet with a password?'
      );
      const message = this.translate.instant(
        'Encryption can protect your funds if this device is stolen or compromised by malicious software.'
      );
      const okText = this.translate.instant('Yes');
      const cancelText = this.translate.instant('No');
      this.popupProvider
        .ionicConfirm(title, message, okText, cancelText)
        .then(res => {
          if (!res) {
            return this.showWarningNoEncrypt().then(res => {
              if (res) return resolve();
              return this.encrypt(walletsArray).then(() => {
                return resolve();
              });
            });
          }
          return this.encrypt(walletsArray).then(() => {
            return resolve();
          });
        });
    });
  }

  private encrypt(walletsArray: any[]): Promise<any> {
    return new Promise(resolve => {
      let title = this.translate.instant(
        'Enter a password to encrypt your wallet'
      );
      const warnMsg = this.translate.instant(
        'This password is only for this device, and it cannot be recovered. To avoid losing funds, write your password down.'
      );
      this.askPassword(warnMsg, title).then((password: string) => {
        if (!password) {
          this.showWarningNoEncrypt().then(res => {
            if (res) return resolve();
            this.encrypt(walletsArray).then(() => {
              return resolve();
            });
          });
        } else {
          title = this.translate.instant(
            'Enter your encrypt password again to confirm'
          );
          this.askPassword(warnMsg, title).then((password2: string) => {
            if (!password2 || password != password2) {
              this.encrypt(walletsArray).then(() => {
                return resolve();
              });
            } else {
              walletsArray.forEach(wallet => {
                wallet.encryptPrivateKey(password);
              });
              return resolve();
            }
          });
        }
      });
    });
  }

  private addAndBindWalletClients(walletsArray: any[], opts): Promise<any> {
    // Encrypt wallet
    this.onGoingProcessProvider.pause();
    return this.askToEncryptWallets(walletsArray).then(() => {
      this.onGoingProcessProvider.resume();
      const promises = [];

      // Will publish once all wallets are binded.
      opts.skipEvent = true;

      walletsArray.forEach(wallet => {
        promises.push(this.addAndBindWalletClient(_.clone(wallet), opts));
      });
      return Promise.all(promises)
        .then(walletClients => {
          this.events.publish('Local/WalletListChange');
          return Promise.resolve(walletClients);
        })
        .catch(() => {
          return Promise.reject('failed to bind wallets');
        });
    });
  }

  // Adds and bind a new client to the profile
  private async addAndBindWalletClient(wallet, opts): Promise<any> {
    if (!wallet || !wallet.credentials) {
      return Promise.reject(this.translate.instant('Could not access wallet'));
    }

    const walletId: string = wallet.credentials.walletId;

    if (!this.profile.addWallet(JSON.parse(wallet.export()))) {
      const message = this.replaceParametersProvider.replace(
        this.translate.instant('Wallet already in {{nameCase}}'),
        { nameCase: this.appProvider.info.nameCase }
      );
      return Promise.reject(message);
    }

    const skipKeyValidation: boolean = this.shouldSkipValidation(walletId);
    if (!skipKeyValidation) {
      this.logger.debug('Trying to runValidation: ' + walletId);
      this.runValidation(wallet);
    }

    await this.bindWalletClient(wallet);

    this.saveBwsUrl(walletId, opts);

    return this.persistenceProvider.storeProfile(this.profile).then(
      () => {
        if (!opts.skipEvent) this.events.publish('Local/WalletListChange');

        return Promise.resolve(wallet);
      },
      e => {
        this.logger.error('Could not save Profile(addAndBindWalletClient)', e);
        return Promise.reject(e);
      }
    );
  }

  private saveBwsUrl(walletId, opts): void {
    const defaults = this.configProvider.getDefaults();
    const bwsFor = {};
    bwsFor[walletId] = opts.bwsurl || defaults.bws.url;

    // Dont save the default
    if (bwsFor[walletId] == defaults.bws.url) {
      return;
    }

    this.configProvider.set({ bwsFor });
  }

  private shouldSkipValidation(walletId: string): boolean {
    return (
      this.profile.isChecked(this.platformProvider.ua, walletId) ||
      this.platformProvider.isIOS
    );
  }

  private setMetaData(wallet, addressBook): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getAddressBook(wallet.credentials.network)
        .then(localAddressBook => {
          try {
            localAddressBook = JSON.parse(localAddressBook);
          } catch (ex) {
            this.logger.info(
              'Address Book: JSON.parse not neccesary.',
              localAddressBook
            );
          }
          const mergeAddressBook = _.merge(addressBook, localAddressBook);
          this.persistenceProvider
            .setAddressBook(
            wallet.credentials.network,
            JSON.stringify(mergeAddressBook)
            )
            .then(() => {
              return resolve();
            })
            .catch(err => {
              return reject(err);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public importExtendedPrivateKey(xPrivKey: string, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Importing Wallet xPrivKey');
      const walletClient = this.bwcProvider.getClient(null, opts);

      walletClient.importFromExtendedPrivateKey(xPrivKey, opts, async err => {
        if (err) {
          if (err instanceof this.errors.NOT_AUTHORIZED) return reject(err);
          const msg = this.bwcErrorProvider.msg(
            err,
            this.translate.instant('Could not import')
          );
          return reject(msg);
        } else {
          await this.storeInWalletGroup([].concat(walletClient), null, false);
          this.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl
          })
            .then(wallet => {
              return resolve(wallet);
            })
            .catch(err => {
              return reject(err);
            });
        }
      });
    });
  }

  public normalizeMnemonic(words: string): string {
    if (!words || !words.indexOf) return words;

    // \u3000: A space of non-variable width: used in Chinese, Japanese, Korean
    const isJA = words.indexOf('\u3000') > -1;
    const wordList = words
      .trim()
      .toLowerCase()
      .split(/[\u3000\s]+/);

    return wordList.join(isJA ? '\u3000' : ' ');
  }

  public importMnemonic(
    words: string,
    opts,
    ignoreError?: boolean
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.logger.info('Importing Wallet Mnemonic');
      const walletClient = this.bwcProvider.getClient(null, opts);

      words = this.normalizeMnemonic(words);
      opts = {
        network: opts.networkName,
        passphrase: opts.passphrase,
        entropySourcePath: opts.entropySourcePath,
        derivationStrategy: opts.derivationStrategy || 'BIP44',
        account: opts.account || 0,
        coin: opts.coin
      };

      walletClient.importFromMnemonic(words, opts, err => {
        if (err) {
          if (err instanceof this.errors.NOT_AUTHORIZED) {
            if (ignoreError) {
              return resolve();
            } else {
              return reject(err);
            }
          }
          const msg = this.bwcErrorProvider.msg(
            err,
            this.translate.instant('Could not import')
          );
          return reject(msg);
        } else {
          return resolve(walletClient);
        }
      });
    });
  }


  private async storeInWalletGroup(
    walletClients,
    walletGroupId,
    needsBackup = true
  ) {
    // create default wallet group
    const defaultWalletGroup = {
      id: walletClients[0].credentials.walletId,
      name: walletClients[0].credentials.walletName,
      walletIds: [],
      needsBackup
    };

    let walletGroup = await this.getWalletGroup(walletGroupId);
    if (!walletGroup) walletGroup = defaultWalletGroup;

    walletClients.forEach(wallet => {
      walletGroup.walletIds.push(wallet.credentials.walletId);
    });

    return this.storeWalletGroup(walletGroup);
  }

  public importExtendedPublicKey(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Importing Wallet XPubKey');
      const walletClient = this.bwcProvider.getClient(null, opts);

      walletClient.importFromExtendedPublicKey(
        opts.extendedPublicKey,
        opts.externalSource,
        opts.entropySource,
        {
          account: opts.account || 0,
          derivationStrategy: opts.derivationStrategy || 'BIP44',
          coin: opts.coin
        },
        async err => {
          if (err) {
            // in HW wallets, req key is always the same. They can't addAccess.
            if (err instanceof this.errors.NOT_AUTHORIZED)
              err.name = 'WALLET_DOES_NOT_EXIST';

            const msg = this.bwcErrorProvider.msg(
              err,
              this.translate.instant('Could not import')
            );
            return reject(msg);
          }
          await this.storeInWalletGroup([].concat(walletClient), null, false);
          this.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl
          })
            .then(wallet => {
              return resolve(wallet);
            })
            .catch(err => {
              return reject(err);
            });
        }
      );
    });
  }

  public createProfile(): void {
    this.logger.info('Creating profile');
    this.profile = Profile.create();
    this.persistenceProvider.storeNewProfile(this.profile);
  }

  public bindProfile(profile): Promise<any> {
    const bindWallets = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const l = profile.credentials.length;
        let i = 0;
        let totalBound = 0;

        if (!l) {
          return resolve();
        }

        _.each(profile.credentials, credentials => {
          this.bindWallet(credentials)
            .then((bound: number) => {
              i++;
              totalBound += bound;
              if (i == l) {
                this.logger.info(
                  'Bound ' + totalBound + ' out of ' + l + ' wallets'
                );
                const completed = this.getWalletGroupMigrationFlag();
                if (!completed) this.setWalletGroupFlag();
                return resolve();
              }
            })
            .catch(err => {
              return reject(err);
            });
        });
      });
    };

    return bindWallets().then(() => {
      return this.isDisclaimerAccepted().catch(() => {
        return Promise.reject(
          new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer')
        );
      });
    });
  }

  public isDisclaimerAccepted(): Promise<any> {
    return new Promise((resolve, reject) => {
      const disclaimerAccepted =
        this.profile && this.profile.disclaimerAccepted;
      if (disclaimerAccepted) return resolve();

      // OLD flag
      this.persistenceProvider.getCopayDisclaimerFlag().then(val => {
        if (val) {
          this.profile.disclaimerAccepted = true;
          return resolve();
        } else {
          return reject();
        }
      });
    });
  }

  private bindWallet(credentials): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!credentials.walletId || !credentials.m) {
        return reject(new Error('bindWallet should receive credentials JSON'));
      }

      // Create the client
      const getBWSURL = (walletId: string) => {
        const config = this.configProvider.get();
        const defaults = this.configProvider.getDefaults();
        return (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url;
      };

      const walletClient = this.bwcProvider.getClient(
        JSON.stringify(credentials),
        {
          bwsurl: getBWSURL(credentials.walletId)
        }
      );

      const skipKeyValidation = this.shouldSkipValidation(credentials.walletId);
      if (!skipKeyValidation) {
        this.logger.debug('Trying to runValidation: ' + credentials.walletId);
        this.runValidation(walletClient, 500);
      }

      this.migrateToWalletGroup(walletClient);
      return resolve(this.bindWalletClient(walletClient));
    });
  }

  public loadAndBindProfile(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getProfile()
        .then(profile => {
          if (!profile) {
            return resolve();
          }

          this.profile = Profile.fromObj(profile);
          // Deprecated: storageService.tryToMigrate
          this.logger.info('Profile loaded');

          this.bindProfile(this.profile)
            .then(() => {
              return resolve(this.profile);
            })
            .catch(err => {
              return reject(err);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private seedWallet(opts?): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};
      const walletClient = this.bwcProvider.getClient(null, opts);
      const network = opts.networkName || 'livenet';

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
          return reject(
            this.translate.instant(
              'Could not create: Invalid wallet recovery phrase'
            )
          );
        }
      } else if (opts.extendedPrivateKey) {
        try {
          walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey, {
            network,
            account: opts.account || 0,
            derivationStrategy: opts.derivationStrategy || 'BIP44',
            coin: opts.coin
          });
        } catch (ex) {
          this.logger.warn(
            'Could not get seed from Extended Private Key: ',
            ex
          );
          return reject(
            this.translate.instant(
              'Could not create using the specified extended private key'
            )
          );
        }
      } else if (opts.extendedPublicKey) {
        try {
          walletClient.seedFromExtendedPublicKey(
            opts.extendedPublicKey,
            opts.externalSource,
            opts.entropySource,
            {
              account: opts.account || 0,
              derivationStrategy: opts.derivationStrategy || 'BIP44',
              coin: opts.coin
            }
          );
          walletClient.credentials.hwInfo = opts.hwInfo;
        } catch (ex) {
          this.logger.warn(
            'Creating wallet from Extended Public Key Arg:',
            ex,
            opts
          );
          return reject(
            this.translate.instant(
              'Could not create using the specified extended public key'
            )
          );
        }
      } else {
        const lang = this.languageProvider.getCurrent();
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
  private doCreateWallet(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const showOpts = _.clone(opts);
      if (showOpts.extendedPrivateKey) showOpts.extendedPrivateKey = '[hidden]';
      if (showOpts.mnemonic) showOpts.mnemonic = '[hidden]';

      this.logger.debug('Creating Wallet:', JSON.stringify(showOpts));
      setTimeout(() => {
        this.seedWallet(opts)
          .then(walletClient => {
            const coin = opts.coin == 'btc' ? '[BTC]' : '[BCH]';
            const name =
              opts.name ||
              `${this.translate.instant('Personal Wallet')} ${coin}`;
            const myName = opts.myName || this.translate.instant('me');

            walletClient.createWallet(
              name,
              myName,
              opts.m,
              opts.n,
              {
                network: opts.networkName,
                singleAddress: opts.singleAddress,
                walletPrivKey: opts.walletPrivKey,
                coin: opts.coin
              },
              err => {
                if (err) {
                  const msg = this.bwcErrorProvider.msg(
                    err,
                    this.translate.instant('Error creating wallet')
                  );
                  return reject(msg);
                } else {
                  return resolve(walletClient);
                }
              }
            );
          })
          .catch(err => {
            return reject(err);
          });
      }, 50);
    });
  }

  public async joinWallet(walletGroupId, opts): Promise<any> {
    let password;
    if (walletGroupId) {
      const w = this.getWallet(walletGroupId);
      const k = await this.walletProvider.getMnemonicAndPassword(w);
      const mnemonic = k.mnemonic;
      password = k.password;
      opts.mnemonic = mnemonic;
    }
    return this.doJoinWallet(opts).then(async walletClient => {
      await this.storeInWalletGroup([].concat(walletClient), walletGroupId);
      if (!walletGroupId) {
        // Only ask to encrypt wallet if is the first wallet in walletGroup
        this.onGoingProcessProvider.pause();
        await this.askToEncryptWallets([].concat(walletClient));
        this.onGoingProcessProvider.resume();
      } else if (password) {
        // If already encrypted encrypt new wallet
        walletClient.encryptPrivateKey(password);
      }
      return this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      }).then(wallet => {
        this.events.publish('Local/WalletListChange');
        return Promise.resolve(wallet);
      });
    });
  }

  public doJoinWallet(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Joining Wallet...');

      let walletData;
      try {
        walletData = this.bwcProvider.parseSecret(opts.secret);

        // check if exist
        if (
          _.find(this.profile.credentials, {
            walletId: walletData.walletId
          })
        ) {
          return reject(
            this.translate.instant('Cannot join the same wallet more that once')
          );
        }
      } catch (ex) {
        this.logger.error(ex);
        return reject(this.translate.instant('Bad wallet invitation'));
      }
      opts.networkName = walletData.network;
      this.logger.debug('Joining Wallet:', opts);

      this.seedWallet(opts)
        .then(walletClient => {
          walletClient.joinWallet(
            opts.secret,
            opts.myName || 'me',
            {
              coin: opts.coin
            },
            err => {
              if (err) {
                const msg = this.bwcErrorProvider
                  .msg(err, this.translate.instant('Could not join wallet'));
                return reject(msg);
              }
              return resolve(walletClient);
            }
          );
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getWallet(walletId: string) {
    return this.wallet[walletId];
  }

  public deleteWalletClient(wallet): Promise<any> {
    this.logger.info('Deleting Wallet:', wallet.credentials.walletName);
    const walletId = wallet.credentials.walletId;

    wallet.removeAllListeners();
    this.profile.deleteWallet(walletId);

    delete this.wallet[walletId];
    this.persistenceProvider.removeAllWalletData(walletId);
    this.events.publish('Local/WalletListChange');

    return this.persistenceProvider.storeProfile(this.profile);
  }


  public async deleteGroupWallets(wallets, walletGroupId): Promise<any> {
    const promises = [];
    wallets.forEach(wallet => {
      promises.push(this.deleteWalletClient(wallet));
    });
    return Promise.all(promises).then(() => {
      this.events.publish('Local/WalletListChange');
      return this.persistenceProvider.deleteWalletGroup(walletGroupId);
    });
  }

  public async createWallet(walletGroupId, opts): Promise<any> {
    let password;
    if (walletGroupId) {
      const w = this.getWallet(walletGroupId);
      const k = await this.walletProvider.getMnemonicAndPassword(w);
      const mnemonic = k.mnemonic;
      password = k.password;
      opts.mnemonic = mnemonic;
    }
    return this.doCreateWallet(opts).then(async walletClient => {
      await this.storeInWalletGroup([].concat(walletClient), walletGroupId);
      if (!walletGroupId) {
        // Only ask to encrypt wallet if is the first wallet in walletGroup
        this.onGoingProcessProvider.pause();
        await this.askToEncryptWallets([].concat(walletClient));
        this.onGoingProcessProvider.resume();
      } else if (password) {
        // If already encrypted encrypt new wallet
        walletClient.encryptPrivateKey(password);
      }
      return this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      });
    });
  }

  public setDisclaimerAccepted(): Promise<any> {
    this.profile.disclaimerAccepted = true;
    return this.persistenceProvider.storeProfile(this.profile);
  }

  public setLastKnownBalance() {
    // Add cached balance async
    _.each(_.values(this.wallet), x => {
      this.persistenceProvider.getLastKnownBalance(x.id).then(datum => {
        // this.logger.debug("Last known balance for ",x.id,datum);
        datum = datum || {};
        let limit = Math.floor(Date.now() / 1000) - 2 * 60;
        let { balance = null, updatedOn = null } = datum;
        x.lastKnownBalance = balance;
        x.lastKnownBalanceUpdatedOn = updatedOn < limit ? updatedOn : null;
      });
    });
  }

  public getWallets(opts?) {
    if (opts && !_.isObject(opts)) throw new Error('bad argument');

    opts = opts || {};

    let ret = _.values(this.wallet);

    if (opts.coin) {
      ret = _.filter(ret, x => {
        return x.credentials.coin == opts.coin;
      });
    }

    if (opts.network) {
      ret = _.filter(ret, x => {
        return x.credentials.network == opts.network;
      });
    }

    if (opts.n) {
      ret = _.filter(ret, w => {
        return w.credentials.n == opts.n;
      });
    }

    if (opts.m) {
      ret = _.filter(ret, w => {
        return w.credentials.m == opts.m;
      });
    }

    if (opts.onlyComplete) {
      ret = _.filter(ret, w => {
        return w.isComplete();
      });
    }

    if (opts.minAmount) {
      ret = _.filter(ret, w => {
        // IF no cached Status => return true!
        if (_.isEmpty(w.cachedStatus)) return true;

        return w.cachedStatus.availableBalanceSat > opts.minAmount;
      });
    }

    if (opts.hasFunds) {
      ret = _.filter(ret, w => {
        // IF no cached Status => return true!
        if (_.isEmpty(w.cachedStatus)) return true;

        return w.cachedStatus.availableBalanceSat > 0;
      });
    }
    return _.sortBy(ret, 'order');
  }

  public toggleHideBalanceFlag(walletId: string): void {
    this.wallet[walletId].balanceHidden = !this.wallet[walletId].balanceHidden;
    this.persistenceProvider.setHideBalanceFlag(
      walletId,
      this.wallet[walletId].balanceHidden
    );
  }

  public getTxps(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const MAX = 100;
      opts = opts ? opts : {};

      const w = this.getWallets();
      if (_.isEmpty(w)) {
        return reject('No wallets available');
      }

      let txps = [];

      _.each(w, x => {
        if (x.pendingTxps) txps = txps.concat(x.pendingTxps);
      });
      const n = txps.length;
      txps = _.sortBy(txps, 'createdOn').reverse();
      txps = _.compact(_.flatten(txps)).slice(0, opts.limit || MAX);
      return resolve({ txps, n });
    });
  }

  public storeWalletGroup(walletGroup) {
    return this.persistenceProvider.storeWalletGroup(walletGroup);
  }

  public getWalletGroup(id: string) {
    return this.persistenceProvider.getWalletGroup(id);
  }

  public getWalletGroups(): Promise<any> {
    return this.getAllWalletsGroups().then(walletGroups => {
      walletGroups = _.compact(walletGroups);
      this.getWallets().forEach(w => {
        walletGroups.forEach(walletGroup => {
          walletGroup.wallets = walletGroup.wallets || [];
          if (
            this.walletIncludedInGroup(
              w.credentials.walletId,
              walletGroup.walletIds
            )
          ) {
            walletGroup.wallets.push(w);
          }
        });
      });
      return Promise.resolve(walletGroups);
    });
  }

  public getAllWalletsGroups() {
    const wallets = this.getWallets();
    const promises = _.map(wallets, async (w: any) => {
      return this.getWalletGroup(w.id);
    });
    return Promise.all(promises);
  }

  public async getGroupWallets(id) {
    const wallets = this.getWallets();
    const walletGroup = await this.getWalletGroup(id);
    const groupWallets = _.filter(wallets, (x: any) => {
      return this.walletIncludedInGroup(
        x.credentials.walletId,
        walletGroup.walletIds
      );
    });
    return groupWallets;
  }

  public walletIncludedInGroup(walletId: string, walletIds): boolean {
    return walletIds.includes(walletId);
  }

  private migrateToWalletGroup(walletClient) {
    const completed = this.getWalletGroupMigrationFlag();
    if (completed) return;

    this.logger.info(
      `Migrating wallet ${walletClient.credentials.walletId} to new group model`
    );
    // create default wallet group
    const defaultWalletGroup = {
      id: walletClient.credentials.walletId,
      name: walletClient.credentials.walletName,
      walletIds: [walletClient.credentials.walletId],
      needsBackup: walletClient.needsBackup
    };

    this.storeWalletGroup(defaultWalletGroup);
  }

  public getWalletGroupMigrationFlag() {
    const walletGroupMigrationFlag =
      this.profile && this.profile.walletGroupMigrationFlag;
    return walletGroupMigrationFlag;
  }

  public setWalletGroupFlag() {
    this.profile.walletGroupMigrationFlag = true;
    this.persistenceProvider.storeProfile(this.profile);
  }
}
