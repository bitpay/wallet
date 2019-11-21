import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs';

// providers
import { DerivationPathHelperProvider } from '../../providers/derivation-path-helper/derivation-path-helper';
import { ActionSheetProvider } from '../action-sheet/action-sheet';
import { AppProvider } from '../app/app';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { CurrencyProvider } from '../currency/currency';
import { KeyProvider } from '../key/key';
import { LanguageProvider } from '../language/language';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { ReplaceParametersProvider } from '../replace-parameters/replace-parameters';
import { TxFormatProvider } from '../tx-format/tx-format';
import { WalletOptions } from '../wallet/wallet';

// models
import { Profile } from '../../models/profile/profile.model';

interface WalletGroups {
  [keyId: string]: {
    name?: string;
    needsBackup?: boolean;
    order?: number;
    isPrivKeyEncrypted?: boolean;
    canSign?: boolean;
    isDeletedSeed?: boolean;
  };
}

export interface WalletBindTypeOpts {
  bwsurl?: string;
  store?: boolean;
}

@Injectable()
export class ProfileProvider {
  public walletsGroups: WalletGroups = {}; // TODO walletGroups Class
  public wallet: any = {};
  public profile: Profile;

  public UPDATE_PERIOD = 15;
  public UPDATE_PERIOD_FAST = 5;
  private throttledBwsEvent;
  private validationLock: boolean = false;
  private errors = this.bwcProvider.getErrors();

  constructor(
    private currencyProvider: CurrencyProvider,
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
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider,
    private keyProvider: KeyProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider
  ) {
    this.throttledBwsEvent = _.throttle((n, wallet) => {
      this.newBwsEvent(n, wallet);
    }, 10000);
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

    // for token wallets
    wallet.linkedEthWallet = this.currencyProvider.getLinkedEthWallet(
      wallet.coin,
      wallet.id
    );

    if (wallet.linkedEthWallet) {
      let linked = this.getWallet(wallet.linkedEthWallet);
      if (linked) {
        wallet.linkedEthWalletName =
          (config.aliasFor && config.aliasFor[linked.id]) ||
          linked.credentials.walletName;
      }
    }
  }

  public setWalletOrder(walletId: string, index: number): void {
    this.persistenceProvider.setWalletOrder(walletId, index).then(() => {
      this.logger.debug(
        'Wallet new order stored for ' + walletId + ': ' + index
      );
    });
    if (this.wallet[walletId]) this.wallet[walletId]['order'] = index;
  }

  public setWalletGroupName(keyId: string, name: string): void {
    this.persistenceProvider.setWalletGroupName(keyId, name);
    if (this.walletsGroups[keyId]) this.walletsGroups[keyId].name = name;
  }

  public async getWalletGroupName(keyId: string) {
    const name = await this.persistenceProvider.getWalletGroupName(keyId);
    return name;
  }

  private async getWalletOrder(walletId: string) {
    const order = await this.persistenceProvider.getWalletOrder(walletId);
    return order;
  }

  public setBackupGroupFlag(
    keyId: string,
    timestamp?: string,
    migrating?: boolean
  ): void {
    if (!keyId) return;
    this.persistenceProvider.setBackupGroupFlag(keyId, timestamp);
    this.logger.debug('Backup flag stored');
    if (!migrating) this.walletsGroups[keyId].needsBackup = false;
  }

  public setWalletBackup(walletId: string): void {
    this.wallet[walletId].needsBackup = false;
  }

  private requiresGroupBackup(keyId: string) {
    let k = this.keyProvider.getKey(keyId);
    if (!k) return false;
    if (!k.mnemonic && !k.mnemonicEncrypted) return false;
    return true;
  }

