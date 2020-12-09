import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { availableCoins, CoinOpts } from './coin';
import { Token, TokenOpts } from './token';

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
  WBTC = 'wbtc'
}

export type CoinsMap<T> = { [key in Coin]: T };

@Injectable()
export class CurrencyProvider {
  public coinOpts: CoinsMap<CoinOpts>;
  public ratesApi = {} as CoinsMap<string>;
  public blockExplorerUrls = {} as CoinsMap<string>;
  public blockExplorerUrlsTestnet = {} as CoinsMap<string>;
  public availableCoins: Coin[];
  public availableTokens: Token[];

  constructor() {
    this.coinOpts = availableCoins;
    this.availableTokens = Object.values(TokenOpts);
    this.availableCoins = Object.keys(this.coinOpts) as Coin[];
    for (const opts of Object.values(this.coinOpts)) {
      const { paymentInfo, coin } = opts;
      const {
        blockExplorerUrls,
        blockExplorerUrlsTestnet,
        ratesApi
      } = paymentInfo;
      this.blockExplorerUrls[coin] = blockExplorerUrls;
      this.blockExplorerUrlsTestnet[coin] = blockExplorerUrlsTestnet;
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

  getLinkedEthWallet(coin: Coin, walletId: string, m: number): string {
    if (!this.coinOpts[coin].properties.isERCToken && coin !== 'eth')
      return null;
    if (coin === 'eth' && m === 1) return null;
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

  getBlockExplorerUrlsTestnet() {
    return this.blockExplorerUrlsTestnet;
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
}
