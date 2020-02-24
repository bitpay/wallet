import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { availableCoins, CoinOpts } from './coin';
import { Token, TokenOpts, Tokens } from './token';

export enum Coin {
  BTC = 'btc',
  BCH = 'bch',
  ETH = 'eth',
  XRP = 'xrp'
}

export type CoinsMap<T> = { [key in Coin | Tokens]: T };

@Injectable()
export class CurrencyProvider {
  public coinOpts: CoinsMap<CoinOpts>;
  public ratesApi = {} as CoinsMap<string>;
  public blockExplorerUrls = {} as CoinsMap<string>;
  public availableCoins: Coin[];
  public availableTokens: Token[];

  constructor() {
    this.coinOpts = availableCoins;
    this.availableTokens = Object.values(TokenOpts);
    this.availableCoins = Object.keys(this.coinOpts) as Coin[];
    for (const opts of Object.values(this.coinOpts)) {
      const { paymentInfo, coin } = opts;
      const { blockExplorerUrls, ratesApi } = paymentInfo;
      this.blockExplorerUrls[coin] = blockExplorerUrls;
      this.ratesApi[coin] = ratesApi;
    }
  }

  isUtxoCoin(coin: Coin): boolean {
    return !!this.coinOpts[coin].properties.isUtxo;
  }

  isSingleAddress(coin: Coin): boolean {
    return !!this.coinOpts[coin].properties.singleAddress;
  }

  isSharedCoin(coin: Coin): boolean {
    return !!this.coinOpts[coin].properties.hasMultiSig;
  }

  isERCToken(coin: Coin): boolean {
    return !!this.coinOpts[coin].properties.isERCToken;
  }

  getLinkedEthWallet(coin: Coin, walletId: string): string {
    if (!this.coinOpts[coin].properties.isERCToken) return null;
    return walletId.replace(/-0x.*$/, '');
  }

  isMultiSend(coin: Coin): boolean {
    return !!this.coinOpts[coin].properties.hasMultiSend;
  }

  getAvailableCoins(): Coin[] {
    return this.availableCoins;
  }

  getAvailableChains(): string[] {
    return _.uniq(
      _.map(Object.values(this.coinOpts), (opts: CoinOpts) =>
        opts.chain.toLowerCase()
      )
    );
  }

  getAvailableTokens(): Token[] {
    return this.availableTokens;
  }

  getMultiSigCoins(): Coin[] {
    return this.availableCoins.filter(coin => this.isSharedCoin(coin));
  }

  getCoinName(coin: Coin): string {
    return this.coinOpts[coin].name;
  }

  getChain(coin: Coin): string {
    return this.coinOpts[coin].chain;
  }

  getRatesApi() {
    return this.ratesApi;
  }

  getBlockExplorerUrls() {
    return this.blockExplorerUrls;
  }

  getPaymentCode(coin: Coin): string {
    return this.coinOpts[coin].paymentInfo.paymentCode;
  }

  getPrecision(coin: Coin) {
    return this.coinOpts[coin].unitInfo;
  }

  getProtocolPrefix(coin: Coin, network: string) {
    return this.coinOpts[coin].paymentInfo.protocolPrefix[network];
  }

  getFeeUnits(coin: Coin) {
    return this.coinOpts[coin].feeInfo;
  }

  getMaxMerchantFee(coin: Coin): string {
    return this.coinOpts[coin].feeInfo.maxMerchantFee;
  }

  getTheme(coin: Coin) {
    return this.coinOpts[coin].theme;
  }

  getModuleColor(coin: Coin): string {
    return this.coinOpts[coin].qrColor.moduleColor;
  }

  getPositionRingColor(coin: Coin): string {
    return this.coinOpts[coin].qrColor.positionRingColor;
  }

  getPositionCenterColor(coin: Coin): string {
    return this.coinOpts[coin].qrColor.positionCenterColor;
  }
}