  private requiresBackup(wallet) {
    let k = this.keyProvider.getKey(wallet.credentials.keyId);
    if (!k) return false;
    if (!k.mnemonic && !k.mnemonicEncrypted) return false;
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

  private getBackupGroupInfo(keyId, wallet?): Promise<any> {
    if (!this.requiresGroupBackup(keyId)) {
      return Promise.resolve({ needsBackup: false });
    }
    return this.persistenceProvider
      .getBackupGroupFlag(keyId)
      .then(async timestamp => {
        if (timestamp) {
          return Promise.resolve({ needsBackup: false, timestamp });
        } else {
          const backupInfo = await this.getBackupInfo(wallet);
          if (backupInfo && !backupInfo.needsBackup) {
            this.setBackupGroupFlag(keyId, backupInfo.timestamp, true);
            return Promise.resolve({
              needsBackup: false,
              timestamp: backupInfo.timestamp
            });
          }
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

  private isWalletHidden(wallet): Promise<boolean> {
    return new Promise(resolve => {
      this.persistenceProvider
        .getHideWalletFlag(wallet.credentials.walletId)
        .then(shouldHideWallet => {
          const isHidden =
            shouldHideWallet && shouldHideWallet.toString() == 'true'
              ? true
              : false;
          return resolve(isHidden);
        })
        .catch(err => {
          this.logger.error(err);
        });
    });
  }

  private async bindWalletClient(wallet): Promise<boolean> {
    const walletId = wallet.credentials.walletId;
    let keyId = wallet.credentials.keyId;
    if (this.wallet[walletId] && this.wallet[walletId].started) {
      this.logger.info('This wallet has been initialized. Skip. ' + walletId);
      return Promise.resolve(false);
    }

    // Workaround to avoid wrong order relatad to async functions
    if (keyId) this.walletsGroups[keyId] = {};
    this.wallet[walletId] = {};

    // INIT WALLET VIEWMODEL
    wallet.id = walletId;
    wallet.started = true;
    wallet.network = wallet.credentials.network;
    wallet.copayerId = wallet.credentials.copayerId;
    wallet.m = wallet.credentials.m;
    wallet.n = wallet.credentials.n;
    wallet.coin = wallet.credentials.coin;
    wallet.cachedStatus = {};
    wallet.balanceHidden = await this.isBalanceHidden(wallet);
    wallet.order = await this.getWalletOrder(wallet.id);
    wallet.hidden = await this.isWalletHidden(wallet);
    wallet.canSign = keyId ? true : false;
    wallet.isPrivKeyEncrypted = wallet.canSign
      ? this.keyProvider.isPrivKeyEncrypted(keyId)
      : false;
    wallet.canAddNewAccount = this.checkAccountCreation(wallet, keyId);

    this.updateWalletFromConfig(wallet);
    this.wallet[walletId] = wallet;

    // INIT WALLET GROUP VIEWMODEL

    let groupBackupInfo,
      needsBackup,
      order,
      name,
      isPrivKeyEncrypted,
      canSign,
      isDeletedSeed;

    if (keyId) {
      groupBackupInfo = await this.getBackupGroupInfo(keyId, wallet);
      needsBackup = groupBackupInfo.needsBackup;
      isPrivKeyEncrypted = this.keyProvider.isPrivKeyEncrypted(keyId);
      canSign = true;
      isDeletedSeed = this.keyProvider.isDeletedSeed(keyId);
      name = await this.getWalletGroupName(keyId);
      if (!name) {
        let walletsGroups = _.cloneDeep(this.walletsGroups);
        delete walletsGroups['read-only'];

        // use wallets name for wallets group name at migration
        name = `Key ${Object.keys(walletsGroups).indexOf(keyId) + 1}`;
      }
    } else {
      keyId = 'read-only';
      needsBackup = false;
      name = 'Read Only Wallets';
      isPrivKeyEncrypted = false;
      canSign = false;
      isDeletedSeed = true;
    }

    wallet.needsBackup = needsBackup;
    wallet.keyId = keyId;
    wallet.walletGroupName = name;

    this.walletsGroups[keyId] = {
      order,
      name,
      isPrivKeyEncrypted,
      needsBackup,
      canSign,
      isDeletedSeed
    };

    let date;
    if (groupBackupInfo && groupBackupInfo.timestamp)
      date = new Date(Number(groupBackupInfo.timestamp));

    this.logger.info(
      `Binding wallet: ${wallet.id} - Backed up: ${!needsBackup} ${
        date ? date : ''
      } - Encrypted: ${wallet.isPrivKeyEncrypted} - Token: ${!!wallet
        .credentials.token}`
    );

    // If this is a token wallet, no need to initialize the rest
    if (wallet.credentials.token) {
      return Promise.resolve(true);
    }
    wallet.removeAllListeners();
    wallet.on('report', n => {
      this.logger.info('BWC Report:' + n);
    });

    wallet.on('notification', n => {
      if (this.platformProvider.isElectron) {
        this.showDesktopNotifications(n, wallet);
      }

      if (
        (n.data.network && n.data.network != wallet.network) ||
        (n.data.coin && n.data.coin != wallet.coin)
      )
        return;

      // TODO many NewBlocks notifications...if many blocks
      if (n.type == 'NewBlock' && n.data.network == 'testnet') {
        this.throttledBwsEvent(n, wallet);
      } else {
        this.newBwsEvent(n, wallet);
      }
    });

    wallet.on('walletCompleted', () => {
      this.logger.debug('Wallet completed');
      this.updateCredentials(JSON.parse(wallet.toString()));
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
        wallet.openWallet(() => {});
      }
    );
    this.events.subscribe('Local/ConfigUpdate', opts => {
      this.logger.debug('Local/ConfigUpdate handler @profile', opts);

      if (opts.walletId && opts.walletId == wallet.id) {
        this.logger.debug('Updating wallet from config ' + wallet.id);
        this.updateWalletFromConfig(wallet);
      }
    });
    return Promise.resolve(true);
  }

  public checkAccountCreation(wallet, keyId: string): boolean {
    /* Allow account creation only for wallets:
    wallet n=1 : BIP44 - P2PKH - BTC o BCH only if it is 145'
    wallet n>1 : BIP48 - P2SH - BTC o BCH only if it is 145'
    wallet n=1 : BIP44 - P2SH - ETH only if it is 60'
    key : !use44forMultisig - !use0forBCH - compliantDerivation - !BIP45
    */

    const key = this.keyProvider.getKey(keyId);

    if (!wallet) {
      return false;
    } else if (!key) {
      return false;
    } else if (
      key.use44forMultisig ||
      key.use0forBCH ||
      key.BIP45 ||
      key.compliantDerivation === false
    ) {
      return false;
    } else {
      const derivationStrategy = this.derivationPathHelperProvider.getDerivationStrategy(
        wallet.credentials.rootPath
      );

      const coinCode = this.derivationPathHelperProvider.parsePath(
        wallet.credentials.rootPath
      ).coinCode;

      if (
        wallet.n == 1 &&
        wallet.credentials.addressType == 'P2PKH' &&
        derivationStrategy == 'BIP44' &&
        (wallet.coin == 'btc' || (wallet.coin == 'bch' && coinCode == "145'"))
      ) {
        return true;
      }
      if (
        wallet.n > 1 &&
        wallet.credentials.addressType == 'P2SH' &&
        derivationStrategy == 'BIP48' &&
        (wallet.coin == 'btc' || (wallet.coin == 'bch' && coinCode == "145'"))
      ) {
        return true;
      }
      if (
        wallet.n == 1 &&
        wallet.credentials.addressType == 'P2PKH' &&
        derivationStrategy == 'BIP44' &&
        (wallet.coin == 'eth' && coinCode == "60'")
      ) {
        return true;
      }
      return false;
    }
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
    this.storeProfileIfDirty();
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
      `ValidatingWallet: ${walletId} skip Device: ${skipDeviceValidation}`
    );
    setTimeout(() => {
      wallet.validateKeyDerivation(
        {
          skipDeviceValidation
        },
        (_, isOK) => {
          this.validationLock = false;

          this.logger.debug(`ValidatingWallet End: ${walletId} isOK: ${isOK}`);
          if (isOK) {
            this.profile.setChecked(this.platformProvider.ua, walletId);
          } else {
            this.logger.warn(`Key Derivation failed for wallet: ${walletId}`);
            this.persistenceProvider.clearLastAddress(walletId);
          }
          this.storeProfileIfDirty();
        }
      );
    }, delay);
  }

  public storeProfileLegacy(oldProfile) {
    this.persistenceProvider
      .storeProfileLegacy(oldProfile)
      .then(() => {
        this.logger.debug('Saved legacy Profile');
      })
      .catch(err => {
        this.logger.error('Could not save legacy Profile', err);
      });
  }

  public storeProfileIfDirty(): Promise<any> {
    if (!this.profile.dirty) {
      return Promise.resolve();
    }
    return this.persistenceProvider
      .storeProfile(this.profile)
      .then(() => {
        this.logger.debug('Saved modified Profile (Dirty)');
        return Promise.resolve();
      })
      .catch(err => {
        this.logger.error('Could not save Profile (Dirty)', err);
        return Promise.reject(err);
      });
  }

  private askToEncryptKey(key): Promise<any> {
    if (!key) return Promise.resolve();
    if (key.isPrivKeyEncrypted()) return Promise.resolve();

    const title = this.translate.instant(
      'Would you like to protect this wallet with a password?'
    );
    const message = this.translate.instant(
      'Encryption can protect your funds if this device is stolen or compromised by malicious software.'
    );
    const okText = this.translate.instant('Yes');
    const cancelText = this.translate.instant('No');
    return this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then(res => {
        if (!res) {
          return this.keyProvider.showWarningNoEncrypt().then(res => {
            if (res) return Promise.resolve();
            return this.keyProvider.encryptNewKey(key);
          });
        }
        return this.keyProvider.encryptNewKey(key);
      });
  }

  private addAndBindWalletClients(data, opts = { bwsurl: null }): Promise<any> {
    // Encrypt wallet
    this.onGoingProcessProvider.pause();
    return this.askToEncryptKey(data.key).then(() => {
      this.onGoingProcessProvider.resume();
      const promises = [];
      data.walletClients.forEach(walletClient => {
        promises.push(
          this.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl,
            store: false
          })
        );
      });

      return this.keyProvider.addKey(data.key).then(() => {
        return Promise.all(promises)
          .then(walletClients => {
            return this.storeProfileIfDirty().then(() => {
              this.events.publish('Local/WalletListChange');
              return this.checkIfAlreadyExist(walletClients).then(() => {
                return Promise.resolve(_.compact(walletClients));
              });
            });
          })
          .catch(err => {
            return Promise.reject('failed to bind wallets:' + err);
          });
      });
    });
  }

  private checkIfAlreadyExist(walletClients: any[]): Promise<any> {
    return new Promise(resolve => {
      const countInArray = _.filter(walletClients, item => item == undefined)
        .length;
      if (countInArray > 0) {
        const msg1 = this.replaceParametersProvider.replace(
          this.translate.instant('The wallet is already in the app'),
          { nameCase: this.appProvider.info.nameCase }
        );
        const msg2 = this.replaceParametersProvider.replace(
          this.translate.instant(
            '{{countInArray}} of your wallets already exist in {{nameCase}}'
          ),
          {
            countInArray,
            nameCase: this.appProvider.info.nameCase
          }
        );
        const msg = countInArray == 1 ? msg1 : msg2;
        const title = this.translate.instant('Error');
        const infoSheet = this.actionSheetProvider.createInfoSheet(
          'default-error',
          { msg, title }
        );
        infoSheet.present();
        infoSheet.onDidDismiss(() => {
          return resolve();
        });
      } else {
        return resolve();
      }
    });
  }

  // Adds and bind a new client to the profile
  private async addAndBindWalletClient(
    wallet,
    opts: WalletBindTypeOpts = { bwsurl: null, store: true }
  ): Promise<any> {
    if (!wallet || !wallet.credentials) {
      return Promise.reject(this.translate.instant('Could not access wallet'));
    }

    const walletId: string = wallet.credentials.walletId;

    if (!this.profile.addWallet(JSON.parse(wallet.toString()))) {
      return Promise.resolve();
    }

    const skipKeyValidation: boolean = this.shouldSkipValidation(walletId);
    if (!skipKeyValidation) {
      this.logger.debug('Trying to runValidation: ' + walletId);
      await this.runValidation(wallet);
    }

    this.saveBwsUrl(walletId, opts.bwsurl);
    return this.bindWalletClient(wallet).then(() => {
      if (!opts.store) {
        this.logger.debug('No storing new walletClient');
        return Promise.resolve(wallet);
      } else {
        this.logger.debug('Storing new walletClient');
        return this.storeProfileIfDirty().then(() => {
          this.events.publish('Local/WalletListChange');
          return Promise.resolve(wallet);
        });
      }
    });
  }

  private saveBwsUrl(walletId, bwsurl: string = null): void {
    const defaults = this.configProvider.getDefaults();
    const bwsFor = {};
    bwsFor[walletId] = bwsurl || defaults.bws.url;

    // Dont save the default
    if (bwsFor[walletId] == defaults.bws.url) {
      return;
    }

    this.configProvider.set({ bwsFor });
  }

  private shouldSkipValidation(walletId: string): boolean {
    return (
      true ||
      this.profile.isChecked(this.platformProvider.ua, walletId) ||
      this.platformProvider.isIOS
    ); // disabled for now
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
    this.logger.info('Importing Wallet xPrivKey');
    opts.xPrivKey = xPrivKey;
    return this.serverAssistedImport(opts).then(data => {
      return this.addAndBindWalletClients(data, {
        bwsurl: opts.bwsurl
      });
    });
  }

  public importMnemonic(words, opts): Promise<any> {
    this.logger.info('Importing Wallets Mnemonic');
    words = this.normalizeMnemonic(words);
    opts.words = words;
    return this.serverAssistedImport(opts).then(data => {
      return this.addAndBindWalletClients(data, {
        bwsurl: opts.bwsurl
      });
    });
  }

  public importFile(str: string, opts): Promise<any> {
    return this._importFile(str, opts).then(data => {
      this.onGoingProcessProvider.pause();
      return this.askToEncryptKey(data.key).then(() => {
        this.onGoingProcessProvider.resume();
        return this.keyProvider.addKey(data.key).then(() => {
          return this.addAndBindWalletClient(data.walletClient, {
            bwsurl: opts.bwsurl
          }).then(walletClient => {
            return this.checkIfAlreadyExist([].concat(walletClient)).then(
              () => {
                return Promise.resolve(walletClient);
              }
            );
          });
        });
      });
    });
  }

  private _importFile(str: string, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};
      opts['bp_partner'] = this.appProvider.info.name;
      opts['bp_partner_version'] = this.appProvider.info.version;
      this.logger.info('Importing Wallet:', opts);
      const client = this.bwcProvider.getClient(null, opts);
      let credentials;
      let key;
      let addressBook;
      const Key = this.bwcProvider.getKey();

      const data = JSON.parse(str);
      if (data.credentials) {
        try {
          credentials = data.credentials;
          if (data.key) {
            key = Key.fromObj(data.key);
          }
          addressBook = data.addressBook;
        } catch (err) {
          this.logger.error(err);
          return reject(
            this.translate.instant('Could not import. Check input file.')
          );
        }
      } else {
        // old format ? root = credentials.
        try {
          // needs to migrate?
          if (data.xPrivKey && data.xPrivKeyEncrypted) {
            this.logger.warn(
              'Found both encrypted and decrypted key. Deleting the encrypted version'
            );
            delete data.xPrivKeyEncrypted;
            delete data.mnemonicEncrypted;
          }

          let migrated = this.bwcProvider.upgradeCredentialsV1(data);
          credentials = migrated.credentials;
          key = migrated.key;
          addressBook = data.addressBook ? data.addressBook : {};
        } catch (error) {
          this.logger.error(error);
          return reject(
            this.translate.instant('Could not import. Check input file.')
          );
        }
      }

      if (!credentials.n) {
        return reject(
          'Backup format not recognized. If you are using a Copay Beta backup and version is older than 0.10, please see: https://github.com/bitpay/copay/issues/4730#issuecomment-244522614'
        );
      }

      client.fromString(JSON.stringify(credentials));

      if (key) {
        this.logger.info(`Wallet ${credentials.walletId} key's extracted`);
      } else {
        this.logger.info(`READ-ONLY Wallet ${credentials.walletId} migrated`);
      }

      this.setMetaData(client, addressBook).catch(err => {
        this.logger.warn('Could not set meta data: ', err);
      });

      return resolve({ key, walletClient: client });
    });
  }

  // opts.words opts.xPrivKey
  private serverAssistedImport(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bwcProvider.Client.serverAssistedImport(
        opts,
        {
          baseUrl: opts.bwsurl // clientOpts
        },
        (err, key, walletClients) => {
          if (err) {
            return reject(err);
          }
          if (walletClients.length === 0) {
            return reject('WALLET_DOES_NOT_EXIST');
          } else {
            return resolve({ key, walletClients });
          }
        }
      );
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

  public createProfile(): void {
    this.logger.info('Creating profile');
    this.profile = Profile.create();
    this.persistenceProvider.storeNewProfile(this.profile);
  }

  private bindProfile(profile): Promise<any> {
    const bindWallets = (): Promise<any> => {
      const profileLength = profile.credentials.length;

      if (!profileLength) {
        return Promise.resolve();
      }

      const promises = [];

      return this.upgradeMultipleCredentials(profile).then(() => {
        _.each(profile.credentials, credentials => {
          promises.push(this.bindWallet(credentials));
        });

        return Promise.all(promises).then(() => {
          this.logger.info(`Bound ${profileLength} wallets`);
          return Promise.resolve();
        });
      });
    };

    return bindWallets().then(() => {
      return this.isDisclaimerAccepted().catch(() => {
        return Promise.reject(new Error('NONAGREEDDISCLAIMER'));
      });
    });
  }

  private upgradeMultipleCredentials(profile): Promise<any> {
    const oldProfile = _.clone(profile);
    const migrated = this.bwcProvider.upgradeMultipleCredentialsV1(
      profile.credentials
    );

    const newKeys = migrated.keys;
    const newCrededentials = migrated.credentials;

    if (newKeys.length > 0) {
      this.logger.info(`Storing ${newKeys.length} migrated Keys`);
      this.storeProfileLegacy(oldProfile);
      return this.keyProvider.addKeys(newKeys).then(() => {
        profile.credentials = newCrededentials;
        profile.dirty = true;
        return this.storeProfileIfDirty();
      });
    } else {
      if (newCrededentials.length > 0) {
        // Only RO wallets.
        this.storeProfileLegacy(oldProfile);

        profile.credentials = newCrededentials;
        profile.dirty = true;
        return this.storeProfileIfDirty();
      }
      return Promise.resolve();
    }
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

  private async bindWallet(credentials): Promise<any> {
    if (!credentials.walletId || !credentials.m) {
      return Promise.reject(
        new Error('bindWallet should receive credentials JSON')
      );
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
        bwsurl: getBWSURL(credentials.walletId),
        bp_partner: this.appProvider.info.name,
        bp_partner_version: this.appProvider.info.version
      }
    );

    const skipKeyValidation = this.shouldSkipValidation(credentials.walletId);
    if (!skipKeyValidation) {
      this.logger.debug('Trying to runValidation: ' + credentials.walletId);
      await this.runValidation(walletClient, 500);
    }
    return this.bindWalletClient(walletClient);
  }

  public getProfileLegacy(): Promise<any> {
    return this.persistenceProvider.getProfileLegacy().catch(err => {
      this.logger.info('Error getting old Profile', err);
    });
  }

  public removeProfileLegacy(): Promise<any> {
    return this.persistenceProvider.removeProfileLegacy().catch(err => {
      this.logger.info('Error getting old Profile', err);
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

  public importWithDerivationPath(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Importing Wallet with derivation path');
      this._importWithDerivationPath(opts).then(data => {
        // Check if wallet exists
        data.walletClient.openWallet(err => {
          if (err) {
            if (err.message.indexOf('not found') > 0) {
              err = 'WALLET_DOES_NOT_EXIST';
            }
            return reject(err);
          }
          this.keyProvider.addKey(data.key).then(() => {
            this.addAndBindWalletClient(data.walletClient, {
              bwsurl: opts.bwsurl
            })
              .then(walletClient => {
                return this.checkIfAlreadyExist([].concat(walletClient)).then(
                  () => {
                    return resolve(walletClient);
                  }
                );
              })
              .catch(err => {
                return reject(err);
              });
          });
        });
      });
    });
  }

  private _importWithDerivationPath(opts): Promise<any> {
    const showOpts = _.clone(opts);
    if (showOpts.extendedPrivateKey) showOpts.extendedPrivateKey = '[hidden]';
    if (showOpts.mnemonic) showOpts.mnemonic = '[hidden]';

    this.logger.debug('Importing Wallet:', JSON.stringify(showOpts));
    return this.seedWallet(opts);
  }

  private seedWallet(opts?): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};
      opts['bp_partner'] = this.appProvider.info.name;
      opts['bp_partner_version'] = this.appProvider.info.version;

      // Token wallet?
      if (opts.pairedWallet) {
        return resolve();
      }

      const walletClient = this.bwcProvider.getClient(null, opts);
      const network = opts.networkName || 'livenet';
      const Key = this.bwcProvider.getKey();
      let key;
      if (opts.mnemonic) {
        try {
          opts.mnemonic = this.normalizeMnemonic(opts.mnemonic);
          key = Key.fromMnemonic(opts.mnemonic, {
            useLegacyCoinType: opts.useLegacyCoinType,
            useLegacyPurpose: opts.useLegacyPurpose,
            passphrase: opts.passphrase
          });
          walletClient.fromString(
            key.createCredentials(opts.password, {
              coin: opts.coin,
              network,
              account: opts.account || 0,
              addressType: opts.addressType,
              n: opts.n || 1
            })
          );
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
          key = Key.fromExtendedPrivateKey(opts.extendedPrivateKey, {
            useLegacyCoinType: opts.useLegacyCoinType,
            useLegacyPurpose: opts.useLegacyPurpose
          });
          walletClient.fromString(
            key.createCredentials(null, {
              coin: opts.coin,
              network,
              account: opts.account || 0,
              n: opts.n || 1
            })
          );
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
      } else {
        const lang = this.languageProvider.getCurrent();
        try {
          if (!opts.keyId) {
            key = Key.create({
              lang
            });
          } else {
            key = this.keyProvider.getKey(opts.keyId);
          }
          walletClient.fromString(
            key.createCredentials(opts.password, {
              coin: opts.coin,
              network,
              account: opts.account || 0,
              n: opts.n || 1
            })
          );
        } catch (e) {
          this.logger.info('Error creating recovery phrase: ' + e.message);
          if (e.message.indexOf('language') > 0) {
            this.logger.info('Using default language for recovery phrase');
            key = Key.create({});
            walletClient.fromString(
              key.createCredentials(opts.password, {
                coin: opts.coin,
                network,
                account: opts.account || 0,
                n: opts.n || 1
              })
            );
          } else {
            return reject(e);
          }
        }
      }
      return resolve({ walletClient, key });
    });
  }

  // Creates a wallet on BWC/BWS and store it
  private _createWallet(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const showOpts = _.clone(opts);
      if (showOpts.extendedPrivateKey) showOpts.extendedPrivateKey = '[hidden]';
      if (showOpts.mnemonic) showOpts.mnemonic = '[hidden]';
      if (showOpts.password) showOpts.password = '[hidden]';

      this.logger.debug('Creating Wallet:', JSON.stringify(showOpts));
      setTimeout(() => {
        this.seedWallet(opts)
          .then(data => {
            const coin = `[${opts.coin.toUpperCase()}]`;
            const name =
              opts.name ||
              `${this.translate.instant('Personal Wallet')} ${coin}`;
            const myName = opts.myName || this.translate.instant('me');

            data.walletClient.createWallet(
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
                const copayerRegistered =
                  err instanceof this.errors.COPAYER_REGISTERED;
                const isSetSeed = opts.mnemonic || opts.extendedPrivateKey;

                if (err && (!copayerRegistered || isSetSeed)) {
                  const msg = this.bwcErrorProvider.msg(
                    err,
                    this.translate.instant('Error creating wallet')
                  );
                  return reject(msg);
                } else if (copayerRegistered) {
                  // try with account + 1
                  opts.account = opts.account ? opts.account + 1 : 1;
                  if (opts.account === 20)
                    return reject(
                      this.translate.instant(
                        'You reach the limit of twenty wallets from the same coin and network'
                      )
                    );
                  return resolve(this._createWallet(opts));
                } else {
                  return resolve(data);
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

  // joins and stores a wallet
  private _joinWallet(opts): Promise<any> {
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

      /* TODO: opts.n is just used to determinate if the wallet is multisig (m/48'/xx) or single sig (m/44') 
        we should change the name to 'isMultisig'
      */
      opts.n = 2;

      this.logger.debug('Joining Wallet:', opts);
      this.seedWallet(opts)
        .then(data => {
          data.walletClient.joinWallet(
            opts.secret,
            opts.myName || 'me',
            {
              coin: opts.coin
            },
            err => {
              if (err) {
                if (err instanceof this.errors.COPAYER_REGISTERED) {
                  // try with account + 1
                  opts.account = opts.account ? opts.account + 1 : 1;
                  if (opts.account === 20)
                    return reject(
                      this.translate.instant(
                        'You reach the limit of twenty wallets from the same coin and network'
                      )
                    );
                  return resolve(this._joinWallet(opts));
                } else {
                  const msg = this.bwcErrorProvider.msg(
                    err,
                    this.translate.instant('Could not join wallet')
                  );
                  return reject(msg);
                }
              }
              return resolve(data);
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

  public getWalletGroup(keyId) {
    keyId = keyId ? keyId : 'read-only';
    return this.walletsGroups[keyId];
  }

  public deleteWalletClient(wallet): Promise<any> {
    this.logger.info('Deleting Wallet:', wallet.credentials.walletName);
    const walletId = wallet.credentials.walletId;

    wallet.removeAllListeners();
    this.profile.deleteWallet(walletId);

    delete this.wallet[walletId];

    this.persistenceProvider.removeAllWalletData(walletId);
    this.events.publish('Local/WalletListChange');

    return this.storeProfileIfDirty();
  }

  public deleteWalletGroup(keyId: string, wallets): Promise<any> {
    let promises = [];
    wallets.forEach(wallet => {
      promises.push(this.deleteWalletClient(wallet));
    });
    return Promise.all(promises).then(() => {
      this.persistenceProvider.removeAllWalletGroupData(keyId);
      return Promise.resolve();
    });
  }

  private getDefaultWalletOpts(coin): Partial<WalletOptions> {
    const defaults = this.configProvider.getDefaults();
    return {
      name: this.currencyProvider.getCoinName(coin),
      m: 1,
      n: 1,
      myName: null,
      networkName: 'livenet',
      bwsurl: defaults.bws.url,
      singleAddress: this.currencyProvider.isSingleAddress(coin) || false,
      coin
    };
  }

  private _createTokenWallet(ethWallet, token) {
    if (_.isString(token)) {
      let tokens = this.currencyProvider.getAvailableTokens();
      token = tokens.find(x => x.symbol == token);
    }
    const tokenCredentials = ethWallet.credentials.getTokenCredentials(token);
    const walletClient = this.bwcProvider.getClient(null, {
      baseUrl: ethWallet.baseUrl,
      bp_partner: ethWallet.bp_partner,
      bp_partner_version: ethWallet.bp_partner_version
    });
    walletClient.fromObj(tokenCredentials);
    return walletClient;
  }

  public createTokenWallet(ethWallet, token): Promise<any> {
    const tokenWalletClient = this._createTokenWallet(ethWallet, token);
    return this.addAndBindWalletClient(tokenWalletClient);
  }

  public createMultipleWallets(coins: string[], tokens = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (tokens && tokens.length && coins.indexOf('eth') < 0) {
        reject('No ethereum wallets for tokens');
      }

      const defaultOpts = this.getDefaultWalletOpts(coins[0]);

      this._createWallet(defaultOpts).then(data => {
        const key = data.key;
        const firstWalletData = data;

        this.keyProvider.addKey(key).then(() => {
          const create2ndWallets = [];
          coins.slice(1).forEach(coin => {
            const newOpts: any = {};
            Object.assign(newOpts, this.getDefaultWalletOpts(coin));
            newOpts['keyId'] = key.id; // Add Key
            create2ndWallets.push(this._createWallet(newOpts));
          });
          Promise.all(create2ndWallets)
            .then(datas => {
              datas.unshift(firstWalletData);
              let walletClients = _.map(datas, 'walletClient');

              // Handle tokens
              const ethWalletClient = walletClients.find(
                wallet => wallet.credentials.coin === 'eth'
              );
              if (!ethWalletClient && !_.isEmpty(tokens))
                reject('no eth wallet');
              const tokenClients = tokens.map(token =>
                this._createTokenWallet(ethWalletClient, token)
              );
              walletClients = walletClients.concat(tokenClients);
              this.addAndBindWalletClients({
                key: firstWalletData.key,
                walletClients
              })
                .then(() => {
                  this.events.publish('Local/WalletListChange');
                  return resolve(walletClients);
                })
                .catch(e => {
                  reject(e);
                });
            })
            .catch(e => {
              // Remove key
              this.keyProvider.removeKey(key.id);
              reject(e);
            });
        });
      });
    });
  }

  public createWallet(opts) {
    return this.keyProvider.handleEncryptedWallet(opts.keyId).then(password => {
      opts.password = password;
      return this._createWallet(opts).then(data => {
        // Encrypt wallet
        this.onGoingProcessProvider.pause();
        return this.askToEncryptKey(data.key).then(() => {
          this.onGoingProcessProvider.resume();
          return this.keyProvider.addKey(data.key).then(() => {
            return this.addAndBindWalletClient(data.walletClient, {
              bwsurl: opts.bwsurl
            }).then(walletClient => {
              return Promise.resolve(walletClient);
            });
          });
        });
      });
    });
  }

  public joinWallet(opts): Promise<any> {
    return this.keyProvider.handleEncryptedWallet(opts.keyId).then(password => {
      opts.password = password;
      return this._joinWallet(opts).then(data => {
        // Encrypt wallet
        this.onGoingProcessProvider.pause();
        return this.askToEncryptKey(data.key).then(() => {
          this.onGoingProcessProvider.resume();
          return this.keyProvider.addKey(data.key).then(() => {
            return this.addAndBindWalletClient(data.walletClient, {
              bwsurl: opts.bwsurl
            }).then(walletClient => {
              return Promise.resolve(walletClient);
            });
          });
        });
      });
    });
  }

  public setDisclaimerAccepted(): Promise<any> {
    this.profile.acceptDisclaimer();
    return this.storeProfileIfDirty();
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
    const wallets = [];
    opts = opts || {};
    // workaround to get wallets in the correct order
    Object.keys(this.walletsGroups).forEach(keyId => {
      opts.keyId = keyId;
      wallets.push(this.getWalletsFromGroup(opts));
    });
    return _.flatten(wallets);
  }

  public getWalletsFromGroup(opts) {
    if (opts && !_.isObject(opts)) throw new Error('bad argument');

    opts = opts || {};

    let ret = _.values(this.wallet);

    if (opts.keyId === 'read-only') {
      ret = _.filter(ret, x => {
        return !x.credentials.keyId;
      });
    } else if (opts.keyId) {
      ret = _.filter(ret, x => {
        return x.credentials.keyId == opts.keyId;
      });
    }

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

    if (!opts.showHidden) {
      // remove hidden wallets
      ret = _.filter(ret, w => {
        return !w.hidden;
      });
    }

    if (opts.canAddNewAccount) {
      ret = _.filter(ret, w => {
        return w.canAddNewAccount;
      });
    }

    if (opts.pairFor) {
      // grab walletIds from current wallet for this token (if any)
      const tokenWalletIds = ret
        .filter(wallet => wallet.coin === opts.pairFor.symbol.toLowerCase())
        .map(wallet => wallet.id);

      ret = ret.filter(
        wallet =>
          !tokenWalletIds.includes(`${wallet.id}-${opts.pairFor.address}`) &&
          wallet.coin === 'eth'
      );
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

  public toggleHideWalletFlag(walletId: string): void {
    this.wallet[walletId].hidden = !this.wallet[walletId].hidden;
    this.persistenceProvider.setHideWalletFlag(
      walletId,
      this.wallet[walletId].hidden
    );
  }

  public getTxps(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      const MAX = 100;
      opts = opts ? opts : {};
      const w = this.getWallets(opts);
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

  public isKeyInUse(keyId: string): boolean {
    const keyIdIndex = this.profile.credentials.findIndex(c => {
      if (keyId === 'read-only') {
        return !c.keyId;
      } else {
        return c.keyId == keyId;
      }
    });
    return keyIdIndex >= 0;
  }
}
