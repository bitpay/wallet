import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { availableCoins, CoinOpts } from './coin';
import { Token, TokenProvider } from './token';

import { PersistenceProvider } from '../../providers/persistence/persistence';

export type CoinsMap<T> = { [key in string]: T };

@Injectable()
export class CurrencyProvider {
  public coinOpts: CoinsMap<CoinOpts>;
  public ratesApi = {} as CoinsMap<string>;
  public blockExplorerUrls = {} as CoinsMap<string>;
  public blockExplorerUrlsTestnet = {} as CoinsMap<string>;
  public availableChains: string[];
  public availableTokens: Token[];
  public customERC20CoinsData;
  public customERC20Opts;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private tokenProvider: TokenProvider
  ) {
    this.coinOpts = availableCoins;
    this.availableTokens = Object.values(this.tokenProvider.tokens);
    this.availableChains = Object.keys(this.coinOpts);
    this.retreiveInfo();
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
            this.coinOpts = { ...this.customERC20CoinsData, ...availableCoins };
            const tokenOpts = {
              ...this.availableTokens,
              ...this.customERC20Opts
            };
            this.availableTokens = Object.values(tokenOpts);
            this.availableChains = Object.keys(this.coinOpts) as string[];
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
      symbol: customToken.symbol,
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

  isUtxoCoin(chain: string): boolean {
    return !!this.coinOpts[chain].properties.isUtxo;
  }

  isSingleAddress(chain: string): boolean {
    return !!this.coinOpts[chain].properties.singleAddress;
  }

  isSharedChain(chain: string): boolean {
    return !!this.coinOpts[chain].properties.hasMultiSig;
  }

  isERCToken(coin: string): boolean {
    return !!this.coinOpts[coin].properties.isERCToken;
  }

  isCustomERCToken(coin) {
    return this.coinOpts[coin] && this.coinOpts[coin].properties.isCustom;
  }

  getLinkedEthWallet(walletId: string, m: number): string {
    if (m === 1) return null;
    return walletId.replace(/-0x.*$/, '');
  }

  isMultiSend(chain: string): boolean {
    return !!this.coinOpts[chain].properties.hasMultiSend;
  }

  getAvailableCoins(): string[] {
    return this.availableChains;
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

  getMultiSigChains(): string[] {
    return this.availableChains.filter(chain => this.isSharedChain(chain));
  }

  getCoinName(chain: string): string {
    return this.coinOpts[chain].name;
  }

  getTokenName(tokenSymbol: string): string {
    const existToken = this.availableTokens
      ? this.availableTokens.find(
          tk => tk.symbol.toUpperCase() == tokenSymbol.toUpperCase()
        )
      : undefined;
    return existToken ? existToken.name : tokenSymbol;
  }
  /// Uppercase chain of tokenAddress
  getTokenChain(tokenAddress: string): string {
    return this.tokenProvider.tokens[tokenAddress].chain;
  }

  getChain(chain: string): string {
    return this.coinOpts[chain].chain;
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

  getTheme(chain: string) {
    return this.coinOpts[chain].theme;
  }

  getTokenAddress(coin) {
    let tokens = this.getAvailableTokens();
    const token = tokens.find(x => x.symbol == coin.toUpperCase());
    const tokenAddress = token && token.address;
    return tokenAddress;
  }
}
