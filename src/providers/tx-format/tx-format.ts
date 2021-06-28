import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { CurrencyProvider } from '../currency/currency';
import { FilterProvider } from '../filter/filter';
import { RateProvider } from '../rate/rate';

import * as _ from 'lodash';

export enum Coin {
  BTC = 'btc',
  BCH = 'bch',
  ETH = 'eth',
  XRP = 'xrp',
  USDC = 'usdc',
  GUSD = 'gusd',
  PAX = 'pax',
  BUSD = 'busd',
  DAI = 'dai',
  WBTC = 'wbtc',
  DOGE = 'doge'
}
@Injectable()
export class TxFormatProvider {
  private bitcoreCash;

  // TODO: implement configService
  public pendingTxProposalsCountForUs: number;

  constructor(
    private bwcProvider: BwcProvider,
    private rate: RateProvider,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private filter: FilterProvider,
    private logger: Logger
  ) {
    this.logger.debug('TxFormatProvider initialized');
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
  }

  public toCashAddress(address: string, withPrefix?: boolean): string {
    return this.bitcoreCash.Address(address).toString(!withPrefix);
  }

  public toLegacyAddress(address: string): string {
    let legacyAddr: string = this.bitcoreCash
      .Address(address)
      .toLegacyAddress();
    return legacyAddr;
  }

  public formatAmount(
    coin: string,
    tokenAddress: string,
    satoshis: number,
    fullPrecision?: boolean
  ): string {
    if (coin == 'sat') return satoshis.toString();

    // TODO : now only works for english, specify opts to change thousand separator and decimal separator
    let opts: any = {
      fullPrecision: !!fullPrecision
    };

    // TODO ???
    if (tokenAddress && this.currencyProvider.isCustomERCToken(coin)) {
      opts.toSatoshis = this.currencyProvider.getTokenPrecision(
        tokenAddress
      ).unitToSatoshi;
      opts.decimals = {
        full: {
          maxDecimals: 8,
          minDecimals: 8
        },
        short: {
          maxDecimals: 6,
          minDecimals: 2
        }
      };
    }
    return this.bwcProvider.getUtils().formatAmount(satoshis, coin, opts); // This util returns a string
  }

  public formatAmountStr(
    coin: string,
    tokenAddress: string,
    satoshis: number,
    fullPrecision?: boolean
  ): string {
    if (isNaN(satoshis)) return undefined;
    return (
      this.formatAmount(coin, tokenAddress, satoshis, fullPrecision) +
      ' ' +
      coin.toUpperCase()
    );
  }

  public toFiat(
    coin: string,
    satoshis: number,
    code: string,
    tokenAddress: string,
    opts?: { rates? }
  ): Promise<string> {
    // TODO not a promise
    return new Promise(resolve => {
      if (isNaN(satoshis)) return resolve();
      var v1;
      v1 = this.rate.toFiat(satoshis, code, coin, tokenAddress, opts);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatToUSD(
    coin: string,
    satoshis: number,
    tokenAddress: string
  ): Promise<any> {
    // TODO not a promise
    return new Promise(resolve => {
      let v1: number;
      if (isNaN(satoshis)) return resolve();
      v1 = this.rate.toFiat(satoshis, 'USD', coin, tokenAddress);
      if (!v1) return resolve(null);
      return resolve(v1.toFixed(2));
    });
  }

  public formatAlternativeStr(
    coin: string,
    satoshis: number,
    tokenAddress: string
  ): string {
    if (isNaN(satoshis)) return undefined;
    let settings = this.configProvider.get().wallet.settings;

    let val = (() => {
      const v1num = parseFloat(
        this.rate
          .toFiat(satoshis, settings.alternativeIsoCode, coin, tokenAddress)
          .toFixed(2)
      );
      const v1str = this.filter.formatFiatAmount(v1num);
      if (!v1str) return null;

      return v1str + ' ' + settings.alternativeIsoCode;
    }).bind(this);

    if (!this.rate.isCoinRateAvailable(coin)) return null;
    return val();
  }

  public processTx(coin: string, tx) {
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
            o.amountStr = this.formatAmountStr(coin, tx.tokenAddress, o.amount);
            o.alternativeAmountStr = this.formatAlternativeStr(
              coin,
              o.amount,
              tx.tokenAddress
            );
            return total + o.amount;
          },
          0
        );
      }
      tx.toAddress = tx.outputs[0].toAddress;

      // toDo: translate all tx.outputs[x].toAddress ?
      if (tx.toAddress && coin == 'bch') {
        tx.toAddress = this.toCashAddress(tx.toAddress);
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

    tx.amountStr = this.formatAmountStr(coin, tx.tokenAddress, tx.amount);
    tx.alternativeAmountStr = this.formatAlternativeStr(
      coin,
      tx.amount,
      tx.tokenAddress
    );

    const chain =
      tx.chain || this.currencyProvider.getChain(coin).toLowerCase();
    tx.feeStr = tx.fee
      ? this.formatAmountStr(chain, tx.tokenAddress, tx.fee)
      : tx.fees
      ? this.formatAmountStr(chain, tx.tokenAddress, tx.fees)
      : 'N/A';
    if (tx.amountStr) {
      tx.amountValueStr = tx.amountStr.split(' ')[0];
      tx.amountUnitStr = tx.amountStr.split(' ')[1];
    }

    if (tx.size && (tx.fee || tx.fees) && tx.amountUnitStr)
      tx.feeRate = `${((tx.fee || tx.fees) / tx.size).toFixed(0)} sat/byte`;

    if (tx.addressTo && chain == 'bch') {
      tx.addressTo = this.toCashAddress(tx.addressTo);
    }

    return tx;
  }

  public parseAmount(
    coin: string,
    tokenAddress: string,
    amount,
    currency: string,
    opts?: { onlyIntegers?: boolean; rates? }
  ) {
    const { alternativeIsoCode } = this.configProvider.get().wallet.settings;
    const { unitToSatoshi, unitDecimals } = this.currencyProvider.getPrecision(
      coin
    );
    const satToUnit = 1 / unitToSatoshi;
    let amountUnitStr;
    let amountSat;

    // If fiat currency
    if (
      !Coin[currency] &&
      !this.currencyProvider.isCustomERCToken(currency) &&
      currency != 'sat'
    ) {
      let formattedAmount: string =
        opts && opts.onlyIntegers
          ? this.filter.formatFiatAmount(amount.toFixed(0))
          : this.filter.formatFiatAmount(amount);
      amountUnitStr = formattedAmount + ' ' + currency;
      amountSat = Number(
        this.rate.fromFiat(amount, currency, coin, opts).toFixed(0)
      );
    } else if (currency == 'sat') {
      amountSat = Number(amount);
      amountUnitStr = this.formatAmountStr(coin, tokenAddress, amountSat);
      // convert sat to Coin
      amount = (amountSat * satToUnit).toFixed(unitDecimals);
      currency = coin.toUpperCase();
    } else {
      amountSat = parseInt((amount * unitToSatoshi).toFixed(0), 10);
      amountUnitStr = this.formatAmountStr(coin, tokenAddress, amountSat);
      // convert unit to Coin
      amount = (amountSat * satToUnit).toFixed(unitDecimals);
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

  public satToUnit(amount: number, coin: string): number {
    let { unitToSatoshi, unitDecimals } = this.currencyProvider.getPrecision(
      coin
    );
    let satToUnit = 1 / unitToSatoshi;
    return parseFloat((amount * satToUnit).toFixed(unitDecimals));
  }
}
