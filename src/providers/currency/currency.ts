import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { availableCoins, CoinOpts } from './coin';
import { Token, TokenOpts, TokensListAPIUrl } from './token';

import { PersistenceProvider } from '../../providers/persistence/persistence';

export type CoinsMap<T> = { [key in string]: T };
@Injectable()
export class CurrencyProvider {
  public coinOpts: CoinsMap<CoinOpts>;
  public ratesApi = {} as CoinsMap<string>;
  public blockExplorerUrls = {} as CoinsMap<string>;
  public blockExplorerUrlsTestnet = {} as CoinsMap<string>;
  public availableCoins: string[];
  public availableTokens: Token[];
  public availableCustomTokens: Token[];
  public customERC20CoinsData;
  public customERC20Opts;
  public COIN = {
    BTC: 'btc',
    BCH: 'bch',
    ETH: 'eth',
    XRP: 'xrp',
    USDC: 'usdc',
    GUSD: 'gusd',
    PAX: 'pax',
    BUSD: 'busd',
    DAI: 'dai',
    WBTC: 'wbtc',
    DOGE: 'doge',
    LTC: 'ltc'
  };

  constructor(
    private persistenceProvider: PersistenceProvider,
    private http: HttpClient
  ) {
    this.coinOpts = availableCoins;
    this.availableTokens = Object.values(TokenOpts);
    this.availableCoins = Object.keys(this.coinOpts);
    this.retreiveInfo();
    this.setCustomTokens();
  }

  private retreiveInfo() {
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

  load() {
    return this.persistenceProvider
      .getCustomTokenData()
      .then(customERC20CoinsData => {
        this.customERC20CoinsData = customERC20CoinsData;
        return this.persistenceProvider
          .getCustomTokenOpts()
          .then(customERC20Opts => {
            this.customERC20Opts = customERC20Opts;
            this.coinOpts = { ...availableCoins, ...this.customERC20CoinsData };
            const tokenOpts = { ...TokenOpts, ...this.customERC20Opts };
            this.availableTokens = Object.values(tokenOpts);
            this.availableCoins = Object.keys(this.coinOpts) as string[];
            this.retreiveInfo();
            return Promise.resolve();
          });
      });
  }

  public async addCustomToken(customToken) {
    const customTokenData = {};
    customTokenData[customToken.symbol] = {
      name: customToken.name,
      chain: 'ETH',
      coin: customToken.symbol,
      unitInfo: {
        unitName: customToken.symbol.toUpperCase(),
        unitToSatoshi: 10 ** customToken.decimals,
        unitDecimals: customToken.decimals,
        unitCode: customToken.symbol
      },
      properties: {
        hasMultiSig: false,
        hasMultiSend: false,
        isUtxo: false,
        isERCToken: true,
        isStableCoin: true,
        singleAddress: true,
        isCustom: true
      },
      paymentInfo: {
        paymentCode: 'EIP681b',
        protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
        ratesApi: '',
        blockExplorerUrls: 'etherscan.io/',
        blockExplorerUrlsTestnet: 'kovan.etherscan.io/'
      },
      feeInfo: {
        feeUnit: 'Gwei',
        feeUnitAmount: 1e9,
        blockTime: 0.2,
        maxMerchantFee: 'urgent'
      },
      theme: {
        coinColor: '#2775ca',
        backgroundColor: '#2775c9',
        gradientBackgroundColor: '#2775c9'
      }
    };
    const customERC20Opts = {};
    customERC20Opts[customToken.address] = {
      name: customToken.name,
      symbol: customToken.symbol.toUpperCase(),
      decimal: customToken.decimals,
      address: customToken.address
    };
    let storedCustomTokenData = await this.persistenceProvider.getCustomTokenData();
    await this.persistenceProvider.setCustomTokenData({
      ...storedCustomTokenData,
      ...customTokenData
    });
    let storedCustomTokenOpts = await this.persistenceProvider.getCustomTokenOpts();
    await this.persistenceProvider.setCustomTokenOpts({
      ...storedCustomTokenOpts,
      ...customERC20Opts
    });
    await this.load();
    return Promise.resolve();
  }

  setCustomTokens() {
    this.http.get(TokensListAPIUrl).subscribe((data: any) => {
      this.availableCustomTokens = Object.values(data.tokens) as Token[];
    });
  }

  isUtxoCoin(coin: string): boolean {
    return !!this.coinOpts[coin].properties.isUtxo;
  }

  isSingleAddress(coin: string): boolean {
    return !!this.coinOpts[coin].properties.singleAddress;
  }

  isSharedCoin(coin: string): boolean {
    return !!this.coinOpts[coin].properties.hasMultiSig;
  }

  isERCToken(coin: string): boolean {
    return !!this.coinOpts[coin].properties.isERCToken;
  }

  isCustomERCToken(coin) {
    return this.coinOpts[coin] && this.coinOpts[coin].properties.isCustom;
  }

  getLinkedEthWallet(coin: string, walletId: string, m: number): string {
    if (!this.coinOpts[coin].properties.isERCToken && coin !== 'eth')
      return null;
    if (coin === 'eth' && m === 1) return null;
    return walletId.replace(/-0x.*$/, '');
  }

  isMultiSend(coin: string): boolean {
    return !!this.coinOpts[coin].properties.hasMultiSend;
  }

  getAvailableCoins(): string[] {
    return this.availableCoins;
  }

  getBitPayPaymentsAvailableCoins(): Token[] {
    return Object.values(TokenOpts);
  }

  getAvailableChains(): string[] {
    return _.uniq(
      _.map(Object.values(this.coinOpts), (opts: CoinOpts) => {
        return opts.chain.toLowerCase();
      })
    );
  }

  getAvailableTokens(): Token[] {
    return this.availableTokens;
  }

  getAvailableCustomTokens(): Token[] {
    return this.availableCustomTokens;
  }

  getMultiSigCoins(): string[] {
    return this.availableCoins.filter(coin => this.isSharedCoin(coin));
  }

  getCoinName(coin: string): string {
    return this.coinOpts[coin].name;
  }

  getChain(coin: string): string {
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

  getPaymentCode(coin: string): string {
    return this.coinOpts[coin].paymentInfo.paymentCode;
  }

  getPrecision(coin: string) {
    return this.coinOpts[coin].unitInfo;
  }

  getProtocolPrefix(coin: string, network: string) {
    return this.coinOpts[coin].paymentInfo.protocolPrefix[network];
  }

  getFeeUnits(coin: string) {
    return this.coinOpts[coin].feeInfo;
  }

  getMaxMerchantFee(coin: string): string {
    return this.coinOpts[coin].feeInfo.maxMerchantFee;
  }

  getTheme(coin: string) {
    return this.coinOpts[coin].theme;
  }

  getTokenAddress(coin) {
    let tokens = this.getAvailableTokens();
    const token = tokens.find(x => x.symbol == coin.toUpperCase());
    const tokenAddress = token && token.address;
    return tokenAddress.toLowerCase();
  }
}
