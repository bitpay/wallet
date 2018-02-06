import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import * as lodash from 'lodash';
import { TranslateService } from '@ngx-translate/core';

// Providers
import { ConfigProvider } from '../config/config';
import { BwcProvider } from '../bwc/bwc';
import { TxFormatProvider } from '../tx-format/tx-format';
import { PersistenceProvider } from '../persistence/persistence';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { RateProvider } from '../rate/rate';
import { FilterProvider } from '../filter/filter';
import { PopupProvider } from '../popup/popup';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { TouchIdProvider } from '../touchid/touchid';
import { FeeProvider } from '../fee/fee';

@Injectable()
export class WalletProvider {

  // Ratio low amount warning (fee/amount) in incoming TX
  private LOW_AMOUNT_RATIO: number = 0.15;

  // Ratio of "many utxos" warning in total balance (fee/amount)
  private TOTAL_LOW_WARNING_RATIO: number = .3;

  private WALLET_STATUS_MAX_TRIES: number = 7;
  private WALLET_STATUS_DELAY_BETWEEN_TRIES: number = 1.4 * 1000;
  private SOFT_CONFIRMATION_LIMIT: number = 12;
  private SAFE_CONFIRMATIONS: number = 6;

  private errors: any = this.bwcProvider.getErrors();

  private progressFn = {};

