import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

import { PlatformProvider } from '../platform/platform';
import { ConfigProvider } from '../config/config';
import { BwcProvider } from '../bwc/bwc';
import { TxFormatProvider } from '../tx-format/tx-format';
import { PersistenceProvider } from '../persistence/persistence';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { RateProvider } from '../rate/rate';
import { FilterProvider } from '../filter/filter';
import { PopupProvider } from '../popup/popup';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

import * as lodash from 'lodash';


/* TODO LIST:
  - Bwc Error provider
  - onGoingProcess provider
*/


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

  private errors: any = this.bwc.getErrors();

  constructor(
    private logger: Logger,
    private platform: PlatformProvider,
    private bwc: BwcProvider,
    private txFormat: TxFormatProvider,
    private config: ConfigProvider,
    private persistence: PersistenceProvider,
    private bwcError: BwcErrorProvider,
    private rate: RateProvider,
    private filter: FilterProvider,
    private popup: PopupProvider,
    private ongoingProcess: OnGoingProcessProvider
  ) {
    console.log('Hello WalletService Provider');
  }



  private invalidateCache (wallet: any) {
    if (wallet.cachedStatus)
      wallet.cachedStatus.isValid = false;

    if (wallet.completeHistory)
      wallet.completeHistory.isValid = false;

    if (wallet.cachedActivity)
      wallet.cachedActivity.isValid = false;

    if (wallet.cachedTxps)
      wallet.cachedTxps.isValid = false;
  }

  getStatus (wallet: any, opts: any) {
    return new Promise((resolve, reject) => {
      opts = opts || {};
      var walletId = wallet.id;
      let self = this;

      function processPendingTxps(status: any): void {
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

          tx = self.txFormat.processTx(wallet.coin, tx);

          // no future transactions...
          if (tx.createdOn > now)
            tx.createdOn = now;

          tx.wallet = wallet;

          if (!tx.wallet) {
          self.logger.error("no wallet at txp?");
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


      function get(): Promise<any> {
        return new Promise((resolve, reject) => {
          wallet.getStatus({
            twoStep: true
          }, (err, ret) => {
            if (err) {
              if (err instanceof self.errors.NOT_AUTHORIZED) {
                reject('WALLET_NOT_REGISTERED');
              }
              reject(err);
            }
            resolve(null);
          });
        })
      };

      function cacheBalance(wallet: any, balance: any): void{
        if (!balance) return;

        let configGet: any = self.config.get();
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
        cache.totalBalanceStr = self.txFormat.formatAmountStr(wallet.coin, cache.totalBalanceSat);
        cache.lockedBalanceStr = self.txFormat.formatAmountStr(wallet.coin, cache.lockedBalanceSat);
        cache.availableBalanceStr = self.txFormat.formatAmountStr(wallet.coin, cache.availableBalanceSat);
        cache.spendableBalanceStr = self.txFormat.formatAmountStr(wallet.coin, cache.spendableAmount);
        cache.pendingBalanceStr = self.txFormat.formatAmountStr(wallet.coin, cache.pendingAmount);

        cache.alternativeName = config.settings.alternativeName;
        cache.alternativeIsoCode = config.settings.alternativeIsoCode;

        // Check address
        self.isAddressUsed(wallet, balance.byAddress).then((used) => {
          if (used) {
            self.logger.debug('Address used. Creating new');
            // Force new address
            self.getAddress(wallet, true).then((addr) => {
              self.logger.debug('New address: ', addr);
            }).catch((err)=> {
              reject(err);
            });
          }
        }).catch((err) => {
          reject(err);
        });

        self.rate.whenAvailable().then(() => {

          let totalBalanceAlternative = self.rate.toFiat(cache.totalBalanceSat, cache.alternativeIsoCode, wallet.coin);
          let pendingBalanceAlternative = self.rate.toFiat(cache.pendingAmount, cache.alternativeIsoCode, wallet.coin);
          let lockedBalanceAlternative = self.rate.toFiat(cache.lockedBalanceSat, cache.alternativeIsoCode, wallet.coin);
          let spendableBalanceAlternative = self.rate.toFiat(cache.spendableAmount, cache.alternativeIsoCode, wallet.coin);
          let alternativeConversionRate = self.rate.toFiat(100000000, cache.alternativeIsoCode, wallet.coin);

          cache.totalBalanceAlternative = self.filter.formatFiatAmount(totalBalanceAlternative);
          cache.pendingBalanceAlternative = self.filter.formatFiatAmount(pendingBalanceAlternative);
          cache.lockedBalanceAlternative = self.filter.formatFiatAmount(lockedBalanceAlternative);
          cache.spendableBalanceAlternative = self.filter.formatFiatAmount(spendableBalanceAlternative);
          cache.alternativeConversionRate = self.filter.formatFiatAmount(alternativeConversionRate);

          cache.alternativeBalanceAvailable = true;
          cache.isRateAvailable = true;
        });
      };

      function isStatusCached(): any {
        return wallet.cachedStatus && wallet.cachedStatus.isValid;
      };

      function cacheStatus(status: any): void {
        if (status.wallet && status.wallet.scanStatus == 'running') return;

        wallet.cachedStatus = status ||  {};
        let cache = wallet.cachedStatus;
        cache.statusUpdatedOn = Date.now();
        cache.isValid = true;
        cache.email = status.preferences ? status.preferences.email : null;
        cacheBalance(wallet, status.balance);
      };

      function walletStatusHash(status: any): any {
        return status ? status.balance.totalAmount : wallet.totalBalanceSat;
      };

      function _getStatus(initStatusHash: any, tries: number): Promise<any> {
        return new Promise((resolve,reject)=> {
          if (isStatusCached() && !opts.force) {
            self.logger.debug('Wallet status cache hit:' + wallet.id);
            cacheStatus(wallet.cachedStatus);
            processPendingTxps(wallet.cachedStatus);
            resolve(wallet.cachedStatus);
          };

          tries = tries || 0;

          self.logger.debug('Updating Status:', wallet.credentials.walletName, tries);
          get().then((status) => {
            let currentStatusHash = walletStatusHash(status);
            self.logger.debug('Status update. hash:' + currentStatusHash + ' Try:' + tries);
            if (opts.untilItChanges && initStatusHash == currentStatusHash && tries < self.WALLET_STATUS_MAX_TRIES && walletId == wallet.credentials.walletId) {
              return setTimeout(function() {
                self.logger.debug('Retrying update... ' + walletId + ' Try:' + tries)
                return _getStatus(initStatusHash, ++tries);
              }, self.WALLET_STATUS_DELAY_BETWEEN_TRIES * tries);
            }

            processPendingTxps(status);

            self.logger.debug('Got Wallet Status for:' + wallet.credentials.walletName);

            cacheStatus(status);

            wallet.scanning = status.wallet && status.wallet.scanStatus == 'running';

            resolve(status);
          }).catch((err) => {
            reject(err);
          });

        });
      };

      _getStatus(walletStatusHash(null), 0);
      
    });
  }

  // Check address
  private isAddressUsed(wallet: any, byAddress: Array<any>): Promise<any>{
    return new Promise((resolve, reject) => {
      this.persistence.getLastAddress(wallet.id).then((addr) => {
        let used = lodash.find(byAddress, {
          address: addr
        });
        resolve(used);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  private getAddress(wallet: any, forceNew: boolean): Promise<any> {
    return new Promise((resolve,reject) => {
      this.persistence.getLastAddress(wallet.id).then((addr) => {
        if (!forceNew && addr) resolve(addr);

        if (!wallet.isComplete())
          reject('WALLET_NOT_COMPLETE');

        this.createAddress(wallet).then((_addr) => {
          this.persistence.storeLastAddress(wallet.id, _addr).then(() => {
            resolve(_addr);
          }).catch((err) => {
            reject(err);
          });
        }).catch((err) => {
          reject(err);
        });
      }).catch((err)=> {
        reject(err);
      });
    });
  }


  private createAddress(wallet: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      this.logger.debug('Creating address for wallet:', wallet.id);

      wallet.createAddress({}, (err, addr) => {
        if (err) {
          let prefix = 'Could not create address'; //TODO Gettextcatalog
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
              if (err) reject(err);
              resolve(addr[0].address);
            });
          };
          this.bwcError.cb(err, prefix).then((msg) => {
            reject(msg);
          });
        };
        resolve(addr.address);
      });
    });
  }

  private getSavedTxs (walletId: string): Promise<any> {
    return new Promise((resolve, reject)=> {

      this.persistence.getTxHistory(walletId).then((txs: any) => {
        let localTxs = [];

        if (!txs) {
          resolve(localTxs);
        };

        try {
          localTxs = JSON.parse(txs);
        } catch (ex) {
          this.logger.warn(ex);
        };
        resolve(lodash.compact(localTxs));
      }).catch((err: Error) => {
        reject(err);
      });
    });
  }

  private getTxsFromServer (wallet: any, skip: number, endingTxid: string, limit: number): Promise<any> {
    return new Promise((resolve, reject)=> {
      let res = [];

      wallet.getTxHistory({
        skip: skip,
        limit: limit
      }, (err: Error, txsFromServer: Array<any>) => {
        if (err) reject(err);

        if (!txsFromServer.length)
          resolve();

        res = lodash.takeWhile(txsFromServer, function(tx) {
          return tx.txid != endingTxid;
        });

        let result = {
          res: res,
          shouldContinue: res.length >= limit
        };

        resolve(result);
      });
    });
  }

  private updateLocalTxHistory (wallet: any, opts: any) {
    return new Promise((resolve, reject)=> {
      let self = this;
      opts = opts ? opts : {};
      let FIRST_LIMIT = 5;
      let LIMIT = 50;
      let requestLimit = FIRST_LIMIT;
      let walletId = wallet.credentials.walletId;
      let progressFn = opts.progressFn || function() {};
      let foundLimitTx = [];


      if (opts.feeLevels) {
        opts.lowAmount = this.getLowAmount(wallet, opts.feeLevels);
      };

      function fixTxsUnit (txs: any): void {
        if (!txs || !txs[0] || !txs[0].amountStr) return;

        let cacheCoin: string = txs[0].amountStr.split(' ')[1];

        if (cacheCoin == 'bits') {

          self.logger.debug('Fixing Tx Cache Unit to: ' + wallet.coin)
          lodash.each(txs, (tx: any) => {
            tx.amountStr = self.txFormat.formatAmountStr(wallet.coin, tx.amount);
            tx.feeStr = self.txFormat.formatAmountStr(wallet.coin, tx.fees);
          });
        };
      };

      this.getSavedTxs(walletId).then((txsFromLocal: any) => {

        fixTxsUnit(txsFromLocal);

        var confirmedTxs = this.removeAndMarkSoftConfirmedTx(txsFromLocal);
        var endingTxid = confirmedTxs[0] ? confirmedTxs[0].txid : null;
        var endingTs = confirmedTxs[0] ? confirmedTxs[0].time : null;

        // First update
        progressFn(txsFromLocal, 0);
        wallet.completeHistory = txsFromLocal;

        function getNewTxs(newTxs: Array<any>, skip: number): Promise<any> {
          return new Promise((resolve, reject)=> {
            self.getTxsFromServer(wallet, skip, endingTxid, requestLimit).then((result: any) => {

              var res = result.res;
              var shouldContinue = result.shouldContinue ? result.shouldContinue : false;

              newTxs = newTxs.concat(self.processNewTxs(wallet, lodash.compact(res)));
              progressFn(newTxs.concat(txsFromLocal), newTxs.length);
              skip = skip + requestLimit;
              self.logger.debug('Syncing TXs. Got:' + newTxs.length + ' Skip:' + skip, ' EndingTxid:', endingTxid, ' Continue:', shouldContinue);

              // TODO Dirty <HACK>
              // do not sync all history, just looking for a single TX.
              if (opts.limitTx) {
                foundLimitTx = lodash.find(newTxs, {
                  txid: opts.limitTx,
                });
                if (foundLimitTx) {
                  self.logger.debug('Found limitTX: ' + opts.limitTx);
                  resolve(foundLimitTx);
                }
              }
              // </HACK>
              if (!shouldContinue) {
                self.logger.debug('Finished Sync: New / soft confirmed Txs: ' + newTxs.length);
                resolve(newTxs);
              };

              requestLimit = LIMIT;
              getNewTxs(newTxs, skip);
            }).catch((err) => {
                self.logger.warn(self.bwcError.msg(err, 'Server Error')); //TODO
                if (err instanceof self.errors.CONNECTION_ERROR || (err.message && err.message.match(/5../))) {
                  self.logger.info('Retrying history download in 5 secs...');
                  reject( setTimeout(() => {
                    return getNewTxs(newTxs, skip);
                  }, 5000));
                };
                reject(err);
            });
          });
        };

        getNewTxs([], 0).then((txs: any) => {
          
          let array: Array<any> = lodash.compact(txs.concat(confirmedTxs));
          let newHistory = lodash.uniqBy(array, (x: any) => {
            return x.txid;
          });


          function updateNotes(): Promise<any>  {
            return new Promise((resolve, reject)=> {
              if (!endingTs) resolve();

              self.logger.debug('Syncing notes from: ' + endingTs);
              wallet.getTxNotes({
                minTs: endingTs
              }, (err: any, notes: any) => {
                if (err) {
                  self.logger.warn(err);
                  reject(err);
                };
                lodash.each(notes, (note: any) => {
                  self.logger.debug('Note for ' + note.txid);
                  lodash.each(newHistory, (tx: any) => {
                    if (tx.txid == note.txid) {
                      self.logger.debug('...updating note for ' + note.txid);
                      tx.note = note;
                    };
                  });
                });
                resolve();
              });
            });
          };

          function updateLowAmount(txs: any) {
            if (!opts.lowAmount) return;

            lodash.each(txs, (tx: any) => {
              tx.lowAmount = tx.amount < opts.lowAmount;
            });
          };

          updateLowAmount(txs);

          updateNotes().then(() => {

            // <HACK>
            if (foundLimitTx) {
              this.logger.debug('Tx history read until limitTx: ' + opts.limitTx);
              resolve(newHistory);
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

            return this.persistence.setTxHistory(historyToSave, walletId).then(() => {
              this.logger.debug('Tx History saved.');
              resolve();
            }).catch((err) => {
              reject(err);
            });
          }).catch((err) => {
            reject(err);
          });
        }).catch((err) => {
          reject(err);
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  private processNewTxs (wallet: any, txs: any): Array<any> {
    let configGet: any = this.config.get();
    let config: any = configGet.wallet.settings;
    let now = Math.floor(Date.now() / 1000);
    let txHistoryUnique = {};
    let ret = [];
    wallet.hasUnsafeConfirmed = false;

    lodash.each(txs, (tx: any) => {
      tx = this.txFormat.processTx(wallet.coin, tx);

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

  private removeAndMarkSoftConfirmedTx (txs: any): Array<any> {
    return lodash.filter(txs, (tx: any) => {
      if (tx.confirmations >= this.SOFT_CONFIRMATION_LIMIT)
        return tx;
      tx.recent = true;
    });
  }

   // Approx utxo amount, from which the uxto is economically redeemable
  public getLowAmount (wallet: any, feeLevels: any, nbOutputs?: number) {
    let minFee: number = this.getMinFee(wallet, feeLevels, nbOutputs);
    return (minFee / this.LOW_AMOUNT_RATIO);
  }

  // Approx utxo amount, from which the uxto is economically redeemable
  private getMinFee (wallet: any, feeLevels: any, nbOutputs?: number): number {
    let level: any = lodash.find(feeLevels[wallet.network], {
      level: 'normal',
    });
    let lowLevelRate = parseInt((level.feePerKb / 1000).toFixed(0));

    var size = this.getEstimatedTxSize(wallet, nbOutputs);
    return size * lowLevelRate;
  }

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

  private getEstimatedTxSize (wallet: any, nbOutputs?: number): number {
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

  public getTxNote (wallet: any, txid: string): Promise<any> {
    return new Promise((resolve, reject)=> {
      wallet.getTxNote({
        txid: txid
      }, (err: any, note: any) => {
        if (err) reject(err);
        resolve(note);
      });
    });  
  }

  public editTxNote (wallet: any, args: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      wallet.editTxNote(args, (err: any, res: any) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }

  public getTxp (wallet: any, txpid: string): Promise<any> {
    return new Promise((resolve, reject)=> {
      wallet.getTx(txpid, (err: any, txp: any) => {
        if (err) reject(err);
        resolve(txp);
      });
    });
  }

  public getTx (wallet: any, txid: string) {
    return new Promise((resolve, reject)=> {
      function finish(list: any) {
        let tx = lodash.find(list, {
          txid: txid
        });

        if (!tx) reject('Could not get transaction');
        resolve(tx);
      };

      if (wallet.completeHistory && wallet.completeHistory.isValid) {
        finish(wallet.completeHistory);
      } else {
        let opts = {
          limitTx: txid
        };
        this.getTxHistory(wallet, opts).then((txHistory: any) => {
          finish(txHistory);
        }).catch((err) => {
          reject(err);
        });
      };
    }); 
  }

  public getTxHistory (wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      opts = opts ? opts : {};
      let walletId = wallet.credentials.walletId;

      if (!wallet.isComplete()) resolve();

      function isHistoryCached() {
        return wallet.completeHistory && wallet.completeHistory.isValid;
      };

      if (isHistoryCached() && !opts.force) resolve(wallet.completeHistory);

      this.logger.debug('Updating Transaction History');
      this.updateLocalTxHistory(wallet, opts).then((txs: any) => {
        if (opts.limitTx) {
          resolve(txs);
        };

        wallet.completeHistory.isValid = true;
        resolve(wallet.completeHistory);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  public isEncrypted (wallet: any) {
    if (lodash.isEmpty(wallet)) return;
    let isEncrypted = wallet.isPrivKeyEncrypted();
    if (isEncrypted) this.logger.debug('Wallet is encrypted');
    return isEncrypted;
  }

  public createTx (wallet: any, txp: any) {
    return new Promise((resolve, reject)=> {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        reject('MISSING_PARAMETER');

      wallet.createTxProposal(txp, (err: any, createdTxp: any) => {
        if (err) reject(err);
        else {
          this.logger.debug('Transaction created');
          resolve(createdTxp);
        };
      });
    });
  }

  public publishTx (wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        reject('MISSING_PARAMETER');
      wallet.publishTxProposal({
        txp: txp
      }, (err: any, publishedTx: any) => {
        if (err) reject(err);
        else {
          this.logger.debug('Transaction published');
          resolve(publishedTx);
        };
      });
    });
  }

  signTx (wallet: any, txp: any, password: string): Promise<any> {
    return new Promise((resolve, reject)=> {
      if (!wallet || !txp)
        reject('MISSING_PARAMETER');

      try {
        wallet.signTxProposal(txp, password, (err: any, signedTxp: any) => {
          this.logger.debug('Transaction signed err:' + err);
          if (err) reject(err);
          resolve(signedTxp);
        });
      } catch (e) {
        this.logger.warn('Error at signTxProposal:', e);
        reject(e);
      };
    });
  }

  public broadcastTx (wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        reject('MISSING_PARAMETER');

      if (txp.status != 'accepted')
        reject('TX_NOT_ACCEPTED');

      wallet.broadcastTxProposal(txp, (err: any, broadcastedTxp: any, memo: any) => {
        if (err)
          reject(err);

        this.logger.debug('Transaction broadcasted');
        if (memo) this.logger.info(memo);

        resolve(broadcastedTxp);
      });
    });
  }

   public rejectTx (wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        reject('MISSING_PARAMETER');

      wallet.rejectTxProposal(txp, null, (err: any, rejectedTxp: any) => {
        if (err)
          reject(err);
        this.logger.debug('Transaction rejected');
        resolve(rejectedTxp);
      });
    });    
  }

  public removeTx (wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      if (lodash.isEmpty(txp) || lodash.isEmpty(wallet))
        reject('MISSING_PARAMETER');

      wallet.removeTxProposal(txp, (err: any) => {
        this.logger.debug('Transaction removed');

        this.invalidateCache(wallet);
        resolve(err);
      });
    });  
  }

  public updateRemotePreferences (clients: any, prefs: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      let self = this;
      prefs = prefs || {};
      //cb = cb || function() {};

      if (!lodash.isArray(clients))
        clients = [clients];

      function updateRemotePreferencesFor(clients: any, prefs: any): Promise<any> {
        return new Promise((resolve, reject)=> {
          let wallet = clients.shift();
          if (!wallet) resolve();
          self.logger.debug('Saving remote preferences', wallet.credentials.walletName, prefs);

          wallet.savePreferences(prefs, (err: any) => {

            if (err) {
              self.popup.ionicAlert(this.bwcError.msg(err, 'Could not save preferences on the server')); //TODO Gettextcatalog
              reject(err);
            }

            updateRemotePreferencesFor(clients, prefs);
          });
        });
      };

      // Update this JIC.
      let config: any = this.config.get();
      let walletSettings = config.wallet.settings;

      //prefs.email  (may come from arguments)
      prefs.email = config.emailNotifications.email;
      prefs.language = "English" // This line was hardcoded - TODO: prefs.language = uxLanguage.getCurrentLanguage();
      // prefs.unit = walletSettings.unitCode; // TODO: remove, not used

      updateRemotePreferencesFor(lodash.clone(clients), prefs).then(() => {
        this.logger.debug('Remote preferences saved for' + lodash.map(clients, (x: any) => {
          return x.credentials.walletId;
        }).join(','));

        lodash.each(clients, (c: any) => {
          c.preferences = lodash.assign(prefs, c.preferences);
        });
        resolve();
      }).catch((err: any) => {
        reject(err);
      });
    });    
  }

  public recreate (wallet: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      this.logger.debug('Recreating wallet:', wallet.id);
      this.ongoingProcess.set('recreating', true);
      wallet.recreateWallet((err: any) => {
        wallet.notAuthorized = false;
        this.ongoingProcess.set('recreating', false);
        if(err) reject(err);
        resolve();
      });
    });
  }

  public startScan (wallet: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      this.logger.debug('Scanning wallet ' + wallet.id);
      if (!wallet.isComplete()) reject();

      wallet.scanning = true;
      wallet.startScan({
        includeCopayerBranches: true,
      }, (err: any) => {
        if (err) reject(err);
        resolve();
      });
    });
  }


  public expireAddress (wallet: any): Promise<any> {
    return new Promise((resolve, reject)=> {
      this.logger.debug('Cleaning Address ' + wallet.id);
      this.persistence.clearLastAddress(wallet.id).then(() => {
        resolve();
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

}
