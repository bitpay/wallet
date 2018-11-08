import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';

// providers
import { AppProvider } from '../app/app';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { LanguageProvider } from '../language/language';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { ReplaceParametersProvider } from '../replace-parameters/replace-parameters';
import { TxFormatProvider } from '../tx-format/tx-format';
import { Coin, WalletOptions } from '../wallet/wallet';

// models
import { Profile } from '../../models/profile/profile.model';

@Injectable()
export class ProfileProvider {
  public wallet: any = {};
  public profile: Profile;

  private UPDATE_PERIOD = 15;
  private throttledBwsEvent;
  private validationLock: boolean = false;
  private errors = this.bwcProvider.getErrors();

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
    private txFormatProvider: TxFormatProvider
  ) {
    this.throttledBwsEvent = _.throttle((n, wallet) => {
      this.newBwsEvent(n, wallet);
    }, 10000);
  }

  private updateWalletSettings(wallet): void {
    const config = this.configProvider.get();
    const defaults = this.configProvider.getDefaults();
    const defaultColor =
      this.appProvider.info.nameCase == 'Copay' ? '#1abb9b' : '#647ce8';
    // this.config.whenAvailable( (config) => { TODO
    wallet.usingCustomBWS =
      config.bwsFor &&
      config.bwsFor[wallet.id] &&
      config.bwsFor[wallet.id] != defaults.bws.url;
    wallet.name =
      (config.aliasFor && config.aliasFor[wallet.id]) ||
      wallet.credentials.walletName;
    wallet.color =
      config.colorFor && config.colorFor[wallet.id]
        ? config.colorFor[wallet.id]
        : defaultColor;
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

  private needsBackup(wallet): Promise<boolean> {
    return new Promise(resolve => {
      if (!this.requiresBackup(wallet)) {
        return resolve(false);
      }

      this.persistenceProvider
        .getBackupFlag(wallet.credentials.walletId)
        .then((val: string) => {
          if (val) {
            return resolve(false);
          }
          return resolve(true);
        })
        .catch(err => {
          this.logger.error(err);
        });
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
    wallet.status = {};

    this.updateWalletSettings(wallet);
    this.wallet[walletId] = wallet;

    wallet.needsBackup = await this.needsBackup(wallet);
    wallet.balanceHidden = await this.isBalanceHidden(wallet);
    wallet.order = await this.getWalletOrder(wallet.id);

    wallet.removeAllListeners();

    wallet.on('report', n => {
      this.logger.info('BWC Report:' + n);
    });

    wallet.on('notification', n => {
      // TODO: Only development purpose
      if (
        !this.platformProvider.isElectron &&
        !this.platformProvider.isCordova
      ) {
        this.logger.debug('BWC Notification:', JSON.stringify(n));
      }

      if (this.platformProvider.isElectron) {
        this.showInAppNotification(n, wallet);
      }

      if (n.type == 'NewBlock' && n.data.network == 'testnet') {
        this.throttledBwsEvent(n, wallet);
      } else {
        this.newBwsEvent(n, wallet);
      }
    });

    wallet.on('walletCompleted', () => {
      this.logger.debug('Wallet completed');
      this.updateCredentials(JSON.parse(wallet.export()));
      this.events.publish('status:updated');
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
    this.events.subscribe('wallet:updated', (walletId: string) => {
      if (walletId && walletId == wallet.id) {
        this.logger.debug('Updating settings for wallet:' + wallet.id);
        this.updateWalletSettings(wallet);
      }
    });
    return true;
  }

  private showInAppNotification(n, wallet): void {
    const creatorId = n && n.data && n.data.creatorId;
    const amount = n && n.data && n.data.amount;
    let title: string;
    let body: string;

    switch (n.type) {
      case 'NewCopayer':
        if (wallet.copayerId != creatorId) {
          title = this.translate.instant('New copayer');
          body = this.translate.instant(
            `A new copayer just joined your wallet ${wallet.name}.`
          );
        }
        break;
      case 'WalletComplete':
        title = this.translate.instant('Wallet complete');
        body = this.translate.instant(
          `Your wallet ${wallet.name} is complete.`
        );
        break;
      case 'NewTxProposal':
        if (wallet && wallet.m > 1 && wallet.copayerId != creatorId) {
          title = this.translate.instant('New payment proposal');
          body = this.translate.instant(
            `A new payment proposal has been created in your wallet ${
              wallet.name
            }.`
          );
        }
        break;
      case 'NewIncomingTx':
        title = this.translate.instant('New payment received');
        const amountStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          amount
        );
        const translatedMsg = this.translate.instant(
          `A payment of {{amountStr}} has been received into your wallet ${
            wallet.name
          }.`
        );
        body = this.replaceParametersProvider.replace(translatedMsg, {
          amountStr
        });
        break;
      case 'TxProposalFinallyRejected':
        title = this.translate.instant('Payment proposal rejected');
        body = this.translate.instant(
          `A payment proposal in your wallet ${wallet.name} has been rejected.`
        );
        break;
      case 'TxConfirmation':
        title = this.translate.instant('Transaction confirmed');
        body = this.translate.instant(
          `The transaction from ${
            wallet.name
          } that you were waiting for has been confirmed.`
        );
        break;
    }

    if (!body) return;

    const { ipcRenderer } = (window as any).require('electron');
    ipcRenderer.send('new-notification', {
      title,
      body
    });
  }

  private newBwsEvent(n, wallet): void {
    if (wallet.cachedStatus) wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory) wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity) wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps) wallet.cachedTxps.isValid = false;

    this.events.publish('bwsEvent', wallet.id, n.type, n);
  }

  public updateCredentials(credentials): void {
    this.profile.updateWallet(credentials);
    this.persistenceProvider.storeProfile(this.profile);
  }

  public getLastKnownBalance(wid: string) {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getBalanceCache(wid)
        .then((data: string) => {
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private addLastKnownBalance(wallet): Promise<any> {
    return new Promise(resolve => {
      const now = Math.floor(Date.now() / 1000);
      const showRange = 600; // 10min;

      this.getLastKnownBalance(wallet.id)
        .then((data: any) => {
          if (data) {
            const parseData = data;
            wallet.cachedBalance = parseData.balance;
            wallet.cachedBalanceUpdatedOn =
              parseData.updatedOn < now - showRange
                ? parseData.updatedOn
                : null;
          }
          return resolve();
        })
        .catch(err => {
          this.logger.warn('Could not get last known balance: ', err);
        });
    });
  }

  public setLastKnownBalance(wid: string, balance: number): void {
    this.persistenceProvider.setBalanceCache(wid, {
      balance,
      updatedOn: Math.floor(Date.now() / 1000)
    });
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
            this.persistenceProvider.clearLastAddress(walletId).then(() => {});
          }

          this.storeProfileIfDirty();
        }
      );
    }, delay);
  }

  public storeProfileIfDirty(): void {
    if (this.profile.dirty) {
      this.persistenceProvider.storeProfile(this.profile).then(() => {
        this.logger.debug('Saved modified Profile');
        return;
      });
    } else {
      return;
    }
  }

  public importWallet(str: string, opts): Promise<any> {
    return new Promise((resolve, reject) => {
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
        return reject(
          this.translate.instant('Could not import. Check input file.')
        );
      }

      const strParsed = JSON.parse(str);

      if (!strParsed.n) {
        return reject(
          'Backup format not recognized. If you are using a Copay Beta backup and version is older than 0.10, please see: https://github.com/bitpay/copay/issues/4730#issuecomment-244522614'
        );
      }

      const addressBook = strParsed.addressBook ? strParsed.addressBook : {};

      this.addAndBindWalletClient(walletClient, {
        bwsurl: opts.bwsurl
      })
        .then(() => {
          this.setMetaData(walletClient, addressBook)
            .then(() => {
              return resolve(walletClient);
            })
            .catch(err => {
              this.logger.warn('Could not set meta data: ', err);
              return reject(err);
            });
        })
        .catch(err => {
          return reject(err);
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

  private askToEncryptWallet(wallet): Promise<any> {
    return new Promise(resolve => {
      if (!wallet.canSign()) return resolve();

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

  private encrypt(wallet): Promise<any> {
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
            this.encrypt(wallet).then(() => {
              return resolve();
            });
          });
        } else {
          title = this.translate.instant(
            'Enter your encrypt password again to confirm'
          );
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
  private addAndBindWalletClient(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet || !wallet.credentials) {
        return reject(this.translate.instant('Could not access wallet'));
      }

      // Encrypt wallet
      this.onGoingProcessProvider.pause();
      this.askToEncryptWallet(wallet).then(() => {
        this.onGoingProcessProvider.resume();

        const walletId: string = wallet.credentials.walletId;

        if (!this.profile.addWallet(JSON.parse(wallet.export()))) {
          const message = this.replaceParametersProvider.replace(
            this.translate.instant('Wallet already in {{nameCase}}'),
            { nameCase: this.appProvider.info.nameCase }
          );
          return reject(message);
        }

        const skipKeyValidation: boolean = this.shouldSkipValidation(walletId);
        if (!skipKeyValidation) {
          this.logger.debug('Trying to runValidation: ' + walletId);
          this.runValidation(wallet);
        }

        this.bindWalletClient(wallet);

        const saveBwsUrl = (): Promise<any> => {
          return new Promise(resolve => {
            const defaults = this.configProvider.getDefaults();
            const bwsFor = {};
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
          this.persistenceProvider
            .storeProfile(this.profile)
            .then(() => {
              return resolve(wallet);
            })
            .catch(err => {
              return reject(err);
            });
        });
      });
    });
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

      walletClient.importFromExtendedPrivateKey(xPrivKey, opts, err => {
        if (err) {
          if (err instanceof this.errors.NOT_AUTHORIZED) return reject(err);
          this.bwcErrorProvider
            .cb(err, this.translate.instant('Could not import'))
            .then((msg: string) => {
              return reject(msg);
            });
        } else {
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

  public importMnemonic(words: string, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Importing Wallet Mnemonic');
      const walletClient = this.bwcProvider.getClient(null, opts);

      words = this.normalizeMnemonic(words);
      walletClient.importFromMnemonic(
        words,
        {
          network: opts.networkName,
          passphrase: opts.passphrase,
          entropySourcePath: opts.entropySourcePath,
          derivationStrategy: opts.derivationStrategy || 'BIP44',
          account: opts.account || 0,
          coin: opts.coin
        },
        err => {
          if (err) {
            if (err instanceof this.errors.NOT_AUTHORIZED) {
              return reject(err);
            }

            this.bwcErrorProvider
              .cb(err, this.translate.instant('Could not import'))
              .then((msg: string) => {
                return reject(msg);
              });
          } else {
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
        }
      );
    });
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
        err => {
          if (err) {
            // in HW wallets, req key is always the same. They can't addAccess.
            if (err instanceof this.errors.NOT_AUTHORIZED)
              err.name = 'WALLET_DOES_NOT_EXIST';

            this.bwcErrorProvider
              .cb(err, this.translate.instant('Could not import'))
              .then((msg: string) => {
                return reject(msg);
              });
          }

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
    this.profile = new Profile();
    this.profile = this.profile.create();
    this.persistenceProvider.storeNewProfile(this.profile);
  }

  public bindProfile(profile): Promise<any> {
    return new Promise((resolve, reject) => {
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
                  return resolve();
                }
              })
              .catch(err => {
                return reject(err);
              });
          });
        });
      };

      bindWallets()
        .then(() => {
          this.isOnboardingCompleted()
            .then(() => {
              this.isDisclaimerAccepted()
                .then(() => {
                  return resolve();
                })
                .catch(() => {
                  return reject(
                    new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer')
                  );
                });
            })
            .catch(() => {
              this.isDisclaimerAccepted()
                .then(() => {
                  this.setOnboardingCompleted()
                    .then(() => {
                      return resolve();
                    })
                    .catch(err => {
                      this.logger.error(err);
                    });
                })
                .catch(() => {
                  return reject(
                    new Error(
                      'ONBOARDINGNONCOMPLETED: Onboarding non completed'
                    )
                  );
                });
            });
        })
        .catch(err => {
          return reject(err);
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

  public isOnboardingCompleted(): Promise<any> {
    return new Promise((resolve, reject) => {
      const onboardingCompleted =
        this.profile && this.profile.onboardingCompleted;
      if (onboardingCompleted) return resolve();

      this.persistenceProvider.getCopayOnboardingFlag().then(val => {
        if (val) {
          this.profile.onboardingCompleted = true;
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

      this.logger.debug(
        'Binding wallet:' +
          credentials.walletId +
          ' Validating?:' +
          !skipKeyValidation
      );
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
          this.profile = new Profile();
          this.profile = this.profile.fromObj(profile);
          // Deprecated: storageService.tryToMigrate
          this.logger.info('Profile read');
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

  private seedWallet(opts): Promise<any> {
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
            const name = opts.name || this.translate.instant('Personal Wallet');
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
                  this.bwcErrorProvider
                    .cb(err, this.translate.instant('Error creating wallet'))
                    .then((msg: string) => {
                      return reject(msg);
                    });
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

  // create and store a wallet
  public createWallet(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.doCreateWallet(opts)
        .then(walletClient => {
          this.addAndBindWalletClient(walletClient, {
            bwsurl: opts.bwsurl
          }).then(wallet => {
            return resolve(wallet);
          });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  // joins and stores a wallet
  public joinWallet(opts): Promise<any> {
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
                this.bwcErrorProvider
                  .cb(err, this.translate.instant('Could not join wallet'))
                  .then((msg: string) => {
                    return reject(msg);
                  });
              } else {
                this.addAndBindWalletClient(walletClient, {
                  bwsurl: opts.bwsurl
                }).then(wallet => {
                  return resolve(wallet);
                });
              }
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
    return new Promise((resolve, reject) => {
      this.logger.info('Deleting Wallet:', wallet.credentials.walletName);
      const walletId = wallet.credentials.walletId;

      wallet.removeAllListeners();

      this.profile.deleteWallet(walletId);

      delete this.wallet[walletId];

      this.persistenceProvider.removeAllWalletData(walletId).catch(err => {
        this.logger.warn('Could not remove all wallet data: ', err);
      });

      this.persistenceProvider
        .storeProfile(this.profile)
        .then(() => {
          return resolve();
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public createDefaultWallet(): Promise<any> {
    return new Promise((resolve, reject) => {
      const opts: Partial<WalletOptions> = {};
      opts.m = 1;
      opts.n = 1;
      opts.networkName = 'livenet';
      opts.coin = Coin.BTC;
      this.createWallet(opts)
        .then(wallet => {
          return resolve(wallet);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public setDisclaimerAccepted(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.profile.disclaimerAccepted = true;
      this.persistenceProvider
        .storeProfile(this.profile)
        .then(() => {
          return resolve();
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public setOnboardingCompleted(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.profile.onboardingCompleted = true;
      this.persistenceProvider
        .storeProfile(this.profile)
        .then(() => {
          return resolve();
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getWallets(opts?) {
    if (opts && !_.isObject(opts)) throw new Error('bad argument');

    opts = opts || {};

    let ret = _.values(this.wallet as any);

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

    if (opts.hasFunds) {
      ret = _.filter(ret, w => {
        if (!w.status) return undefined;
        return w.status.availableBalanceSat > 0;
      });
    }

    if (opts.minAmount) {
      ret = _.filter(ret, w => {
        if (!w.status) return undefined;
        return w.status.availableBalanceSat > opts.minAmount;
      });
    }

    if (opts.onlyComplete) {
      ret = _.filter(ret, w => {
        return w.isComplete();
      });
    } else {
    }

    // Add cached balance async
    _.each(ret, x => {
      this.addLastKnownBalance(x);
    });

    return _.sortBy(ret, 'order');
  }

  public toggleHideBalanceFlag(walletId: string): void {
    this.wallet[walletId].balanceHidden = !this.wallet[walletId].balanceHidden;
    this.persistenceProvider.setHideBalanceFlag(
      walletId,
      this.wallet[walletId].balanceHidden
    );
  }

  public getNotifications(opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};

      const TIME_STAMP = 60 * 60 * 6;
      const MAX = 30;

      const typeFilter = {
        NewOutgoingTx: 1,
        NewIncomingTx: 1
      };

      const w = this.getWallets();
      if (_.isEmpty(w)) return reject('Could not find any wallet');

      const l = w.length;
      let j = 0;
      let notifications = [];

      const isActivityCached = (wallet): boolean => {
        return wallet.cachedActivity && wallet.cachedActivity.isValid;
      };

      const updateNotifications = (wallet): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (isActivityCached(wallet) && !opts.force) {
            return resolve();
          }

          wallet.getNotifications(
            {
              timeSpan: TIME_STAMP,
              includeOwn: true
            },
            (err, n) => {
              if (err) {
                return reject(err);
              }
              wallet.cachedActivity = {
                n: n.slice(-MAX),
                isValid: true
              };

              return resolve();
            }
          );
        });
      };

      const process = notifications => {
        if (!notifications) return [];

        let shown = _.sortBy(notifications, 'createdOn').reverse();

        shown = shown.splice(0, opts.limit || MAX);

        _.each(shown, x => {
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

        const finale = [];
        let prev;

        // Item grouping... DISABLED.

        // REMOVE (if we want 1-to-1 notification) ????
        _.each(shown, x => {
          if (
            prev &&
            prev.walletId === x.walletId &&
            prev.txpId &&
            prev.txpId === x.txpId &&
            prev.creatorId &&
            prev.creatorId === x.creatorId
          ) {
            prev.types.push(x.type);
            prev.data = _.assign(prev.data, x.data);
            prev.txid = prev.txid || x.txid;
            prev.creatorName = prev.creatorName || x.creatorName;
          } else {
            finale.push(x);
            prev = x;
          }
        });

        const u = this.bwcProvider.getUtils();
        _.each(finale, x => {
          if (
            x.data &&
            x.data.message &&
            x.wallet &&
            x.wallet.credentials.sharedEncryptingKey
          ) {
            // TODO TODO TODO => BWC
            x.message = u.decryptMessage(
              x.data.message,
              x.wallet.credentials.sharedEncryptingKey
            );
          }
        });

        return finale;
      };

      const pr = (wallet, cb) => {
        updateNotifications(wallet)
          .then(() => {
            const n = _.filter(wallet.cachedActivity.n, x => {
              return typeFilter[x.type];
            });

            const idToName = {};
            if (wallet.cachedStatus) {
              _.each(wallet.cachedStatus.wallet.copayers, c => {
                idToName[c.id] = c.name;
              });
            }

            _.each(n, x => {
              x.wallet = wallet;
              if (x.creatorId && wallet.cachedStatus) {
                x.creatorName = idToName[x.creatorId];
              }
            });

            notifications.push(n);
            return cb();
          })
          .catch(err => {
            return cb(err);
          });
      };

      _.each(w, wallet => {
        pr(wallet, err => {
          if (err)
            this.logger.warn(
              this.bwcErrorProvider.msg(
                err,
                'Error updating notifications for ' + wallet.name
              )
            );
          if (++j == l) {
            notifications = _.sortBy(notifications, 'createdOn').reverse();
            notifications = _.compact(_.flatten(notifications)).slice(0, MAX);
            const total = notifications.length;
            const processArray = process(notifications);
            return resolve({ notifications: processArray, total });
          }
        });
      });
    });
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
}
