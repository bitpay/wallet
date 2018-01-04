import { Injectable } from '@angular/core';
import { BwcProvider } from '../bwc/bwc';
import { RateProvider } from '../rate/rate';
import { ConfigProvider } from '../config/config';
import { FilterProvider } from '../filter/filter';
import { Logger } from '@nsalaun/ng-logger';

import * as _ from "lodash";

@Injectable()
export class TxFormatProvider {

  // TODO: implement configService
  public pendingTxProposalsCountForUs: number

  constructor(
    private bwc: BwcProvider,
    private rate: RateProvider,
    private config: ConfigProvider,
    private filter: FilterProvider,
    private logger: Logger
  ) {
    this.logger.info('TxFormatProvider initialized.');
  }

  public formatAmount(satoshis: number, fullPrecision?: boolean): number {
    let settings = this.config.get().wallet.settings;

    if (settings.unitCode == 'sat') return satoshis;

    //TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.bwc.getUtils().formatAmount(satoshis, settings.unitCode, opts);
  }

  public formatAmountStr(coin: string, satoshis: number): string {
    if (isNaN(satoshis)) return;
    return (this.formatAmount(satoshis) + ' ' + coin.toUpperCase());
  }

  public toFiat(coin: string, satoshis: number, code: string): Promise<any> {
    //TODO not a promise
    return new Promise((resolve, reject) => {
      if (isNaN(satoshis)) return resolve();
      var v1;
      v1 = this.rate.toFiat(satoshis, code, coin);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatToUSD(coin: string, satoshis: number): Promise<any> {
    //TODO not a promise
    return new Promise((resolve, reject) => {
      let v1: number;
      if (isNaN(satoshis)) return resolve();
      v1 = this.rate.toFiat(satoshis, 'USD', coin);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  };

  public formatAlternativeStr(coin: string, satoshis: number): string {
    if (isNaN(satoshis)) return;
    let settings = this.config.get().wallet.settings;

    let val = (() => {
      var v1 = parseFloat((this.rate.toFiat(satoshis, settings.alternativeIsoCode, coin)).toFixed(2));
      v1 = this.filter.formatFiatAmount(v1);
      if (!v1) return null;

      return v1 + ' ' + settings.alternativeIsoCode;
    }).bind(this);

    if (!this.rate.isAvailable()) return null;
    return val();
  };

  public processTx(coin: string, tx: any): any {
    if (!tx || tx.action == 'invalid')
      return tx;

    // New transaction output format
    if (tx.outputs && tx.outputs.length) {

      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = _.reduce(tx.outputs, (total: any, o: any) => {
          o.amountStr = this.formatAmountStr(coin, o.amount);
          o.alternativeAmountStr = this.formatAlternativeStr(coin, o.amount);
          return total + o.amount;
        }, 0);
      }
      tx.toAddress = tx.outputs[0].toAddress;
    }

    tx.amountStr = this.formatAmountStr(coin, tx.amount);
    tx.alternativeAmountStr = this.formatAlternativeStr(coin, tx.amount);
    tx.feeStr = this.formatAmountStr(coin, tx.fee || tx.fees);

    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
    }

    return tx;
  };

  public formatPendingTxps(txps): any {
    this.pendingTxProposalsCountForUs = 0;
    var now = Math.floor(Date.now() / 1000);

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

    _.each(txps, function (tx) {

      // no future transactions...
      if (tx.createdOn > now)
        tx.createdOn = now;

      // TODO: implement profileService.getWallet(tx.walletId)
      //tx.wallet = profileService.getWallet(tx.walletId);
      tx.wallet = {
        coin: "btc",
        copayerId: "asdasdasdasd"
      }
      // hardcoded tx.wallet ^

      if (!tx.wallet) {
        this.logger.debug("no wallet at txp?");
        return;
      }

      tx = this.processTx(tx.wallet.coin, tx);

      var action: any = _.find(tx.actions, {
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

    return txps;
  };

  public parseAmount(coin: string, amount: any, currency: string): any {
    let settings = this.config.get()['wallet']['settings']; // TODO
    var satToBtc = 1 / 100000000;
    var unitToSatoshi = settings.unitToSatoshi;
    var amountUnitStr;
    var amountSat;
    var alternativeIsoCode = settings.alternativeIsoCode;

    // If fiat currency
    if (currency != 'BCH' && currency != 'BTC' && currency != 'sat') {
      amountUnitStr = this.filter.formatFiatAmount(amount) + ' ' + currency;
      amountSat = this.rate.fromFiat(amount, currency, coin).toFixed(0);
    } else if (currency == 'sat') {
      amountSat = amount;
      amountUnitStr = this.formatAmountStr(coin, amountSat);
      // convert sat to BTC or BCH
      amount = (amountSat * satToBtc).toFixed(8);
      currency = (coin).toUpperCase();
    } else {
      amountSat = parseInt((amount * unitToSatoshi).toFixed(0));
      amountUnitStr = this.formatAmountStr(coin, amountSat);
      // convert unit to BTC or BCH
      amount = (amountSat * satToBtc).toFixed(8);
      currency = (coin).toUpperCase();
    }

    return {
      amount: amount,
      currency: currency,
      alternativeIsoCode: alternativeIsoCode,
      amountSat: amountSat,
      amountUnitStr: amountUnitStr
    };
  };

  public satToUnit(amount: any): number {
    let settings = this.config.get()['wallet']['settings']; // TODO
    var unitToSatoshi = settings.unitToSatoshi;
    var satToUnit = 1 / unitToSatoshi;
    var unitDecimals = settings.unitDecimals;
    return parseFloat((amount * satToUnit).toFixed(unitDecimals));
  };

}
