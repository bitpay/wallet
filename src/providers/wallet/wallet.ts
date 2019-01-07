import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events } from 'ionic-angular';
import * as _ from 'lodash';
import encoding from 'text-encoding';

// Providers
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { FilterProvider } from '../filter/filter';
import { CardName } from '../gift-card/gift-card.types';
import { LanguageProvider } from '../language/language';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PopupProvider } from '../popup/popup';
import { RateProvider } from '../rate/rate';
import { TouchIdProvider } from '../touchid/touchid';
import { TxFormatProvider } from '../tx-format/tx-format';

export enum Coin {
  BTC = 'btc',
  BCH = 'bch'
}

export interface WalletOptions {
  name: any;
  m: any;
  n: any;
  myName: any;
  networkName: string;
  bwsurl: any;
  singleAddress: any;
  coin: Coin;
  extendedPrivateKey: any;
  mnemonic: any;
  derivationStrategy: any;
  secret: any;
  account: any;
  passphrase: any;
  walletPrivKey: any;
  compliantDerivation: any;
}

export interface TransactionProposal {
  amount: any;
  toAddress: any;
  outputs: Array<{
    toAddress: any;
    amount: any;
    message: string;
  }>;
  inputs: any;
  fee: any;
  message: string;
  customData?: {
    service?: string;
    giftCardName?: CardName;
    glideraToken?: string;
    shapeShift?: string;
    toWalletName?: any;
  };
  payProUrl: any;
  excludeUnconfirmedUtxos: boolean;
  feePerKb: number;
  feeLevel: string;
  dryRun: boolean;
}

@Injectable()
export class WalletProvider {
  // Ratio low amount warning (fee/amount) in incoming TX
  private LOW_AMOUNT_RATIO: number = 0.15;

  // Ratio of "many utxos" warning in total balance (fee/amount)
  private TOTAL_LOW_WARNING_RATIO: number = 0.3;

  private WALLET_STATUS_MAX_TRIES: number = 7;
  private WALLET_STATUS_DELAY_BETWEEN_TRIES: number = 1.4 * 1000;
  private SOFT_CONFIRMATION_LIMIT: number = 12;
  private SAFE_CONFIRMATIONS: number = 6;

  private errors = this.bwcProvider.getErrors();

  static progressFn = {};