  /* TODO: update on progress
  private updateOnProgress = {}
   */

  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private txFormatProvider: TxFormatProvider,
    private configProvider: ConfigProvider,
    private persistenceProvider: PersistenceProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private rateProvider: RateProvider,
    private filter: FilterProvider,
    private popupProvider: PopupProvider,
    private ongoingProcessProvider: OnGoingProcessProvider,
    private touchidProvider: TouchIdProvider,
    private events: Events,
    private feeProvider: FeeProvider,
    private translate: TranslateService
  ) {
    this.logger.info('WalletService initialized.');
  }



  private invalidateCache(wallet: any) {
    if (wallet.cachedStatus)
      wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory)
      wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity)
      wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps)
      wallet.cachedTxps.isValid = false;
  }

  getStatus(wallet: any, opts: any) {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      var walletId = wallet.id;

      let processPendingTxps = (status: any) => {
        let txps = status.pendingTxps;
        let now = Math.floor(Date.now() / 1000);

        /* To test multiple outputs...
        var txp = {
          message: 'test multi-output',
          fee: 1000,
          createdOn: new Date() / 1000,
          outputs: []
        };
        function addOutput(n) {
          txp.outputs.push({
            amount: 600,
            toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
            message: 'output #' + (Number(n) + 1)
          });
        };
        lodash.times(150, addOutput);
        txps.push(txp);
        */

        lodash.each(txps, (tx: any) => {

          tx = this.txFormatProvider.processTx(wallet.coin, tx);

          // no future transactions...
          if (tx.createdOn > now)
            tx.createdOn = now;

          tx.wallet = wallet;

          if (!tx.wallet) {
            this.logger.error("no wallet at txp?");
            return;
          }

          let action: any = lodash.find(tx.actions, {
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

          if (!tx.deleteLockTime)
            tx.canBeRemoved = true;
        });
        wallet.pendingTxps = txps;
      };


      let get = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          wallet.getStatus({
            twoStep: true
          }, (err, ret) => {
            if (err) {
              if (err instanceof this.errors.NOT_AUTHORIZED) {
                return reject('WALLET_NOT_REGISTERED');
              }
              return reject(err);
            }
            return resolve(ret);
          });
        })
      };

      let cacheBalance = (wallet: any, balance: any): void => {
        if (!balance) return;

        let configGet: any = this.configProvider.get();
        let config: any = configGet.wallet;

        let cache = wallet.cachedStatus;

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
          cache.pendingAmount = balance.totalAmount - balance.totalConfirmedAmount;
          cache.spendableAmount = balance.totalConfirmedAmount - balance.lockedAmount;
        }

        // Selected unit
        cache.unitToSatoshi = config.settings.unitToSatoshi;
        cache.satToUnit = 1 / cache.unitToSatoshi;


        //STR
        cache.totalBalanceStr = this.txFormatProvider.formatAmountStr(wallet.coin, cache.totalBalanceSat);
        cache.lockedBalanceStr = this.txFormatProvider.formatAmountStr(wallet.coin, cache.lockedBalanceSat);
        cache.availableBalanceStr = this.txFormatProvider.formatAmountStr(wallet.coin, cache.availableBalanceSat);
        cache.spendableBalanceStr = this.txFormatProvider.formatAmountStr(wallet.coin, cache.spendableAmount);
        cache.pendingBalanceStr = this.txFormatProvider.formatAmountStr(wallet.coin, cache.pendingAmount);

        cache.alternativeName = config.settings.alternativeName;
        cache.alternativeIsoCode = config.settings.alternativeIsoCode;

        // Check address
        this.isAddressUsed(wallet, balance.byAddress).then((used) => {
          if (used) {
            this.logger.debug('Address used. Creating new');
            // Force new address
            this.getAddress(wallet, true).then((addr) => {
              this.logger.debug('New address: ', addr);
            }).catch((err) => {
              return reject(err);
            });
          }
        }).catch((err) => {
          return reject(err);
        });

        this.rateProvider.whenRatesAvailable().then(() => {

          let totalBalanceAlternative = this.rateProvider.toFiat(cache.totalBalanceSat, cache.alternativeIsoCode, wallet.coin);
          let pendingBalanceAlternative = this.rateProvider.toFiat(cache.pendingAmount, cache.alternativeIsoCode, wallet.coin);
          let lockedBalanceAlternative = this.rateProvider.toFiat(cache.lockedBalanceSat, cache.alternativeIsoCode, wallet.coin);
          let spendableBalanceAlternative = this.rateProvider.toFiat(cache.spendableAmount, cache.alternativeIsoCode, wallet.coin);
          let alternativeConversionRate = this.rateProvider.toFiat(100000000, cache.alternativeIsoCode, wallet.coin);

          cache.totalBalanceAlternative = this.filter.formatFiatAmount(totalBalanceAlternative);
          cache.pendingBalanceAlternative = this.filter.formatFiatAmount(pendingBalanceAlternative);
          cache.lockedBalanceAlternative = this.filter.formatFiatAmount(lockedBalanceAlternative);
          cache.spendableBalanceAlternative = this.filter.formatFiatAmount(spendableBalanceAlternative);
          cache.alternativeConversionRate = this.filter.formatFiatAmount(alternativeConversionRate);

          cache.alternativeBalanceAvailable = true;
          cache.isRateAvailable = true;
        }).catch((err) => {
          this.logger.warn(err);
        });
      };

      let isStatusCached = (): any => {
        return wallet.cachedStatus && wallet.cachedStatus.isValid;
      };

      let cacheStatus = (status: any): void => {
        if (status.wallet && status.wallet.scanStatus == 'running') return;

        wallet.cachedStatus = status || {};
        let cache = wallet.cachedStatus;
        cache.statusUpdatedOn = Date.now();
        cache.isValid = true;
        cache.email = status.preferences ? status.preferences.email : null;
        cacheBalance(wallet, status.balance);
      };

      let walletStatusHash = (status: any): any => {
        return status ? status.balance.totalAmount : wallet.totalBalanceSat;
      };

      let _getStatus = (initStatusHash: any, tries: number): Promise<any> => {

        return new Promise((resolve, reject) => {
          if (isStatusCached() && !opts.force) {

            this.logger.debug('Wallet status cache hit:' + wallet.id);
            cacheStatus(wallet.cachedStatus);
            processPendingTxps(wallet.cachedStatus);
            return resolve(wallet.cachedStatus);
          };

          tries = tries || 0;

          this.logger.debug('Updating Status:', wallet.credentials.walletName, tries);
          get().then((status) => {

            let currentStatusHash = walletStatusHash(status);
            this.logger.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
            if (opts.untilItChanges && initStatusHash == currentStatusHash && tries < this.WALLET_STATUS_MAX_TRIES && walletId == wallet.credentials.walletId) {
              return setTimeout(() => {
                this.logger.debug('Retrying update... ' + walletId + ' Try:' + tries)
                return _getStatus(initStatusHash, ++tries);
              }, this.WALLET_STATUS_DELAY_BETWEEN_TRIES * tries);
            }

            processPendingTxps(status);

            this.logger.debug('Got Wallet Status for:' + wallet.credentials.walletName);

            cacheStatus(status);

            wallet.scanning = status.wallet && status.wallet.scanStatus == 'running';

            return resolve(status);
          }).catch((err) => {
            return reject(err);
          });

        });
      };

      _getStatus(walletStatusHash(null), 0).then((status) => {
        resolve(status);
      }).catch((err) => {
        return reject(err);
      });

    });
  }

  // Check address
  private isAddressUsed(wallet: any, byAddress: Array<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getLastAddress(wallet.id).then((addr) => {
        let used = lodash.find(byAddress, {
          address: addr
        });
        return resolve(used);
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  public useLegacyAddress(): boolean {
    let config = this.configProvider.get();
    let walletSettings = config.wallet;

    return walletSettings.useLegacyAddress;
  }

  public getAddressView(wallet: any, address: string): string {
    if (wallet.coin != 'bch' || this.useLegacyAddress()) return address;
    return this.txFormatProvider.toCashAddress(address);
  }

  public getProtoAddress(wallet: any, address: string) {
    let proto: string = this.getProtocolHandler(wallet.coin);
    let protoAddr: string = proto + ':' + address;

    if (wallet.coin != 'bch' || this.useLegacyAddress()) {
      return protoAddr;
    } else {
      return protoAddr.toUpperCase();
    };
  };

  public getAddress(wallet: any, forceNew: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getLastAddress(wallet.id).then((addr) => {
        if (!forceNew && addr) return resolve(addr);

        if (!wallet.isComplete())
          return reject('WALLET_NOT_COMPLETE');

        this.createAddress(wallet).then((_addr) => {
          this.persistenceProvider.storeLastAddress(wallet.id, _addr).then(() => {
            return resolve(_addr);
          }).catch((err) => {
            return reject(err);
          });
        }).catch((err) => {
          return reject(err);
        });
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  private createAddress(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Creating address for wallet:', wallet.id);

      wallet.createAddress({}, (err, addr) => {
        if (err) {
          let prefix = this.translate.instant('Could not create address');
          if (err instanceof this.errors.CONNECTION_ERROR || (err.message && err.message.match(/5../))) {
            this.logger.warn(err);
            return setTimeout(() => {
              this.createAddress(wallet);
            }, 5000);
          } else if (err instanceof this.errors.MAIN_ADDRESS_GAP_REACHED || (err.message && err.message == 'MAIN_ADDRESS_GAP_REACHED')) {
            this.logger.warn(err);
            prefix = null;
            wallet.getMainAddresses({
              reverse: true,
              limit: 1
            }, (err, addr) => {
              if (err) return reject(err);
              return resolve(addr[0].address);
            });
          };
          this.bwcErrorProvider.cb(err, prefix).then((msg) => {
            return reject(msg);
          });
        } else
          return resolve(addr.address);
      });
    });
  }

  private getSavedTxs(walletId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider.getTxHistory(walletId).then((txs: any) => {
        let localTxs = [];

        if (lodash.isEmpty(txs)) {
          return resolve(localTxs);
        };

        try {
          localTxs = JSON.parse(txs);
        } catch (ex) {
          localTxs = txs;
        };
        return resolve(lodash.compact(localTxs));
      }).catch((err: Error) => {
        return reject(err);
      });
    });
  }

  private getTxsFromServer(wallet: any, skip: number, endingTxid: string, limit: number): Promise<any> {
    return new Promise((resolve, reject) => {
      let res = [];

      let result = {
        res: res,
        shouldContinue: res.length >= limit
      };

      wallet.getTxHistory({
        skip: skip,
        limit: limit
      }, (err: Error, txsFromServer: Array<any>) => {
        if (err) return reject(err);

        if (lodash.isEmpty(txsFromServer))
          return resolve(result);

        res = lodash.takeWhile(txsFromServer, (tx) => {
          return tx.txid != endingTxid;
        });

        result.res = res;
        result.shouldContinue = res.length >= limit;

        return resolve(result);
      });
    });
  }

  private updateLocalTxHistory(wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};
      let FIRST_LIMIT = 5;
      let LIMIT = 50;
      let requestLimit = FIRST_LIMIT;
      let walletId = wallet.credentials.walletId;
      this.progressFn[walletId] = opts.progressFn || (() => { });
      let foundLimitTx = [];

      let fixTxsUnit = (txs: any): void => {
        if (!txs || !txs[0] || !txs[0].amountStr) return;

        let cacheCoin: string = txs[0].amountStr.split(' ')[1];

        if (cacheCoin == 'bits') {

          this.logger.debug('Fixing Tx Cache Unit to: ' + wallet.coin)
          lodash.each(txs, (tx: any) => {
            tx.amountStr = this.txFormatProvider.formatAmountStr(wallet.coin, tx.amount);
            tx.feeStr = this.txFormatProvider.formatAmountStr(wallet.coin, tx.fees);
          });
        };
      };

      /* TODO: update on progress
      if (updateOnProgress[wallet.id]) {
        $log.warn('History update already on progress for: '+ wallet.credentials.walletName);

        if (opts.progressFn) {
          $log.debug('Rewriting progressFn');
          progressFn[walletId] = opts.progressFn;
        }
        updateOnProgress[wallet.id].push(cb);
        return; // no callback call yet.
      }

      updateOnProgress[walletId] = [cb];
       */

      this.getSavedTxs(walletId).then((txsFromLocal: any) => {

        fixTxsUnit(txsFromLocal);

        let confirmedTxs = this.removeAndMarkSoftConfirmedTx(txsFromLocal);
        let endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
        let endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;

        // First update
        this.progressFn[walletId](txsFromLocal, 0);
        wallet.completeHistory = txsFromLocal;

        let getNewTxs = (newTxs: Array<any>, skip: number): Promise<any> => {
          return new Promise((resolve, reject) => {
            this.getTxsFromServer(wallet, skip, endingTxid, requestLimit).then((result: any) => {

              let res = result.res;
              let shouldContinue = result.shouldContinue ? result.shouldContinue : false;

              newTxs = newTxs.concat(this.processNewTxs(wallet, lodash.compact(res)));
              this.progressFn[walletId](newTxs.concat(txsFromLocal), newTxs.length);
              skip = skip + requestLimit;
              this.logger.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

              // TODO Dirty <HACK>
              // do not sync all history, just looking for a single TX.
              if (opts.limitTx) {
                foundLimitTx = lodash.find(newTxs, {
                  txid: opts.limitTx,
                });
                if (!lodash.isEmpty(foundLimitTx)) {
                  this.logger.debug('Found limitTX: ' + opts.limitTx);
                  return resolve([foundLimitTx]);
                }
              }
              // </HACK>
              if (!shouldContinue) {
                this.logger.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
                return resolve(newTxs);
              };

              requestLimit = LIMIT;
              getNewTxs(newTxs, skip).then((txs: any) => {
                resolve(txs);

              });
            }).catch((err) => {
              this.logger.warn(this.bwcErrorProvider.msg(err, 'Server Error')); //TODO
              if (err instanceof this.errors.CONNECTION_ERROR || (err.message && err.message.match(/5../))) {
                this.logger.info('Retrying history download in 5 secs...');
                return reject(setTimeout(() => {
                  return getNewTxs(newTxs, skip);
                }, 5000));
              };
              return reject(err);
            });
          });
        };

        getNewTxs([], 0).then((txs: any) => {

          let array: Array<any> = lodash.compact(txs.concat(confirmedTxs));
          let newHistory = lodash.uniqBy(array, (x: any) => {
            return x.txid;
          });

          let updateNotes = (): Promise<any> => {
            return new Promise((resolve, reject) => {
              if (!endingTs) return resolve();

              this.logger.debug('Syncing notes from: ' + endingTs);
              wallet.getTxNotes({
                minTs: endingTs
              }, (err: any, notes: any) => {
                if (err) {
                  this.logger.warn(err);
                  return reject(err);
                };
                lodash.each(notes, (note: any) => {
                  this.logger.debug('Note for ' + note.txid);
                  lodash.each(newHistory, (tx: any) => {
                    if (tx.txid == note.txid) {
                      this.logger.debug('...updating note for ' + note.txid);
                      tx.note = note;
                    };
                  });
                });
                return resolve();
              });
            });
          };

          let updateLowAmount = (txs: any) => {
            if (!opts.lowAmount) return;

            lodash.each(txs, (tx: any) => {
              tx.lowAmount = tx.amount < opts.lowAmount;
            });
          };

          this.getLowAmount(wallet).then((fee) => {
            opts.lowAmount = fee;
            updateLowAmount(txs);
          });


          updateNotes().then(() => {

            // <HACK>
            if (!lodash.isEmpty(foundLimitTx)) {
              this.logger.debug('Tx history read until limitTx: ' + opts.limitTx);
              return resolve(newHistory);
            }
            // </HACK>

            var historyToSave = JSON.stringify(newHistory);
            lodash.each(txs, (tx: any) => {
              tx.recent = true;
            });
            this.logger.debug('Tx History synced. Total Txs: ' + newHistory.length);

            // Final update
            if (walletId == wallet.credentials.walletId) {
              wallet.completeHistory = newHistory;
            }

            return this.persistenceProvider.setTxHistory(walletId, historyToSave).then(() => {
              this.logger.debug('Tx History saved.');
              return resolve();
            }).catch((err) => {
              return reject(err);
            });
          }).catch((err) => {
            return reject(err);
          });
        }).catch((err) => {
          /* TODO: update on progress
          lodash.each(this.updateOnProgress[walletId], function(x) {
            x.apply(this,err);
          });
          this.updateOnProgress[walletId] = false;
           */
          return reject(err);
        });
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  private processNewTxs(wallet: any, txs: any): Array<any> {
    let now = Math.floor(Date.now() / 1000);
    let txHistoryUnique = {};
    let ret = [];
    wallet.hasUnsafeConfirmed = false;

    lodash.each(txs, (tx: any) => {
      tx = this.txFormatProvider.processTx(wallet.coin, tx);

      // no future transactions...
      if (tx.time > now)
        tx.time = now;

      if (tx.confirmations >= this.SAFE_CONFIRMATIONS) {
        tx.safeConfirmed = this.SAFE_CONFIRMATIONS + '+';
      } else {
        tx.safeConfirmed = false;
        wallet.hasUnsafeConfirmed = true;
      };

      if (tx.note) {
        delete tx.note.encryptedEditedByName;
        delete tx.note.encryptedBody;
      };

      if (!txHistoryUnique[tx.txid]) {
        ret.push(tx);
        txHistoryUnique[tx.txid] = true;
      } else {
        this.logger.debug('Ignoring duplicate TX in history: ' + tx.txid)
      };
    });

    return ret;
  }

  public removeAndMarkSoftConfirmedTx(txs: any): Array<any> {
    return lodash.filter(txs, (tx: any) => {
      if (tx.confirmations >= this.SOFT_CONFIRMATION_LIMIT)
        return tx;
      tx.recent = true;
    });
  }

  // Approx utxo amount, from which the uxto is economically redeemable
  public getLowAmount(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getMinFee(wallet).then((fee) => {
        let minFee: number = fee;
        return resolve(minFee / this.LOW_AMOUNT_RATIO);
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  // Approx utxo amount, from which the uxto is economically redeemable
  public getMinFee(wallet: any, nbOutputs?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.feeProvider.getFeeLevels(wallet.coin).then((data: any) => {
        let normalLevelRate: any = lodash.find(data.levels[wallet.network], (level: any) => {
          return level.level === 'normal';
        });
        let lowLevelRate: string = (normalLevelRate.feePerKb / 1000).toFixed(0);
        let size = this.getEstimatedTxSize(wallet, nbOutputs);
        return resolve(size * parseInt(lowLevelRate));
      }).catch((err) => {
        return reject(err);
      });
    })
  };

  // These 2 functions were taken from
  // https://github.com/bitpay/bitcore-wallet-service/blob/master/lib/model/txproposal.js#L243
  private getEstimatedSizeForSingleInput(wallet: any): number {
    switch (wallet.credentials.addressType) {
      case 'P2PKH':
        return 147;
      default:
      case 'P2SH':
        return wallet.m * 72 + wallet.n * 36 + 44;
    };
  }

  private getEstimatedTxSize(wallet: any, nbOutputs?: number): number {
    // Note: found empirically based on all multisig P2SH inputs and within m & n allowed limits.
    nbOutputs = nbOutputs ? nbOutputs : 2; // Assume 2 outputs
    let safetyMargin = 0.02;
    let overhead = 4 + 4 + 9 + 9;
    let inputSize = this.getEstimatedSizeForSingleInput(wallet);
    let outputSize = 34;
    let nbInputs = 1; //Assume 1 input

    let size = overhead + inputSize * nbInputs + outputSize * nbOutputs;
    return parseInt((size * (1 + safetyMargin)).toFixed(0));
  }

  public getTxNote(wallet: any, txid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.getTxNote({
        txid: txid
      }, (err: any, note: any) => {
        if (err) return reject(err);
        return resolve(note);
      });
    });
  }

  public editTxNote(wallet: any, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.editTxNote(args, (err: any, res: any) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  public getTxp(wallet: any, txpid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.getTx(txpid, (err: any, txp: any) => {
        if (err) return reject(err);
        return resolve(txp);
      });
    });
  }

  public getTx(wallet: any, txid: string) {
    return new Promise((resolve, reject) => {
      let finish = (list: any): any => {
        let tx = lodash.find(list, {
          txid: txid
        });

        if (!tx) return reject('Could not get transaction');
        return tx;
      };

      if (wallet.completeHistory && wallet.completeHistory.isValid) {
        let tx = finish(wallet.completeHistory);
        return resolve(tx);
      } else {
        let opts = {
          force: true
        };
        this.getTxHistory(wallet, opts).then((txHistory: any) => {
          let tx = finish(txHistory);
          return resolve(tx);
        }).catch((err) => {
          return reject(err);
        });
      };
    });
  }

  public getTxHistory(wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts ? opts : {};

      if (!wallet.isComplete()) return resolve();

      let isHistoryCached = () => {
        return wallet.completeHistory && wallet.completeHistory.isValid;
      };

      if (isHistoryCached() && !opts.force) return resolve(wallet.completeHistory);

      this.logger.debug('Updating Transaction History');
      this.updateLocalTxHistory(wallet, opts).then((txs: any) => {
        if (opts.limitTx) {
          return resolve(txs);
        };

        wallet.completeHistory.isValid = true;
        return resolve(wallet.completeHistory);
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  public isEncrypted(wallet: any): boolean {
    if (lodash.isEmpty(wallet)) return;
    let isEncrypted = wallet.isPrivKeyEncrypted();
    if (isEncrypted) this.logger.debug('Wallet is encrypted');
    return isEncrypted;
  }

  public createTx(wallet: any, txp: any) {
    return new Promise((resolve, reject) => {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      wallet.createTxProposal(txp, (err: any, createdTxp: any) => {
        if (err) return reject(err);
        else {
          this.logger.debug('Transaction created');
          return resolve(createdTxp);
        };
      });
    });
  }

  public publishTx(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        return reject('MISSING_PARAMETER');
      wallet.publishTxProposal({
        txp: txp
      }, (err: any, publishedTx: any) => {
        if (err) return reject(err);
        else {
          this.logger.debug('Transaction published');
          return resolve(publishedTx);
        };
      });
    });
  }

  signTx(wallet: any, txp: any, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet || !txp)
        return reject('MISSING_PARAMETER');

      try {
        wallet.signTxProposal(txp, password, (err: any, signedTxp: any) => {
          this.logger.debug('Transaction signed err:' + err);
          if (err) return reject(err);
          return resolve(signedTxp);
        });
      } catch (e) {
        this.logger.warn('Error at signTxProposal:', e);
        return reject(e);
      };
    });
  }

  public broadcastTx(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      if (txp.status != 'accepted')
        return reject('TX_NOT_ACCEPTED');

      wallet.broadcastTxProposal(txp, (err: any, broadcastedTxp: any, memo: any) => {
        if (err)
          return reject(err);

        this.logger.debug('Transaction broadcasted');
        if (memo) this.logger.info(memo);

        return resolve(broadcastedTxp);
      });
    });
  }

  public rejectTx(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      wallet.rejectTxProposal(txp, null, (err: any, rejectedTxp: any) => {
        if (err)
          return reject(err);
        this.logger.debug('Transaction rejected');
        return resolve(rejectedTxp);
      });
    });
  }

  public removeTx(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        return reject('MISSING_PARAMETER');

      wallet.removeTxProposal(txp, (err: any) => {
        this.logger.debug('Transaction removed');

        this.invalidateCache(wallet);
        this.events.publish('Local/TxAction', wallet.id);
        return resolve(err);
      });
    });
  }

  public updateRemotePreferences(clients: any, prefs?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      prefs = prefs ? prefs : {};

      if (!lodash.isArray(clients))
        clients = [clients];

      let updateRemotePreferencesFor = (clients: any, prefs: any): Promise<any> => {
        return new Promise((resolve, reject) => {
          let wallet = clients.shift();
          if (!wallet) return resolve();
          this.logger.debug('Saving remote preferences', wallet.credentials.walletName, prefs);

          wallet.savePreferences(prefs, (err: any) => {
            if (err) {
              this.popupProvider.ionicAlert(this.bwcErrorProvider.msg(err, this.translate.instant('Could not save preferences on the server')));
              return reject(err);
            }

            updateRemotePreferencesFor(clients, prefs).then(() => {
              return resolve();
            }).catch((err: any) => {
              return reject(err);
            });
          });
        });
      };

      // Update this JIC.
      let config: any = this.configProvider.get();

      //prefs.email  (may come from arguments)
      prefs.email = config.emailNotifications.email;
      prefs.language = "en" // This line was hardcoded - TODO: prefs.language = uxLanguage.getCurrentLanguage();
      //let walletSettings = config.wallet.settings;
      // prefs.unit = walletSettings.unitCode; // TODO: remove, not used

      updateRemotePreferencesFor(lodash.clone(clients), prefs).then(() => {
        this.logger.debug('Remote preferences saved for' + lodash.map(clients, (x: any) => {
          return x.credentials.walletId;
        }).join(','));

        lodash.each(clients, (c: any) => {
          c.preferences = lodash.assign(prefs, c.preferences);
        });
        return resolve();
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  public recreate(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Recreating wallet:', wallet.id);
      this.ongoingProcessProvider.set('recreating', true);
      wallet.recreateWallet((err: any) => {
        wallet.notAuthorized = false;
        this.ongoingProcessProvider.set('recreating', false);
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  public startScan(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Scanning wallet ' + wallet.id);
      if (!wallet.isComplete()) return reject();

      wallet.scanning = true;
      wallet.startScan({
        includeCopayerBranches: true,
      }, (err: any) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  public clearTxHistory(wallet): void {
    this.invalidateCache(wallet);
    this.persistenceProvider.removeTxHistory(wallet.id);
  }

  public expireAddress(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Cleaning Address ' + wallet.id);
      this.persistenceProvider.clearLastAddress(wallet.id).then(() => {
        return resolve();
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  public getMainAddresses(wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      opts.reverse = true;
      wallet.getMainAddresses(opts, (err, addresses) => {
        if (err) return reject(err);
        return resolve(addresses);
      });
    });
  }

  public getBalance(wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      wallet.getBalance(opts, (err, resp) => {
        if (err) return reject(err);
        return resolve(resp);
      });
    });
  }

  public getLowUtxos(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      wallet.getUtxos({
        coin: wallet.coin
      }, (err, resp) => {
        if (err || !resp || !resp.length) return reject(err);

        this.getMinFee(wallet, resp.length).then((fee) => {
          let minFee = fee;
          let balance = lodash.sumBy(resp, 'satoshis');

          // for 2 outputs
          this.getLowAmount(wallet).then((fee) => {
            let lowAmount = fee;
            let lowUtxos = lodash.filter(resp, (x: any) => {
              return x.satoshis < lowAmount;
            });

            let totalLow = lodash.sumBy(lowUtxos, 'satoshis');
            return resolve({
              allUtxos: resp || [],
              lowUtxos: lowUtxos || [],
              totalLow: totalLow,
              warning: minFee / balance > this.TOTAL_LOW_WARNING_RATIO,
              minFee: minFee,
            });
          });
        });
      });
    });
  }

  public isReady(wallet: any): string {
    if (!wallet.isComplete())
      return 'WALLET_NOT_COMPLETE';
    if (wallet.needsBackup)
      return 'WALLET_NEEDS_BACKUP';
    return null;
  }

  // An alert dialog
  private askPassword(name: string, title: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let opts = {
        type: 'password'
      }
      this.popupProvider.ionicPrompt(title, name, opts).then((res: any) => {
        return resolve(res);
      });
    });
  }

  public encrypt(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      var title = this.translate.instant('Enter new spending password');
      var warnMsg = this.translate.instant('Your wallet key will be encrypted. The Spending Password cannot be recovered. Be sure to write it down.');
      this.askPassword(warnMsg, title).then((password: string) => {
        if (!password) return reject(this.translate.instant('no password'));
        title = this.translate.instant('Confirm your new spending password');
        this.askPassword(warnMsg, title).then((password2: string) => {
          if (!password2 || password != password2) return reject(this.translate.instant('password mismatch'));
          wallet.encryptPrivateKey(password);
          return resolve();
        }).catch((err) => {
          return reject(err);
        });
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  public decrypt(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug('Disabling private key encryption for' + wallet.name);
      this.askPassword(null, this.translate.instant('Enter Spending Password')).then((password: string) => {
        if (!password) return reject(this.translate.instant('no password'));
        try {
          wallet.decryptPrivateKey(password);
        } catch (e) {
          return reject(e);
        }
        return resolve();
      });
    });
  }

  public handleEncryptedWallet(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isEncrypted(wallet)) return resolve();
      this.askPassword(wallet.name, this.translate.instant('Enter Spending Password')).then((password: string) => {
        if (!password) return reject(this.translate.instant('No password'));
        if (!wallet.checkPassword(password)) return reject(this.translate.instant('Wrong password'));
        return resolve(password);
      });
    });
  }

  public reject(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.ongoingProcessProvider.set('rejectTx', true);
      this.rejectTx(wallet, txp).then((txpr: any) => {
        this.invalidateCache(wallet);
        this.ongoingProcessProvider.set('rejectTx', false);
        this.events.publish('Local/TxAction', wallet.id);
        return resolve(txpr);
      }).catch((err) => {
        this.ongoingProcessProvider.set('rejectTx', false);
        return reject(err);
      });
    });
  }

  public onlyPublish(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.ongoingProcessProvider.set('sendingTx', true);
      this.publishTx(wallet, txp).then((publishedTxp) => {
        this.invalidateCache(wallet);
        this.ongoingProcessProvider.set('sendingTx', false);
        this.events.publish('Local/TxAction', wallet.id);
        return resolve();
      }).catch((err) => {
        this.ongoingProcessProvider.set('sendingTx', false);
        return reject(this.bwcErrorProvider.msg(err));
      });
    });
  }

  public prepare(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.touchidProvider.checkWallet(wallet).then(() => {
        this.handleEncryptedWallet(wallet).then((password: string) => {
          return resolve(password);
        }).catch((err) => {
          return reject(err);
        });
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  private signAndBroadcast(wallet: any, publishedTxp: any, password: any): Promise<any> {
    return new Promise((resolve, reject) => {

      this.ongoingProcessProvider.set('signingTx', true);
      this.signTx(wallet, publishedTxp, password).then((signedTxp: any) => {
        this.invalidateCache(wallet);
        if (signedTxp.status == 'accepted') {
          this.ongoingProcessProvider.set('broadcastingTx', true);
          this.broadcastTx(wallet, signedTxp).then((broadcastedTxp: any) => {
            this.ongoingProcessProvider.clear();
            this.events.publish('Local/TxAction', wallet.id);
            return resolve(broadcastedTxp);
          }).catch((err) => {
            this.ongoingProcessProvider.clear();
            return reject(this.bwcErrorProvider.msg(err));
          });
        } else {
          this.ongoingProcessProvider.clear();
          this.events.publish('Local/TxAction', wallet.id);
          return resolve(signedTxp);
        };
      }).catch((err) => {
        this.ongoingProcessProvider.clear();
        this.logger.warn('sign error:' + err);
        let msg = err && err.message ? err.message : this.translate.instant('The payment was created but could not be completed. Please try again from home screen');
        this.events.publish('Local/TxAction', wallet.id);
        return reject(msg);
      });
    });
  }

  public publishAndSign(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Already published?
      if (txp.status == 'pending') {
        this.prepare(wallet).then((password: string) => {
          this.signAndBroadcast(wallet, txp, password).then((broadcastedTxp: any) => {
            return resolve(broadcastedTxp);
          }).catch((err) => {
            return reject(err);
          });
        }).catch((err) => {
          return reject(this.bwcErrorProvider.msg(err));
        });
      } else {
        this.prepare(wallet).then((password: string) => {
          this.ongoingProcessProvider.set('sendingTx', true);
          this.publishTx(wallet, txp).then((publishedTxp: any) => {
            this.signAndBroadcast(wallet, publishedTxp, password).then((broadcastedTxp: any) => {
              return resolve(broadcastedTxp);
            }).catch((err) => {
              return reject(err);
            });
          }).catch((err) => {
            this.ongoingProcessProvider.clear();
            return reject(this.bwcErrorProvider.msg(err));
          });
        }).catch((err) => {
          return reject(this.bwcErrorProvider.msg(err));
        });
      };
    });
  }

  public getEncodedWalletInfo(wallet: any, password?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let derivationPath = wallet.credentials.getBaseAddressDerivationPath();
      let encodingType = {
        mnemonic: 1,
        xpriv: 2,
        xpub: 3
      };
      let info: any = {};

      // not supported yet
      if (wallet.credentials.derivationStrategy != 'BIP44' || !wallet.canSign())
        return reject(this.translate.instant('Exporting via QR not supported for this wallet'));

      var keys = this.getKeysWithPassword(wallet, password);

      if (keys.mnemonic) {
        info = {
          type: encodingType.mnemonic,
          data: keys.mnemonic,
        }
      } else {
        info = {
          type: encodingType.xpriv,
          data: keys.xPrivKey
        }
      }

      return resolve(info.type + '|' + info.data + '|' + wallet.credentials.network.toLowerCase() + '|' + derivationPath + '|' + (wallet.credentials.mnemonicHasPassphrase));
    });
  }

  public getKeysWithPassword(wallet: any, password: string): any {
    try {
      return wallet.getKeys(password);
    } catch (e) {
      this.logger.debug(e);
    }
  }

  public setTouchId(wallet: any, enabled: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      let opts = {
        touchIdFor: {}
      };
      opts.touchIdFor[wallet.id] = enabled;

      this.touchidProvider.checkWallet(wallet).then(() => {
        this.configProvider.set(opts);
        return resolve();
      }).catch((err) => {
        opts.touchIdFor[wallet.id] = !enabled;
        this.logger.debug('Error with fingerprint:' + err);
        this.configProvider.set(opts);
        return reject(err);
      });
    });
  }

  public getKeys(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.prepare(wallet).then((password: string) => {
        let keys;
        try {
          keys = wallet.getKeys(password);
        } catch (e) {
          return reject(e);
        }
        return resolve(keys);
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  public getSendMaxInfo(wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      wallet.getSendMaxInfo(opts, (err: any, res: any) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  public getProtocolHandler(coin: string): string {
    if (coin == 'bch') {
      return 'bitcoincash';
    } else {
      return 'bitcoin';
    }
  }

  public copyCopayers(wallet: any, newWallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let walletPrivKey = this.bwcProvider.getBitcore().PrivateKey.fromString(wallet.credentials.walletPrivKey);
      let copayer = 1;
      let i = 0;

      lodash.each(wallet.credentials.publicKeyRing, (item) => {
        let name = item.copayerName || ('copayer ' + copayer++);
        newWallet._doJoinWallet(newWallet.credentials.walletId, walletPrivKey, item.xPubKey, item.requestPubKey, name, {
          coin: newWallet.credentials.coin,
        }, (err: any) => {
          //Ignore error is copayer already in wallet
          if (err && !(err instanceof this.errors.COPAYER_IN_WALLET)) return reject(err);
          if (++i == wallet.credentials.publicKeyRing.length) return resolve();
        });
      });
    });
  };
}
