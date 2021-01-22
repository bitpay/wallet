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
import { ErrorsProvider } from '../errors/errors';
import { KeyProvider } from '../key/key';
import { LanguageProvider } from '../language/language';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { RateProvider } from '../rate/rate';
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
  public orderedWalletsByGroup: any = [];

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
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService,
    private txFormatProvider: TxFormatProvider,
    private actionSheetProvider: ActionSheetProvider,
    private keyProvider: KeyProvider,
    private derivationPathHelperProvider: DerivationPathHelperProvider,
    private errorsProvider: ErrorsProvider,
    private rateProvider: RateProvider
  ) {
    this.throttledBwsEvent = _.throttle((n, wallet) => {
      this.newBwsEvent(n, wallet);
    }, 10000);
  }

  private trySetName(wallet: any, i: number = 0): any {
    const config = this.configProvider.get();

    if (i > 5) {
      // just put the Id is the prev fails
      wallet.linkedEthWalletName = wallet.linkedEthWallet;
      return;
    }

    let linked = this.getWallet(wallet.linkedEthWallet);
    if (linked && linked.credentials) {
      this.logger.debug(
        'Setting linkedEthWalletName:' + wallet.linkedEthWallet
      );

      wallet.linkedEthWalletName =
        (config.aliasFor && config.aliasFor[linked.id]) ||
        linked.credentials.walletName;

      return;
    } else {
      this.logger.debug(
        'Waiting to set name for linkedEthWalletName:' + wallet.linkedEthWallet
      );

      return window.setTimeout(() => {
        this.trySetName(wallet, i + 1);
      }, 2000);
    }
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
      wallet.id,
      wallet.n
    );

    if (wallet.linkedEthWallet) {
      this.trySetName(wallet);
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

  public setWalletGroupOrder(keyId: string, index: number): void {
    this.persistenceProvider.setWalletGroupOrder(keyId, index).then(() => {
      this.logger.debug(
        'Wallet group new order stored for ' + keyId + ': ' + index
      );
    });
    if (this.walletsGroups[keyId]) this.walletsGroups[keyId]['order'] = index;
  }

  public setNewWalletGroupOrder(newWalletKeyId: string): void {
    const promises = [];
    Object.keys(this.walletsGroups).forEach(keyId => {
      promises.push(this.getWalletGroupOrder(keyId));
    });
    Promise.all(promises).then(order => {
      const index = !_.max(order) ? 0 : +_.max(order) + 1;
      this.setWalletGroupOrder(newWalletKeyId, index);
      this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
    });
  }

  public setWalletGroupName(keyId: string, name: string): void {
    this.persistenceProvider.setWalletGroupName(keyId, name);
    if (this.walletsGroups[keyId]) this.walletsGroups[keyId].name = name;
    this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
  }

  public async getWalletGroupName(keyId: string) {
    const name = await this.persistenceProvider.getWalletGroupName(keyId);
    return name;
  }

  private async getWalletOrder(walletId: string) {
    const order = await this.persistenceProvider.getWalletOrder(walletId);
    return order;
  }

  private async getWalletGroupOrder(keyId: string) {
    const order = await this.persistenceProvider.getWalletGroupOrder(keyId);
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

    const keyObj = k.toObj();
    if (!keyObj.mnemonic && !keyObj.mnemonicEncrypted) return false;
    return true;
  }

  private requiresBackup(wallet) {
    let k = this.keyProvider.getKey(wallet.credentials.keyId);
    if (!k) return false;

    const keyObj = k.toObj();
    if (!keyObj.mnemonic && !keyObj.mnemonicEncrypted) return false;
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
    wallet.lastAddress = await this.persistenceProvider.getLastAddress(
      walletId
    );
    wallet.canSign = keyId ? true : false;
    wallet.isPrivKeyEncrypted = wallet.canSign
      ? this.keyProvider.isPrivKeyEncrypted(keyId)
      : false;
    wallet.canAddNewAccount = this.checkAccountCreation(wallet, keyId);
    wallet.isSegwit = this.checkIfSegwit(wallet.credentials.addressType);

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
      order = await this.getWalletGroupOrder(keyId);
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

    // Desktop: uses this event 'notification'
    // Mobile: uses 'bwsEvent'
    //
    // Disabled on mobile to avoid duplicate notifications
    if (!this.platformProvider.isCordova) {
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
    }

    wallet.on('walletCompleted', () => {
      this.logger.debug('Wallet completed');
      this.updateCredentials(JSON.parse(wallet.toString()));
      this.setOrderedWalletsByGroup();
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
      } else if (opts.walletId && opts.walletId.includes(wallet.id)) {
        const tokenWallet = this.getWallet(opts.walletId);
        this.logger.debug('Updating token wallet from config ' + opts.walletId);
        this.updateWalletFromConfig(tokenWallet);
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

      const chain = this.currencyProvider.getChain(wallet.coin).toLowerCase();
      if (
        (wallet.n == 1 && wallet.credentials.addressType == 'P2PKH') ||
        (wallet.credentials.addressType == 'P2WPKH' &&
          derivationStrategy == 'BIP44' &&
          (chain == 'btc' || (chain == 'bch' && coinCode == "145'")))
      ) {
        return true;
      }
      if (
        (wallet.n > 1 && wallet.credentials.addressType == 'P2SH') ||
        (wallet.credentials.addressType == 'P2WSH' &&
          derivationStrategy == 'BIP48' &&
          (chain == 'btc' || (chain == 'bch' && coinCode == "145'")))
      ) {
        return true;
      }
      if (
        wallet.n == 1 &&
        wallet.credentials.addressType == 'P2PKH' &&
        derivationStrategy == 'BIP44' &&
        chain == 'eth' &&
        coinCode == "60'"
      ) {
        return true;
      }
      if (
        wallet.n == 1 &&
        wallet.credentials.addressType == 'P2PKH' &&
        derivationStrategy == 'BIP44' &&
        chain == 'xrp' &&
        coinCode == "144'"
      ) {
        return true;
      }
      return false;
    }
  }

  public checkIfSegwit(addressType: string) {
    if (!addressType) return false;
    else if (addressType == 'P2WPKH' || addressType == 'P2WSH') {
      return true;
    } else return false;
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
    if (!this.configProvider.get().desktopNotifications.enabled) return;

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
    let id = wallet.id;
    if (n.data && n.data.tokenAddress) {
      id = wallet.id + '-' + n.data.tokenAddress.toLowerCase();
      this.logger.debug(`event for token wallet: ${id}`);
    }
    this.events.publish('bwsEvent', id, n.type, n);
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
    // if the key is already encrypted, keep it that way for new wallets
    if (key.isPrivKeyEncrypted()) return Promise.resolve();

    // do not request encryption if wallets were already created without it
    const wallets = this.getWalletsFromGroup({ keyId: key.id });
    if (!key.isPrivKeyEncrypted() && wallets && wallets.length)
      return Promise.resolve();
    return this.showEncryptPasswordInfoModal().then((password: string) => {
      if (!password) {
        return Promise.resolve();
      } else {
        try {
          this.keyProvider.encryptPrivateKey(key, password);
        } catch (error) {
          return Promise.reject(error);
        }
        return Promise.resolve();
      }
    });
  }

  private showEncryptPasswordInfoModal(): Promise<any> {
    const encryptPasswordModal = this.actionSheetProvider.createEncryptPasswordComponent();
    encryptPasswordModal.present({ maxHeight: '100%', minHeight: '100%' });
    return new Promise(resolve => {
      encryptPasswordModal.onDidDismiss(password => resolve(password));
    });
  }

  private async addAndBindWalletClients(
    data,
    opts = { bwsurl: null, keyId: null }
  ): Promise<any> {
    if (opts.keyId) {
      // re-import attempt
      if (this.checkIfCorrectWalletToReImport(opts.keyId, data.key)) {
        const wallets = this.getWalletsFromGroup({
          keyId: opts.keyId,
          showHidden: true
        });
        await this.deleteWalletGroup(opts.keyId, wallets);
        await this.keyProvider.removeKey(opts.keyId);
      } else {
        return Promise.reject(
          this.translate.instant(
            'The recovery phrase you entered do not match the wallet you are trying to re-import'
          )
        );
      }
    }
    this.onGoingProcessProvider.pause();
    // Encrypt wallet
    return this.askToEncryptKey(data.key).then(() => {
      this.onGoingProcessProvider.resume();
      return this.keyProvider.addKey(data.key).then(async () => {
        const boundWalletClients = [];
        for (const walletClient of data.walletClients) {
          const boundClient = await this.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl,
            store: false
          });
          boundWalletClients.push(boundClient);
        }
        this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
        return this.storeProfileIfDirty()
          .then(() => {
            return this.checkIfAlreadyExist(boundWalletClients).then(() => {
              return Promise.resolve(_.compact(boundWalletClients));
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
        this.errorsProvider.showDefaultError(msg, title, () => {
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
    opts: WalletBindTypeOpts = {}
  ): Promise<any> {
    if (!wallet || !wallet.credentials) {
      return Promise.reject(this.translate.instant('Could not access wallet'));
    }

    const { bwsurl, store = true } = opts;
    const walletId: string = wallet.credentials.walletId;

    if (!this.profile.addWallet(JSON.parse(wallet.toString()))) {
      return Promise.resolve();
    }

    const skipKeyValidation: boolean = this.shouldSkipValidation(walletId);
    if (!skipKeyValidation) {
      this.logger.debug('Trying to runValidation: ' + walletId);
      await this.runValidation(wallet);
    }

    this.saveBwsUrl(walletId, bwsurl);
    return this.bindWalletClient(wallet).then(() => {
      if (!store) {
        this.logger.debug('No storing new walletClient');
        return Promise.resolve(wallet);
      } else {
        this.logger.debug('Storing new walletClient');
        this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
        return this.storeProfileIfDirty().then(() => {
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

  public checkIfCorrectWalletToReImport(keyId, key) {
    this.logger.info("Checking if it's the correct wallet to re import");
    const keyToReImport = this.keyProvider.getKey(keyId);
    return this.keyProvider.isMatch(keyToReImport, key);
  }

  public importExtendedPrivateKey(xPrivKey: string, opts): Promise<any> {
    this.logger.info('Importing Wallet xPrivKey');
    opts.xPrivKey = xPrivKey;
    return this.serverAssistedImport(opts).then(data => {
      // If the key already exists, bind the new wallets to it.
      const key = this.keyProvider.getMatchedKey(data.key);
      // skip if re-importing to clear encrypt
      if (key && !opts.keyId) {
        data.key = this.keyProvider.getKey(key.id);
        opts.keyId = key.id;
        data.walletClients.forEach(walletClient => {
          walletClient.credentials.keyId = walletClient.keyId = key.id;
        });
      }
      return this.addAndBindWalletClients(data, {
        bwsurl: opts.bwsurl,
        keyId: opts.keyId
      });
    });
  }

  public importMnemonic(words, opts): Promise<any> {
    this.logger.info('Importing Wallets Mnemonic');
    words = this.normalizeMnemonic(words);
    opts.words = words;
    return this.serverAssistedImport(opts).then(data => {
      // If the key already exists, bind the new wallets to it.
      const key = this.keyProvider.getMatchedKey(data.key);
      // skip if re-importing to clear encrypt
      if (key && !opts.keyId) {
        data.key = this.keyProvider.getKey(key.id);
        opts.keyId = key.id;
        data.walletClients.forEach(walletClient => {
          walletClient.credentials.keyId = walletClient.keyId = key.id;
        });
      }
      return this.addAndBindWalletClients(data, {
        bwsurl: opts.bwsurl,
        keyId: opts.keyId
      });
    });
  }

  public importFile(str: string, opts): Promise<any> {
    return this._importFile(str, opts).then(async data => {
      if (opts.keyId) {
        // re-import attempt
        if (this.checkIfCorrectWalletToReImport(opts.keyId, data.key)) {
          const wallets = this.getWalletsFromGroup({
            keyId: opts.keyId,
            showHidden: true
          });
          await this.deleteWalletGroup(opts.keyId, wallets);
          await this.keyProvider.removeKey(opts.keyId);
        } else {
          return Promise.reject(
            this.translate.instant(
              'The recovery phrase you entered do not match the wallet you are trying to re-import'
            )
          );
        }
      }
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
          // check if the key exists to just add the wallet
          if (data.key) {
            key = this.keyProvider.getMatchedKey(data.key);
            // skip if re-importing to clear encrypt
            if (key && !opts.keyId) {
              data.key = this.keyProvider.getKey(key.id);
              opts.keyId = null;
              data.credentials.keyId = key.id;
            } else {
              key = new Key({
                seedType: 'object',
                seedData: data.key
              });
            }
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

  private bindWallets(profile): Promise<any> {
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
        this.setOrderedWalletsByGroup(); // Update Ordered Wallet List When App Start
        return Promise.resolve();
      });
    });
  }

  private bindProfile(profile): Promise<any> {
    return this.bindWallets(profile).then(() => {
      return this.isDisclaimerAccepted();
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

  public async isDisclaimerAccepted(): Promise<any> {
    const disclaimerAccepted = this.profile && this.profile.disclaimerAccepted;
    if (disclaimerAccepted) return Promise.resolve();
    // OLD flag
    let disclaimerFlag;
    try {
      disclaimerFlag = await this.persistenceProvider.getCopayDisclaimerFlag();
    } catch (error) {}
    if (disclaimerFlag) {
      this.profile.disclaimerAccepted = true;
      return Promise.resolve();
    } else {
      const onboardingState = this.profile.credentials.length
        ? 'NONAGREEDDISCLAIMER'
        : 'UNFINISHEDONBOARDING';
      return Promise.resolve(onboardingState);
    }
  }

  private getBWSURL(walletId: string) {
    const config = this.configProvider.get();
    const defaults = this.configProvider.getDefaults();
    return (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url;
  }

  private async bindWallet(credentials): Promise<any> {
    if (!credentials.walletId || !credentials.m) {
      return Promise.reject(
        new Error('bindWallet should receive credentials JSON')
      );
    }

    // Create the client
    const walletClient = this.bwcProvider.getClient(
      JSON.stringify(credentials),
      {
        bwsurl: this.getBWSURL(credentials.walletId),
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
    return this.persistenceProvider.getProfile().then(profile => {
      if (!profile) {
        return Promise.resolve();
      }

      this.profile = Profile.fromObj(profile);

      // Deprecated: storageService.tryToMigrate
      this.logger.info('Profile loaded');

      return this.bindProfile(this.profile);
    });
  }

  public importWithDerivationPath(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Importing Wallet with derivation path');
      this._importWithDerivationPath(opts)
        .then(data => {
          // Check if wallet exists
          data.walletClient.openWallet(async err => {
            if (err) {
              if (err.message.indexOf('not found') > 0) {
                err = 'WALLET_DOES_NOT_EXIST';
              }
              return reject(err);
            }
            if (opts.keyId) {
              // re-import attempt
              if (this.checkIfCorrectWalletToReImport(opts.keyId, data.key)) {
                const wallets = this.getWalletsFromGroup({
                  keyId: opts.keyId,
                  showHidden: true
                });
                await this.deleteWalletGroup(opts.keyId, wallets);
                await this.keyProvider.removeKey(opts.keyId);
              } else {
                return reject(
                  this.translate.instant(
                    'The recovery phrase you entered do not match the wallet you are trying to re-import'
                  )
                );
              }
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
        })
        .catch(err => {
          return reject(err);
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
          // new BWC 8.23 api
          key = new Key({
            seedType: 'mnemonic',
            seedData: opts.mnemonic,
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
          this.logger.info('Invalid wallet recovery phrase: ' + ex);
          return reject(
            this.translate.instant(
              'Could not create: Invalid wallet recovery phrase'
            )
          );
        }
      } else if (opts.extendedPrivateKey) {
        try {
          key = new Key({
            seedType: 'extendedPrivateKey',
            seedData: opts.extendedPrivateKey,
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
          if (opts.duplicateKeyId) {
            walletClient.credentials.keyId = opts.duplicateKeyId;

            this.logger.debug(
              `Reusing ${opts.duplicateKeyId} on the duplicated wallet`
            );
          }
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
          if (!opts.key && !opts.keyId) {
            key = new Key({
              seedType: 'new',
              language: lang
            });
          } else if (opts.key) {
            key = opts.key;
          } else if (opts.keyId) {
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
            key = new Key({ seedType: 'new' });
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
      if (showOpts.key) showOpts.key = '[hidden]';

      this.logger.debug('Creating Wallet:', JSON.stringify(showOpts));

      if (opts.useNativeSegwit && opts.coin !== 'btc') {
        const err = 'Wrong useNativeSegwit opt for non btc wallet';
        return reject(err);
      }
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
                coin: opts.coin,
                useNativeSegwit: opts.useNativeSegwit
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
                  // Set default preferences.
                  const config = this.configProvider.get();

                  const prefs = {
                    email: config.emailNotifications.email,
                    language: this.languageProvider.getCurrent(),
                    unit: 'btc' // deprecated
                  };

                  data.walletClient.preferences = _.assign(
                    prefs,
                    data.walletClient.preferences
                  );
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

  private _deleteWalletClient(wallet) {
    this.logger.info('Deleting Wallet:', wallet.credentials.walletName);
    const walletId = wallet.credentials.walletId;

    wallet.removeAllListeners();
    this.profile.deleteWallet(walletId);

    delete this.wallet[walletId];

    this.persistenceProvider.removeAllWalletData(walletId);
  }

  public deleteWalletClient(wallet): Promise<any> {
    this.logger.info('Deleting Wallet:', wallet.credentials.walletName);
    const walletId = wallet.credentials.walletId;

    wallet.removeAllListeners();
    this.profile.deleteWallet(walletId);

    delete this.wallet[walletId];

    this.persistenceProvider.removeAllWalletData(walletId);
    this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
    this.events.publish('Local/FetchWallets');
    return this.storeProfileIfDirty();
  }

  public deleteWalletGroup(keyId: string, wallets): Promise<any> {
    wallets.forEach(wallet => {
      this._deleteWalletClient(wallet);
    });
    this.persistenceProvider.removeAllWalletGroupData(keyId);
    this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
    this.events.publish('Local/FetchWallets');
    return this.storeProfileIfDirty();
  }

  private getDefaultWalletOpts(coin): Partial<WalletOptions> {
    const defaults = this.configProvider.getDefaults();
    const opts: Partial<WalletOptions> = {
      name: this.currencyProvider.getCoinName(coin),
      m: 1,
      n: 1,
      myName: null,
      networkName: 'livenet',
      bwsurl: defaults.bws.url,
      singleAddress: this.currencyProvider.isSingleAddress(coin) || false,
      coin
    };
    if (coin === 'btc') opts.useNativeSegwit = true;
    return opts;
  }

  private _createTokenWallet(ethWallet, tokenObj) {
    this.logger.debug(
      `Creating token wallet ${tokenObj.name} for ${ethWallet.id}:`
    );

    const tokenCredentials = ethWallet.credentials.getTokenCredentials(
      tokenObj
    );
    const walletClient = this.bwcProvider.getClient(null, {
      baseUrl: this.getBWSURL(ethWallet.credentials.walletId),
      bp_partner: ethWallet.bp_partner,
      bp_partner_version: ethWallet.bp_partner_version
    });
    walletClient.fromObj(tokenCredentials);

    // Add the token info to the ethWallet.
    ethWallet.preferences = ethWallet.preferences || {};
    ethWallet.preferences.tokenAddresses =
      ethWallet.preferences.tokenAddresses || [];
    ethWallet.preferences.tokenAddresses.push(tokenObj.address);

    return walletClient;
  }

  private _createMultisigEthWallet(ethWallet, multisigEthInfo) {
    this.logger.debug(
      `Creating ETH multisig wallet ${multisigEthInfo.walletName} for ${ethWallet.id}:`
    );
    const multisigEthCredentials = ethWallet.credentials.getMultisigEthCredentials(
      multisigEthInfo
    );
    const walletClient = this.bwcProvider.getClient(null, {
      bwsurl: this.getBWSURL(ethWallet.credentials.walletId),
      bp_partner: ethWallet.bp_partner,
      bp_partner_version: ethWallet.bp_partner_version
    });
    walletClient.fromObj(multisigEthCredentials);
    // Add the token info to the ethWallet.
    ethWallet.preferences = ethWallet.preferences || {};
    ethWallet.preferences.multisigEthInfo =
      ethWallet.preferences.multisigEthInfo || [];
    ethWallet.preferences.multisigEthInfo.push(multisigEthInfo);

    return walletClient;
  }

  public createTokenWallet(ethWallet, token): Promise<any> {
    if (_.isString(token)) {
      let tokens = this.currencyProvider.getAvailableTokens();
      token = tokens.find(x => x.symbol == token);
    }
    const tokenWalletClient = this._createTokenWallet(ethWallet, token);
    return this.addAndBindWalletClient(tokenWalletClient);
  }

  public createMultisigEthWallet(ethWallet, multisigEthInfo): Promise<any> {
    const multisigEthWalletClient = this._createMultisigEthWallet(
      ethWallet,
      multisigEthInfo
    );
    return this.addAndBindWalletClient(multisigEthWalletClient);
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
        const create2ndWallets = [];
        coins.slice(1).forEach(coin => {
          const newOpts: any = {};
          Object.assign(newOpts, this.getDefaultWalletOpts(coin));
          newOpts['key'] = key; // Add Key
          create2ndWallets.push(this._createWallet(newOpts));
        });
        Promise.all(create2ndWallets)
          .then(walletsData => {
            walletsData.unshift(firstWalletData);
            let walletClients = _.map(walletsData, 'walletClient');

            // Handle tokens
            if (!_.isEmpty(tokens)) {
              const ethWalletClient = walletClients.find(
                wallet => wallet.credentials.coin === 'eth'
              );

              if (!ethWalletClient) reject('no eth wallet for tokens');

              let tokenObjs = this.currencyProvider.getAvailableTokens();

              const tokenClients = tokens.map(token => {
                token = tokenObjs.find(x => x.symbol == token);
                return this._createTokenWallet(ethWalletClient, token);
              });

              walletClients = walletClients.concat(tokenClients);
            }

            this.addAndBindWalletClients({
              key: firstWalletData.key,
              walletClients
            })
              .then(() => {
                return resolve(walletClients);
              })
              .catch(e => {
                reject(e);
              });
          })
          .catch(e => {
            reject(e);
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
    // workaround to get wallets and wallets groups in the correct order
    this.getOrderedWalletsGroups().forEach(walletsGroup => {
      opts.keyId = walletsGroup.key;
      wallets.push(this.getWalletsFromGroup(opts));
    });
    return _.flatten(wallets);
  }

  public setOrderedWalletsByGroup() {
    this.logger.debug('Set Ordered Wallets By Group');
    const wallets = [];
    this.getOrderedWalletsGroups().forEach(walletsGroup => {
      wallets.push(this.getWalletsFromGroup({ keyId: walletsGroup.key }));
    });
    this.orderedWalletsByGroup = _.values(
      _.groupBy(_.flatten(wallets), 'keyId')
    );
  }

  private getOrderedWalletsGroups() {
    let walletsGroups = [];
    for (let key in this.walletsGroups) {
      walletsGroups.push({
        key,
        value: this.walletsGroups[key]
      });
    }
    const orderedWalletsGroups = _.sortBy(walletsGroups, walletGroup => {
      return +walletGroup.value.order;
    });
    return orderedWalletsGroups;
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
      let coins: string[] = [].concat(opts.coin);
      ret = _.filter(ret, x => {
        return _.findIndex(coins, coin => x.credentials.coin == coin) >= 0;
      });
    }

    if (opts.backedUp) {
      ret = _.filter(ret, x => {
        return !x.needsBackup;
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

    if (opts.minFiatCurrency) {
      ret = ret.filter(wallet => {
        if (_.isEmpty(wallet.cachedStatus)) return true;

        const availableBalanceFiat = this.rateProvider.toFiat(
          wallet.cachedStatus.availableBalanceSat,
          opts.minFiatCurrency.currency,
          wallet.coin
        );

        return availableBalanceFiat >= Number(opts.minFiatCurrency.amount);
      });
    }

    if (opts.minPendingAmount) {
      ret = ret.filter(wallet => {
        if (_.isEmpty(wallet.cachedStatus)) return true;

        const availablePendingFiat = this.rateProvider.toFiat(
          wallet.cachedStatus.pendingAmount,
          opts.minPendingAmount.currency,
          wallet.coin
        );

        return availablePendingFiat >= Number(opts.minPendingAmount.amount);
      });
    }

    if (opts.lastAddress) {
      ret = _.filter(ret, w => {
        return w.lastAddress == opts.lastAddress;
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

  public toggleHideWalletFlag(walletId: string): void {
    this.wallet[walletId].hidden = !this.wallet[walletId].hidden;
    this.persistenceProvider.setHideWalletFlag(
      walletId,
      this.wallet[walletId].hidden
    );
    this.setOrderedWalletsByGroup(); // Update Ordered Wallet List
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

  // Checks to see if a wallet exists with minimim fiat amount's worth in it (to pay invoice, for example)
  public hasWalletWithFunds(fiatAmount: number, fiatCurrency: string): boolean {
    const minFiatCurrency = {
      amount: fiatAmount,
      currency: fiatCurrency
    };

    const wallets = this.getWalletsFromGroup({ minFiatCurrency });

    return Boolean(wallets.length);
  }
}