  private isPopupOpen: boolean;
  static updateOnProgress = {};

  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private txFormatProvider: TxFormatProvider,
    private configProvider: ConfigProvider,
    private persistenceProvider: PersistenceProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private rateProvider: RateProvider,
    private filter: FilterProvider,
    private languageProvider: LanguageProvider,
    private popupProvider: PopupProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private touchidProvider: TouchIdProvider,
    private events: Events,
    private feeProvider: FeeProvider,
    private translate: TranslateService
  ) {
    this.logger.debug('WalletProvider initialized');
    this.isPopupOpen = false;
  }

  private invalidateCache(wallet): void {
    if (wallet.cachedStatus) wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory) wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity) wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps) wallet.cachedTxps.isValid = false;
  }

  public getStatus(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      const walletId = wallet.id;

      const processPendingTxps = status => {
        const txps = status.pendingTxps;
        const now = Math.floor(Date.now() / 1000);

        _.each(txps, tx => {
          tx = this.txFormatProvider.processTx(
            wallet.coin,
            tx,
            this.useLegacyAddress()
          );

          // no future transactions...
          if (tx.createdOn > now) tx.createdOn = now;

          tx.wallet = wallet;

          if (!tx.wallet) {
            this.logger.error('no wallet at txp?');
            return;
          }

          const action = _.find(tx.actions, {
            copayerId: tx.wallet.copayerId
          });

          if (!action && tx.status == 'pending') {
            tx.pendingForUs = true;
          }

          if (action && action.type == 'accept') {
            tx.statusForUs = 'accepted';
          } else if (action && action.type == 'reject') {
            tx.statusForUs = 'rejected';
          } else {
            tx.statusForUs = 'pending';
          }

          if (!tx.deleteLockTime) tx.canBeRemoved = true;
        });
        wallet.pendingTxps = txps;
      };

      const get = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          wallet.getStatus({}, (err, ret) => {
            if (err) {
              if (err instanceof this.errors.NOT_AUTHORIZED) {
                return reject('WALLET_NOT_REGISTERED');
              }
              return reject(err);
            }
            return resolve(ret);
          });
        });
      };

      const cacheBalance = (wallet, balance): void => {
        if (!balance) return;

        const configGet = this.configProvider.get();
        const config = configGet.wallet;

        const cache = wallet.cachedStatus;

        // Address with Balance
        cache.balanceByAddress = balance.byAddress;

        // Total wallet balance is same regardless of 'spend unconfirmed funds' setting.
        cache.totalBalanceSat = balance.totalAmount;

        // Spend unconfirmed funds
        if (config.spendUnconfirmed) {
          cache.lockedBalanceSat = balance.lockedAmount;
          cache.availableBalanceSat = balance.availableAmount;
          cache.totalBytesToSendMax = balance.totalBytesToSendMax;
          cache.pendingAmount = 0;
          cache.spendableAmount = balance.totalAmount - balance.lockedAmount;
        } else {
          cache.lockedBalanceSat = balance.lockedConfirmedAmount;
          cache.availableBalanceSat = balance.availableConfirmedAmount;
          cache.totalBytesToSendMax = balance.totalBytesToSendConfirmedMax;
          cache.pendingAmount =
            balance.totalAmount - balance.totalConfirmedAmount;
          cache.spendableAmount =
            balance.totalConfirmedAmount - balance.lockedAmount;
        }

        // Selected unit
        cache.unitToSatoshi = config.settings.unitToSatoshi;
        cache.satToUnit = 1 / cache.unitToSatoshi;

        // STR
        cache.totalBalanceStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          cache.totalBalanceSat
        );
        cache.lockedBalanceStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          cache.lockedBalanceSat
        );
        cache.availableBalanceStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          cache.availableBalanceSat
        );
        cache.spendableBalanceStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          cache.spendableAmount
        );
        cache.pendingBalanceStr = this.txFormatProvider.formatAmountStr(
          wallet.coin,
          cache.pendingAmount
        );

        cache.alternativeName = config.settings.alternativeName;
        cache.alternativeIsoCode = config.settings.alternativeIsoCode;

        // Check address
        this.isAddressUsed(wallet, balance.byAddress)
          .then(used => {
            const isSingleAddress =
              wallet &&
              wallet.cachedStatus &&
              wallet.cachedStatus.wallet &&
              wallet.cachedStatus.wallet.singleAddress;
            if (used && !isSingleAddress) {
              this.logger.debug('Address used. Creating new');
              // Force new address
              this.getAddress(wallet, true)
                .then(addr => {
                  this.logger.debug('New address: ', addr);
                })
                .catch(err => {
                  return reject(err);
                });
            }
          })
          .catch(err => {
            return reject(err);
          });

        this.rateProvider
          .whenRatesAvailable(wallet.coin)
          .then(() => {
            const totalBalanceAlternative = this.rateProvider.toFiat(
              cache.totalBalanceSat,
              cache.alternativeIsoCode,
              wallet.coin
            );
            const pendingBalanceAlternative = this.rateProvider.toFiat(
              cache.pendingAmount,
              cache.alternativeIsoCode,
              wallet.coin
            );
            const lockedBalanceAlternative = this.rateProvider.toFiat(
              cache.lockedBalanceSat,
              cache.alternativeIsoCode,
              wallet.coin
            );
            const spendableBalanceAlternative = this.rateProvider.toFiat(
              cache.spendableAmount,
              cache.alternativeIsoCode,
              wallet.coin
            );
            const alternativeConversionRate = this.rateProvider.toFiat(
              100000000,
              cache.alternativeIsoCode,
              wallet.coin
            );

            cache.totalBalanceAlternative = this.filter.formatFiatAmount(
              totalBalanceAlternative
            );
            cache.pendingBalanceAlternative = this.filter.formatFiatAmount(
              pendingBalanceAlternative
            );
            cache.lockedBalanceAlternative = this.filter.formatFiatAmount(
              lockedBalanceAlternative
            );
            cache.spendableBalanceAlternative = this.filter.formatFiatAmount(
              spendableBalanceAlternative
            );
            cache.alternativeConversionRate = this.filter.formatFiatAmount(
              alternativeConversionRate
            );

            cache.alternativeBalanceAvailable = true;
            cache.isRateAvailable = true;
          })
          .catch(err => {
            this.logger.warn('Could not get rates: ', err);
          });
      };

      const isStatusCached = (): boolean => {
        return wallet.cachedStatus && wallet.cachedStatus.isValid;
      };

      const cacheStatus = (status): void => {
        if (status.wallet && status.wallet.scanStatus == 'running') return;

        wallet.cachedStatus = status || {};
        const cache = wallet.cachedStatus;
        cache.statusUpdatedOn = Date.now();
        cache.isValid = true;
        cache.email = status.preferences ? status.preferences.email : null;
        cacheBalance(wallet, status.balance);
      };

      const walletStatusHash = (status): string => {
        return status ? status.balance.totalAmount : wallet.totalBalanceSat;
      };

      const _getStatus = (initStatusHash, tries: number): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (isStatusCached() && !opts.force) {
            this.logger.debug('Wallet status cache hit:' + wallet.id);
            cacheStatus(wallet.cachedStatus);
            processPendingTxps(wallet.cachedStatus);
            return resolve(wallet.cachedStatus);
          }

          tries = tries || 0;

          this.logger.debug(
            'Updating Status:',
            wallet.credentials.walletName,
            tries
          );
          get()
            .then(status => {
              const currentStatusHash = walletStatusHash(status);
              this.logger.debug(
                'Status update. hash:' + currentStatusHash + ' Try:' + tries
              );
              if (
                opts.untilItChanges &&
                initStatusHash == currentStatusHash &&
                tries < this.WALLET_STATUS_MAX_TRIES &&
                walletId == wallet.credentials.walletId
              ) {
                return setTimeout(() => {
                  this.logger.debug(
                    'Retrying update... ' + walletId + ' Try:' + tries
                  );
                  return _getStatus(initStatusHash, ++tries);
                }, this.WALLET_STATUS_DELAY_BETWEEN_TRIES * tries);
              }

              processPendingTxps(status);

              this.logger.debug(
                'Got Wallet Status for: ' + wallet.credentials.walletName
              );

              cacheStatus(status);

              wallet.scanning =
                status.wallet && status.wallet.scanStatus == 'running';

              return resolve(status);
            })
            .catch(err => {
              return reject(err);
            });
        });
      };

      _getStatus(walletStatusHash(null), 0)
        .then(status => {
          resolve(status);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  // Check address
  private isAddressUsed(wallet, byAddress): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getLastAddress(wallet.id)
        .then(addr => {
          const used = _.find(byAddress, {
            address: addr
          });
          return resolve(used);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public useLegacyAddress(): boolean {
    const config = this.configProvider.get();
    const walletSettings = config.wallet;

    return walletSettings.useLegacyAddress;
  }

  public getAddressView(
    coin: string,
    network: string,
    address: string
  ): string {
    if (coin != 'bch' || this.useLegacyAddress()) return address;
    const protoAddr = this.getProtoAddress(
      coin,
      network,
      this.txFormatProvider.toCashAddress(address)
    );
    return protoAddr;
  }

  public getProtoAddress(
    coin: string,
    network: string,
    address: string
  ): string {
    const proto: string = this.getProtocolHandler(coin, network);
    const protoAddr: string = proto + ':' + address;
    return protoAddr;
  }

  public getAddress(wallet, forceNew: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getLastAddress(wallet.id)
        .then(addr => {
          if (!forceNew && addr) return resolve(addr);

          if (!wallet.isComplete())
            return reject(this.bwcErrorProvider.msg('WALLET_NOT_COMPLETE'));

          if (wallet.needsBackup) {
            return reject(this.bwcErrorProvider.msg('WALLET_NEEDS_BACKUP'));
          }

          this.createAddress(wallet)
            .then(_addr => {
              this.persistenceProvider
                .storeLastAddress(wallet.id, _addr)
                .then(() => {
                  return resolve(_addr);
                })
                .catch(err => {
                  return reject(err);
                });
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

  private createAddress(wallet): Promise<string> {
    return new Promise((resolve, reject) => {
      this.logger.info('Creating address for wallet:', wallet.id);

      wallet.createAddress({}, (err, addr) => {
        if (err) {
          let prefix = this.translate.instant('Could not create address');
          if (
            err instanceof this.errors.MAIN_ADDRESS_GAP_REACHED ||
            (err.message && err.message == 'MAIN_ADDRESS_GAP_REACHED')
          ) {
            this.logger.warn(this.bwcErrorProvider.msg(err, 'Server Error'));
            prefix = null;
            if (!this.isPopupOpen) {
              this.isPopupOpen = true;
              this.popupProvider
                .ionicAlert(
                  null,
                  this.bwcErrorProvider.msg('MAIN_ADDRESS_GAP_REACHED')
                )
                .then(() => {
                  this.isPopupOpen = false;
                });
            }
            wallet.getMainAddresses(
              {
                reverse: true,
                limit: 1
              },
              (err, addr) => {
                if (err) return reject(err);
                return resolve(addr[0].address);
              }
            );
          } else {
            this.bwcErrorProvider.cb(err, prefix).then(msg => {
              return reject(msg);
            });
          }
        } else return resolve(addr.address);
      });
    });
  }

  private getSavedTxs(walletId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getTxHistory(walletId)
        .then(txs => {
          let localTxs = [];

          if (_.isEmpty(txs)) {
            return resolve(localTxs);
          }

          localTxs = txs;
          return resolve(_.compact(localTxs));
        })
        .catch((err: Error) => {
          return reject(err);
        });
    });
  }

  private getTxsFromServer(
    wallet,
    skip: number,
    endingTxid: string,
    limit: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let res = [];

      const result = {
        res,
        shouldContinue: res.length >= limit
      };

      wallet.getTxHistory(
        {
          skip,
          limit
        },
        (err: Error, txsFromServer) => {
          if (err) return reject(err);

          if (_.isEmpty(txsFromServer)) return resolve(result);

          res = _.takeWhile(txsFromServer, tx => {
            return tx.txid != endingTxid;
          });

          result.res = res;
          result.shouldContinue = res.length >= limit;

          return resolve(result);
        }
      );
    });
  }

  private updateLocalTxHistory(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};
      const FIRST_LIMIT = 5;
      const LIMIT = 50;
      let requestLimit = FIRST_LIMIT;
      const walletId = wallet.credentials.walletId;
      WalletProvider.progressFn[walletId] = opts.progressFn || (() => {});
      let foundLimitTx = [];

      const fixTxsUnit = (txs): void => {
        if (!txs || !txs[0] || !txs[0].amountStr) return;

        const cacheCoin: string = txs[0].amountStr.split(' ')[1];

        if (cacheCoin == 'bits') {
          this.logger.debug('Fixing Tx Cache Unit to: ' + wallet.coin);
          _.each(txs, tx => {
            tx.amountStr = this.txFormatProvider.formatAmountStr(
              wallet.coin,
              tx.amount
            );
            tx.feeStr = this.txFormatProvider.formatAmountStr(
              wallet.coin,
              tx.fees
            );
          });
        }
      };

      if (WalletProvider.updateOnProgress[wallet.id]) {
        this.logger.info(
          'History update already on progress for: ' +
            wallet.credentials.walletName
        );

        if (opts.progressFn) {
          this.logger.debug('Rewriting progressFn');
          WalletProvider.progressFn[walletId] = opts.progressFn;
        }
        return; // no callback call yet.
      }

      WalletProvider.updateOnProgress[wallet.id] = true;

      this.logger.debug(
        'Trying to download Tx history for: ' +
          walletId +
          '. If it fails retry in 5 secs'
      );
      this.getSavedTxs(walletId)
        .then(txsFromLocal => {
          fixTxsUnit(txsFromLocal);

          const confirmedTxs = this.removeAndMarkSoftConfirmedTx(txsFromLocal);
          const endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
          const endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;

          // First update
          WalletProvider.progressFn[walletId](txsFromLocal, 0);
          wallet.completeHistory = txsFromLocal;

          const getNewTxs = (newTxs, skip: number): Promise<any> => {
            return new Promise((resolve, reject) => {
              this.getTxsFromServer(wallet, skip, endingTxid, requestLimit)
                .then(result => {
                  const res = result.res;
                  const shouldContinue = result.shouldContinue
                    ? result.shouldContinue
                    : false;

                  newTxs = newTxs.concat(
                    this.processNewTxs(wallet, _.compact(res))
                  );
                  WalletProvider.progressFn[walletId](
                    newTxs.concat(txsFromLocal),
                    newTxs.length
                  );
                  skip = skip + requestLimit;
                  this.logger.debug(
                    'Syncing TXs for:' +
                      walletId +
                      '. Got:' +
                      newTxs.length +
                      ' Skip:' +
                      skip,
                    ' EndingTxid:',
                    endingTxid,
                    ' Continue:',
                    shouldContinue
                  );

                  // TODO Dirty <HACK>
                  // do not sync all history, just looking for a single TX.
                  if (opts.limitTx) {
                    foundLimitTx = _.find(newTxs, {
                      txid: opts.limitTx
                    });
                    if (!_.isEmpty(foundLimitTx)) {
                      this.logger.debug('Found limitTX: ' + opts.limitTx);
                      return resolve([foundLimitTx]);
                    }
                  }
                  // </HACK>
                  if (!shouldContinue) {
                    this.logger.debug(
                      'Finished Sync: New / soft confirmed Txs: ' +
                        newTxs.length
                    );
                    return resolve(newTxs);
                  }

                  requestLimit = LIMIT;
                  return getNewTxs(newTxs, skip).then(txs => {
                    resolve(txs);
                  });
                })
                .catch(err => {
                  if (
                    err instanceof this.errors.CONNECTION_ERROR ||
                    (err.message && err.message.match(/5../))
                  ) {
                    return setTimeout(() => {
                      return getNewTxs(newTxs, skip)
                        .then(txs => {
                          resolve(txs);
                        })
                        .catch(err => {
                          return reject(err);
                        });
                    }, 5000);
                  } else {
                    return reject(err);
                  }
                });
            });
          };

          getNewTxs([], 0)
            .then(txs => {
              const array = _.compact(txs.concat(confirmedTxs));
              const newHistory = _.uniqBy(array, x => {
                return (x as any).txid;
              });

              const updateNotes = (): Promise<any> => {
                return new Promise((resolve, reject) => {
                  if (!endingTs) return resolve();

                  this.logger.debug('Syncing notes from: ' + endingTs);
                  wallet.getTxNotes(
                    {
                      minTs: endingTs
                    },
                    (err, notes) => {
                      if (err) {
                        this.logger.warn('Could not get TxNotes: ', err);
                        return reject(err);
                      }
                      _.each(notes, note => {
                        this.logger.debug('Note for ' + note.txid);
                        _.each(newHistory, (tx: any) => {
                          if (tx.txid == note.txid) {
                            this.logger.debug(
                              '...updating note for ' + note.txid
                            );
                            tx.note = note;
                          }
                        });
                      });
                      return resolve();
                    }
                  );
                });
              };

              const updateLowAmount = txs => {
                if (!opts.lowAmount) return;

                _.each(txs, tx => {
                  tx.lowAmount = tx.amount < opts.lowAmount;
                });
              };

              this.getLowAmount(wallet).then(fee => {
                opts.lowAmount = fee;
                updateLowAmount(txs);
              });

              updateNotes()
                .then(() => {
                  // <HACK>
                  if (!_.isEmpty(foundLimitTx)) {
                    this.logger.debug(
                      'Tx history read until limitTx: ' + opts.limitTx
                    );
                    return resolve(newHistory);
                  }
                  // </HACK>

                  const historyToSave = JSON.stringify(newHistory);
                  _.each(txs, tx => {
                    tx.recent = true;
                  });
                  this.logger.debug(
                    'Tx History synced. Total Txs: ' + newHistory.length
                  );

                  // Final update
                  if (walletId == wallet.credentials.walletId) {
                    wallet.completeHistory = newHistory;
                  }

                  return this.persistenceProvider
                    .setTxHistory(walletId, historyToSave)
                    .then(() => {
                      this.logger.debug('Tx History saved.');
                      return resolve();
                    })
                    .catch(err => {
                      return reject(err);
                    });
                })
                .catch(err => {
                  return reject(err);
                });
            })
            .catch(err => {
              WalletProvider.updateOnProgress[walletId] = false;
              return reject(err);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private processNewTxs(wallet, txs) {
    const now = Math.floor(Date.now() / 1000);
    const txHistoryUnique = {};
    const ret = [];
    wallet.hasUnsafeConfirmed = false;

    _.each(txs, tx => {
      tx = this.txFormatProvider.processTx(
        wallet.coin,
        tx,
        this.useLegacyAddress()
      );

      // no future transactions...
      if (tx.time > now) tx.time = now;

      if (tx.confirmations >= this.SAFE_CONFIRMATIONS) {
        tx.safeConfirmed = this.SAFE_CONFIRMATIONS + '+';
      } else {
        tx.safeConfirmed = false;
        wallet.hasUnsafeConfirmed = true;
      }

      if (tx.note) {
        delete tx.note.encryptedEditedByName;
        delete tx.note.encryptedBody;
      }

      if (!txHistoryUnique[tx.txid]) {
        ret.push(tx);
        txHistoryUnique[tx.txid] = true;
      } else {
        this.logger.debug('Ignoring duplicate TX in history: ' + tx.txid);
      }
    });

    return ret;
  }

  public removeAndMarkSoftConfirmedTx(txs): any[] {
    return _.filter(txs, tx => {
      if (tx.confirmations >= this.SOFT_CONFIRMATION_LIMIT) return tx;
      tx.recent = true;
    });
  }

  // Approx utxo amount, from which the uxto is economically redeemable
  public getLowAmount(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getMinFee(wallet)
        .then(fee => {
          const minFee: number = fee;
          return resolve(minFee / this.LOW_AMOUNT_RATIO);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  // Approx utxo amount, from which the uxto is economically redeemable
  public getMinFee(wallet, nbOutputs?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.feeProvider
        .getFeeLevels(wallet.coin)
        .then(data => {
          const normalLevelRate = _.find(data.levels[wallet.network], level => {
            return level.level === 'normal';
          });
          const lowLevelRate: string = (
            normalLevelRate.feePerKb / 1000
          ).toFixed(0);
          const size = this.getEstimatedTxSize(wallet, nbOutputs);
          return resolve(size * parseInt(lowLevelRate, 10));
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  // These 2 functions were taken from
  // https://github.com/bitpay/bitcore-wallet-service/blob/master/lib/model/txproposal.js#L243
  private getEstimatedSizeForSingleInput(wallet): number {
    switch (wallet.credentials.addressType) {
      case 'P2PKH':
        return 147;
      default:
      case 'P2SH':
        return wallet.m * 72 + wallet.n * 36 + 44;
    }
  }

  private getEstimatedTxSize(wallet, nbOutputs?: number): number {
    // Note: found empirically based on all multisig P2SH inputs and within m & n allowed limits.
    nbOutputs = nbOutputs ? nbOutputs : 2; // Assume 2 outputs
    const safetyMargin = 0.02;
    const overhead = 4 + 4 + 9 + 9;
    const inputSize = this.getEstimatedSizeForSingleInput(wallet);
    const outputSize = 34;
    const nbInputs = 1; // Assume 1 input

    const size = overhead + inputSize * nbInputs + outputSize * nbOutputs;
    return parseInt((size * (1 + safetyMargin)).toFixed(0), 10);
  }

  public getTxNote(wallet, txid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.getTxNote(
        {
          txid
        },
        (err, note) => {
          if (err) return reject(err);
          return resolve(note);
        }
      );
    });
  }

  public editTxNote(wallet, args): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.editTxNote(args, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  public getTxp(wallet, txpid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.getTx(txpid, (err, txp) => {
        if (err) return reject(err);
        return resolve(txp);
      });
    });
  }

  public getTx(wallet, txid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const finish = list => {
        const tx = _.find(list, {
          txid
        });

        if (!tx) return reject('Could not get transaction');
        return tx;
      };

      if (wallet.completeHistory && wallet.completeHistory.isValid) {
        const tx = finish(wallet.completeHistory);
        return resolve(tx);
      } else {
        const opts = {
          force: true
        };
        this.getTxHistory(wallet, opts)
          .then(txHistory => {
            const tx = finish(txHistory);
            return resolve(tx);
          })
          .catch(err => {
            return reject(err);
          });
      }
    });
  }

  public getTxHistory(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};

      if (!wallet.isComplete()) return resolve();

      const isHistoryCached = () => {
        return wallet.completeHistory && wallet.completeHistory.isValid;
      };

      if (isHistoryCached() && !opts.force)
        return resolve(wallet.completeHistory);

      this.logger.info('Updating Transaction History');
      this.updateLocalTxHistory(wallet, opts)
        .then(txs => {
          if (opts.limitTx) {
            return resolve(txs);
          }

          wallet.completeHistory.isValid = true;
          return resolve(wallet.completeHistory);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public isEncrypted(wallet): boolean {
    if (_.isEmpty(wallet)) return undefined;
    const isEncrypted = wallet.isPrivKeyEncrypted();
    if (isEncrypted) this.logger.debug('Wallet is encrypted');
    return isEncrypted;
  }

  public createTx(
    wallet,
    txp: Partial<TransactionProposal>
  ): Promise<TransactionProposal> {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(txp) || _.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      wallet.createTxProposal(txp, (err, createdTxp) => {
        if (err) return reject(err);
        else {
          this.logger.debug('Transaction created');
          return resolve(createdTxp);
        }
      });
    });
  }

  public publishTx(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(txp) || _.isEmpty(wallet))
        return reject('MISSING_PARAMETER');
      wallet.publishTxProposal(
        {
          txp
        },
        (err, publishedTx) => {
          if (err) return reject(err);
          else {
            this.logger.debug('Transaction published');
            return resolve(publishedTx);
          }
        }
      );
    });
  }

  public signTx(wallet, txp, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet || !txp) return reject('MISSING_PARAMETER');

      try {
        wallet.signTxProposal(txp, password, (err, signedTxp) => {
          if (err) {
            this.logger.error('Transaction signed err: ', err);
            return reject(err);
          }
          return resolve(signedTxp);
        });
      } catch (e) {
        this.logger.error('Error at signTxProposal:', e);
        return reject(e);
      }
    });
  }

  public broadcastTx(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(txp) || _.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      if (txp.status != 'accepted') return reject('TX_NOT_ACCEPTED');

      wallet.broadcastTxProposal(txp, (err, broadcastedTxp, memo) => {
        if (err) {
          if (_.isArrayBuffer(err)) {
            const enc = new encoding.TextDecoder();
            err = enc.decode(err);
            this.removeTx(wallet, txp);
            return reject(err);
          } else {
            return reject(err);
          }
        }

        this.logger.info('Transaction broadcasted');
        if (memo) this.logger.info('Memo: ', memo);

        return resolve(broadcastedTxp);
      });
    });
  }

  public rejectTx(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(txp) || _.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      wallet.rejectTxProposal(txp, null, (err, rejectedTxp) => {
        if (err) return reject(err);
        this.logger.debug('Transaction rejected');
        return resolve(rejectedTxp);
      });
    });
  }

  public removeTx(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (_.isEmpty(txp) || _.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      wallet.removeTxProposal(txp, err => {
        this.logger.debug('Transaction removed');

        this.invalidateCache(wallet);
        this.events.publish('Local/TxAction', wallet.id);
        return resolve(err);
      });
    });
  }

  public updateRemotePreferences(clients, prefs?): Promise<any> {
    return new Promise((resolve, reject) => {
      prefs = prefs ? prefs : {};

      if (!_.isArray(clients)) clients = [clients];

      const updateRemotePreferencesFor = (clients, prefs): Promise<any> => {
        return new Promise((resolve, reject) => {
          const wallet = clients.shift();
          if (!wallet) return resolve();
          this.logger.debug(
            'Saving remote preferences',
            wallet.credentials.walletName,
            prefs
          );

          wallet.savePreferences(prefs, err => {
            if (err) {
              this.popupProvider.ionicAlert(
                this.bwcErrorProvider.msg(
                  err,
                  this.translate.instant(
                    'Could not save preferences on the server'
                  )
                )
              );
              return reject(err);
            }

            updateRemotePreferencesFor(clients, prefs)
              .then(() => {
                return resolve();
              })
              .catch(err => {
                return reject(err);
              });
          });
        });
      };

      // Update this JIC.
      const config = this.configProvider.get();

      // Get email from local config
      prefs.email = config.emailNotifications.email;

      // Get current languge
      prefs.language = this.languageProvider.getCurrent();

      // Set OLD wallet in bits to btc
      prefs.unit = 'btc'; // DEPRECATED

      updateRemotePreferencesFor(_.clone(clients), prefs)
        .then(() => {
          this.logger.debug(
            'Remote preferences saved for' +
              _.map(clients, (x: any) => {
                return x.credentials.walletId;
              }).join(',')
          );

          _.each(clients, c => {
            c.preferences = _.assign(prefs, c.preferences);
          });
          return resolve();
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public recreate(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Recreating wallet:', wallet.id);
      wallet.recreateWallet(err => {
        wallet.notAuthorized = false;
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  public startScan(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Scanning wallet ' + wallet.id);
      if (!wallet.isComplete())
        return reject('Wallet incomplete: ' + wallet.name);

      wallet.scanning = true;
      wallet.startScan(
        {
          includeCopayerBranches: true
        },
        err => {
          if (err) return reject(err);
          return resolve();
        }
      );
    });
  }

  public clearTxHistory(wallet): void {
    this.invalidateCache(wallet);
    this.persistenceProvider.removeTxHistory(wallet.id);
  }

  public expireAddress(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.info('Cleaning Address ' + wallet.id);
      this.persistenceProvider
        .clearLastAddress(wallet.id)
        .then(() => {
          return resolve();
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getMainAddresses(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      opts.reverse = true;
      wallet.getMainAddresses(opts, (err, addresses) => {
        if (err) return reject(err);
        return resolve(addresses);
      });
    });
  }

  public getBalance(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      wallet.getBalance(opts, (err, resp) => {
        if (err) return reject(err);
        return resolve(resp);
      });
    });
  }

  public getLowUtxos(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.getUtxos(
        {
          coin: wallet.coin
        },
        (err, resp) => {
          if (err || !resp || !resp.length)
            return reject(err ? err : 'No UTXOs');

          this.getMinFee(wallet, resp.length).then(fee => {
            const minFee = fee;
            const balance = _.sumBy(resp, 'satoshis');

            // for 2 outputs
            this.getLowAmount(wallet).then(fee => {
              const lowAmount = fee;
              const lowUtxos = _.filter(resp, x => {
                return x.satoshis < lowAmount;
              });

              const totalLow = _.sumBy(lowUtxos, 'satoshis');
              return resolve({
                allUtxos: resp || [],
                lowUtxos: lowUtxos || [],
                totalLow,
                warning: minFee / balance > this.TOTAL_LOW_WARNING_RATIO,
                minFee
              });
            });
          });
        }
      );
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

  public encrypt(walletsArray): Promise<any> {
    return new Promise((resolve, reject) => {
      let title = this.translate.instant('Enter a new encrypt password');
      const warnMsg = this.translate.instant(
        'Your wallet key will be encrypted. The encrypt password cannot be recovered. Be sure to write it down.'
      );
      this.askPassword(warnMsg, title)
        .then((password: string) => {
          if (_.isNull(password)) {
            return reject();
          }
          if (password == '') {
            return reject(this.translate.instant('No password'));
          }
          title = this.translate.instant('Confirm your new encrypt password');
          this.askPassword(warnMsg, title)
            .then((password2: string) => {
              if (_.isNull(password2)) {
                return reject();
              }
              if (password != password2)
                return reject(this.translate.instant('Password mismatch'));
              walletsArray.forEach(wallet => {
                wallet.encryptPrivateKey(password);
              });
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

  public decrypt(walletsArray): Promise<any> {
    return new Promise((resolve, reject) => {
      this.askPassword(
        null,
        this.translate.instant('Enter encrypt password')
      ).then((password: string) => {
        if (_.isNull(password)) {
          return reject();
        }
        if (password == '') {
          return reject(this.translate.instant('No password'));
        }
        try {
          walletsArray.forEach(wallet => {
            this.logger.info(
              'Disabling private key encryption for' + wallet.name
            );
            wallet.decryptPrivateKey(password);
          });
        } catch (e) {
          return reject(this.translate.instant('Wrong password'));
        }
        return resolve();
      });
    });
  }

  public handleEncryptedWallet(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isEncrypted(wallet)) return resolve();
      this.askPassword(
        null,
        this.translate.instant('Enter encrypt password')
      ).then((password: string) => {
        if (_.isNull(password)) {
          return reject(new Error('PASSWORD_CANCELLED'));
        }
        if (password == '') {
          return reject(new Error('NO_PASSWORD'));
        }
        if (!wallet.checkPassword(password))
          return reject(new Error('WRONG_PASSWORD'));
        return resolve(password);
      });
    });
  }

  public reject(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      this.rejectTx(wallet, txp)
        .then(txpr => {
          this.invalidateCache(wallet);
          this.events.publish('Local/TxAction', wallet.id);
          return resolve(txpr);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public onlyPublish(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      this.publishTx(wallet, txp)
        .then(() => {
          this.invalidateCache(wallet);
          this.events.publish('Local/TxAction', wallet.id);
          return resolve();
        })
        .catch(err => {
          return reject(this.bwcErrorProvider.msg(err));
        });
    });
  }

  public prepare(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.touchidProvider
        .checkWallet(wallet)
        .then(() => {
          this.handleEncryptedWallet(wallet)
            .then((password: string) => {
              return resolve(password);
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

  private signAndBroadcast(wallet, publishedTxp, password): Promise<any> {
    return new Promise((resolve, reject) => {
      this.onGoingProcessProvider.set('signingTx');
      this.signTx(wallet, publishedTxp, password)
        .then(signedTxp => {
          this.invalidateCache(wallet);
          if (signedTxp.status == 'accepted') {
            this.onGoingProcessProvider.set('broadcastingTx');
            this.broadcastTx(wallet, signedTxp)
              .then(broadcastedTxp => {
                this.events.publish('Local/TxAction', wallet.id);
                return resolve(broadcastedTxp);
              })
              .catch(err => {
                return reject(this.bwcErrorProvider.msg(err));
              });
          } else {
            this.events.publish('Local/TxAction', wallet.id);
            return resolve(signedTxp);
          }
        })
        .catch(err => {
          const msg =
            err && err.message
              ? err.message
              : this.translate.instant(
                  'The payment was created but could not be completed. Please try again from home screen'
                );
          this.logger.error('Sign error: ' + msg);
          this.events.publish('Local/TxAction', wallet.id);
          return reject(msg);
        });
    });
  }

  public publishAndSign(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      // Already published?
      if (txp.status == 'pending') {
        this.prepare(wallet)
          .then((password: string) => {
            this.signAndBroadcast(wallet, txp, password)
              .then(broadcastedTxp => {
                return resolve(broadcastedTxp);
              })
              .catch(err => {
                return reject(err);
              });
          })
          .catch(err => {
            return reject(err);
          });
      } else {
        this.prepare(wallet)
          .then((password: string) => {
            this.onGoingProcessProvider.set('sendingTx');
            this.publishTx(wallet, txp)
              .then(publishedTxp => {
                this.signAndBroadcast(wallet, publishedTxp, password)
                  .then(broadcastedTxp => {
                    return resolve(broadcastedTxp);
                  })
                  .catch(err => {
                    return reject(err);
                  });
              })
              .catch(err => {
                return reject(err);
              });
          })
          .catch(err => {
            return reject(err);
          });
      }
    });
  }

  public getEncodedWalletInfo(wallet, password?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const derivationPath = wallet.credentials.getBaseAddressDerivationPath();
      const encodingType = {
        mnemonic: 1,
        xpriv: 2,
        xpub: 3
      };
      let info: any = {};

      // not supported yet
      if (wallet.credentials.derivationStrategy != 'BIP44' || !wallet.canSign())
        return reject(
          this.translate.instant(
            'Exporting via QR not supported for this wallet'
          )
        );

      const keys = this.getKeysWithPassword(wallet, password);

      if (keys.mnemonic) {
        info = {
          type: encodingType.mnemonic,
          data: keys.mnemonic
        };
      } else {
        info = {
          type: encodingType.xpriv,
          data: keys.xPrivKey
        };
      }

      return resolve(
        info.type +
          '|' +
          info.data +
          '|' +
          wallet.credentials.network.toLowerCase() +
          '|' +
          derivationPath +
          '|' +
          wallet.credentials.mnemonicHasPassphrase +
          '|' +
          wallet.coin
      );
    });
  }

  public getKeysWithPassword(wallet, password: string) {
    try {
      return wallet.getKeys(password);
    } catch (e) {
      this.logger.error(e);
    }
  }

  public setTouchId(walletsArray, enabled: boolean): Promise<any> {
    const opts = {
      touchIdFor: {}
    };
    walletsArray.forEach(wallet => {
      opts.touchIdFor[wallet.id] = enabled;
    });
    const promise = this.touchidProvider.checkWallet(walletsArray[0]);
    return promise.then(() => {
      this.configProvider.set(opts);
      return Promise.resolve();
    });
  }

  public getKeys(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.prepare(wallet)
        .then((password: string) => {
          let keys;
          try {
            keys = wallet.getKeys(password);
          } catch (e) {
            return reject(e);
          }
          return resolve(keys);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getMnemonicAndPassword(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      this.prepare(wallet)
        .then((password: string) => {
          let keys;
          try {
            keys = wallet.getKeys(password);
          } catch (e) {
            return reject(e);
          }
          const mnemonic = keys.mnemonic;
          return resolve({ mnemonic, password });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getSendMaxInfo(wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      wallet.getSendMaxInfo(opts, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  public getProtocolHandler(coin: string, network?: string): string {
    if (coin == 'bch') {
      return network == 'testnet' ? 'bchtest' : 'bitcoincash';
    } else {
      return 'bitcoin';
    }
  }

  public copyCopayers(wallet, newWallet): Promise<any> {
    return new Promise((resolve, reject) => {
      const walletPrivKey = this.bwcProvider
        .getBitcore()
        .PrivateKey.fromString(wallet.credentials.walletPrivKey);
      let copayer = 1;
      let i = 0;

      _.each(wallet.credentials.publicKeyRing, item => {
        const name = item.copayerName || 'copayer ' + copayer++;
        newWallet._doJoinWallet(
          newWallet.credentials.walletId,
          walletPrivKey,
          item.xPubKey,
          item.requestPubKey,
          name,
          {
            coin: newWallet.credentials.coin
          },
          err => {
            // Ignore error is copayer already in wallet
            if (err && !(err instanceof this.errors.COPAYER_IN_WALLET))
              return reject(err);
            if (++i == wallet.credentials.publicKeyRing.length)
              return resolve();
          }
        );
      });
    });
  }
}
