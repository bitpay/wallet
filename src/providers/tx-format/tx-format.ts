import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FilterProvider } from '../filter/filter';
import { RateProvider } from '../rate/rate';

import * as _ from 'lodash';

@Injectable()
export class TxFormatProvider {
  private bitcoreCash;

  // TODO: implement configService
  public pendingTxProposalsCountForUs: number;

  constructor(
    private bwcProvider: BwcProvider,
    private rate: RateProvider,
    private configProvider: ConfigProvider,
    private filter: FilterProvider,
    private logger: Logger
  ) {
    this.logger.debug('TxFormatProvider initialized');
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
  }

  public toCashAddress(address: string, withPrefix?: boolean): string {
    let cashAddr: string = this.bitcoreCash.Address(address).toString();

    if (withPrefix) {
      return cashAddr;
    }

    return cashAddr.split(':')[1]; // rm prefix
  }

  public toLegacyAddress(address: string): string {
    let legacyAddr: string = this.bitcoreCash
      .Address(address)
      .toLegacyAddress();
    return legacyAddr;
  }

  // TODO: Check return of formatAmount(...), sometimes returns a number and sometimes a string
  public formatAmount(satoshis: number, fullPrecision?: boolean) {
    let settings = this.configProvider.get().wallet.settings;

    if (settings.unitCode == 'sat') return satoshis;

    // TODO : now only works for english, specify opts to change thousand separator and decimal separator
    var opts = {
      fullPrecision: !!fullPrecision
    };
    return this.bwcProvider
      .getUtils()
      .formatAmount(satoshis, settings.unitCode, opts);
  }

  public formatAmountStr(coin: string, satoshis: number): string {
    if (isNaN(satoshis)) return undefined;
    return this.formatAmount(satoshis) + ' ' + coin.toUpperCase();
  }

  public toFiat(coin: string, satoshis: number, code: string): Promise<string> {
    // TODO not a promise
    return new Promise(resolve => {
      if (isNaN(satoshis)) return resolve();
      var v1;
      v1 = this.rate.toFiat(satoshis, code, coin);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatToUSD(coin: string, satoshis: number): Promise<any> {
    // TODO not a promise
    return new Promise(resolve => {
      let v1: number;
      if (isNaN(satoshis)) return resolve();
      v1 = this.rate.toFiat(satoshis, 'USD', coin);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatAlternativeStr(coin: string, satoshis: number): string {
    if (isNaN(satoshis)) return undefined;
    let settings = this.configProvider.get().wallet.settings;

    let val = (() => {
      var v1 = parseFloat(
        this.rate.toFiat(satoshis, settings.alternativeIsoCode, coin).toFixed(2)
      );
      v1 = this.filter.formatFiatAmount(v1);
      if (!v1) return null;

      return v1 + ' ' + settings.alternativeIsoCode;
    }).bind(this);

    if (
      (!this.rate.isBtcAvailable() && coin == 'btc') ||
      (!this.rate.isBchAvailable() && coin == 'bch')
    )
      return null;
    return val();
  }

  public processTx(coin: string, tx, useLegacyAddress: boolean) {
    if (!tx || tx.action == 'invalid') return tx;

    // New transaction output format. Fill tx.amount and tx.toAmount for
    // backward compatibility.
    if (tx.outputs && tx.outputs.length) {
      var outputsNr = tx.outputs.length;

      if (tx.action != 'received') {
        if (outputsNr > 1) {
          tx.recipientCount = outputsNr;
          tx.hasMultiplesOutputs = true;
        }
        tx.amount = _.reduce(
          tx.outputs,
          (total, o) => {
            o.amountStr = this.formatAmountStr(coin, o.amount);
            o.alternativeAmountStr = this.formatAlternativeStr(coin, o.amount);
            return total + o.amount;
          },
          0
        );
      }
      tx.toAddress = tx.outputs[0].toAddress;

      // toDo: translate all tx.outputs[x].toAddress ?
      if (tx.toAddress && coin == 'bch') {
        tx.toAddress = useLegacyAddress
          ? this.toLegacyAddress(tx.toAddress)
          : this.toCashAddress(tx.toAddress);
      }
    }

    // Old tx format. Fill .output, for forward compatibility
    if (!tx.outputs) {
      tx.outputs = [
        {
          address: tx.toAddress,
          amount: tx.amount
        }
      ];
    }

    tx.amountStr = this.formatAmountStr(coin, tx.amount);
    tx.alternativeAmountStr = this.formatAlternativeStr(coin, tx.amount);

    tx.feeStr = tx.fee
      ? this.formatAmountStr(coin, tx.fee)
      : tx.fees
      ? this.formatAmountStr(coin, tx.fees)
      : 'N/A';
    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
    }

    if (tx.size && (tx.fee || tx.fees) && tx.amountUnitStr)
      tx.feeRate =
        ((tx.fee || tx.fees) / tx.size).toFixed(2) + ' ' + tx.amountUnitStr + '/b';

    if (tx.addressTo && coin == 'bch') {
      tx.addressTo = useLegacyAddress
        ? this.toLegacyAddress(tx.addressTo)
        : this.toCashAddress(tx.addressTo);
    }

    return tx;
  }

  public parseAmount(
    coin: string,
    amount,
    currency: string,
    onlyIntegers?: boolean
  ) {
    let settings = this.configProvider.get().wallet.settings;
    let satToBtc = 1 / 100000000;
    let unitToSatoshi = settings.unitToSatoshi;
    let amountUnitStr;
    let amountSat;
    let alternativeIsoCode = settings.alternativeIsoCode;

    // If fiat currency
    if (currency != 'BCH' && currency != 'BTC' && currency != 'sat') {
      let formattedAmount = onlyIntegers
        ? this.filter.formatFiatAmount(amount.toFixed(0))
        : this.filter.formatFiatAmount(amount);
      amountUnitStr = formattedAmount + ' ' + currency;
      amountSat = Number(this.rate.fromFiat(amount, currency, coin).toFixed(0));
    } else if (currency == 'sat') {
      amountSat = Number(amount);
      amountUnitStr = this.formatAmountStr(coin, amountSat);
      // convert sat to BTC or BCH
      amount = (amountSat * satToBtc).toFixed(8);
      currency = coin.toUpperCase();
    } else {
      amountSat = parseInt((amount * unitToSatoshi).toFixed(0), 10);
      amountUnitStr = this.formatAmountStr(coin, amountSat);
      // convert unit to BTC or BCH
      amount = (amountSat * satToBtc).toFixed(8);
      currency = coin.toUpperCase();
    }

    return {
      amount,
      currency,
      alternativeIsoCode,
      amountSat,
      amountUnitStr
    };
  }

  public satToUnit(amount): number {
    let settings = this.configProvider.get().wallet.settings;
    let unitToSatoshi = settings.unitToSatoshi;
    let satToUnit = 1 / unitToSatoshi;
    let unitDecimals = settings.unitDecimals;
    return parseFloat((amount * satToUnit).toFixed(unitDecimals));
  }
}
