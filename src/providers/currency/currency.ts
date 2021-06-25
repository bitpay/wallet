import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { availableChains, CoinOpts } from './coin';
import { TokenProvider } from './token';

import { PersistenceProvider } from '../../providers/persistence/persistence';

export type CoinsMap<T> = { [key in string]: T };

@Injectable()
export class CurrencyProvider {
  public chainOpts: CoinsMap<CoinOpts>;
  public ratesApi = {} as CoinsMap<string>;
  public blockExplorerUrls = {} as CoinsMap<string>;
  public blockExplorerUrlsTestnet = {} as CoinsMap<string>;
  public availableChains: string[];
  public availableTokens = {} as { [key: string]: CoinOpts };
  public availableCoins: CoinOpts[];
  public customERC20CoinsData;
  public customERC20Opts;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private tokenProvider: TokenProvider
  ) {
    this.chainOpts = availableChains;
    this.availableTokens = this.tokenProvider.tokens;
    this.availableChains = Object.keys(this.chainOpts);
    this.retreiveInfo();
  }

  private retreiveInfo() {
    for (const opts of Object.values(this.chainOpts)) {
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
            this.chainOpts = { ...availableChains };
            const tokenOpts = {
              ...Object.values(this.availableTokens),
              ...this.customERC20Opts
            };
            this.availableTokens = tokenOpts;
            this.availableChains = Object.keys(this.chainOpts) as string[];
            this.availableCoins = [
              ...Object.values(this.availableTokens),
              ...Object.values(this.chainOpts)
            ];
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
    return !!this.chainOpts[chain].properties.isUtxo;
  }

  isSingleAddress(chain: string): boolean {
    return !!this.chainOpts[chain].properties.singleAddress;
  }

  isSharedChain(chain: string): boolean {
    return !!this.chainOpts[chain].properties.hasMultiSig;
  }

  isERCToken(tokenAddress: string): boolean {
    return (
      this.tokenProvider.tokens[tokenAddress] &&
      this.tokenProvider.tokens[tokenAddress].chain === 'ETH'
    );
  }

  isCustomERCToken(coin) {
    return this.chainOpts[coin] && this.chainOpts[coin].properties.isCustom;
  }

  getLinkedEthWallet(walletId: string, m: number): string {
    if (m === 1) return null;
    return walletId.replace(/-0x.*$/, '');
  }

  isMultiSend(chain: string): boolean {
    return !!this.chainOpts[chain].properties.hasMultiSend;
  }

  getAvailableCoins(): string[] {
    return this.availableChains;
  }

  getAvailableChains(): string[] {
    return _.uniq(
      _.map(Object.values(this.chainOpts), (opts: CoinOpts) => {
        return opts.chain.toLowerCase();
      })
    );
  }

  getAvailableTokens(): CoinOpts[] {
    return Object.values(this.availableTokens);
  }

  getMultiSigChains(): string[] {
    return this.availableChains.filter(chain => this.isSharedChain(chain));
  }

  getCoinName(chain: string): string {
    return this.chainOpts[chain].name;
  }

  getTokenName(tokenSymbol: string): string {
    const existToken = this.availableTokens
      ? Object.values(this.availableTokens).find(
          tk => tk.tokenInfo.symbol.toUpperCase() == tokenSymbol.toUpperCase()
        )
      : undefined;
    return existToken ? existToken.name : tokenSymbol;
  }
  /// Uppercase chain of tokenAddress
  getTokenChain(tokenAddress: string): string {
    return (
      this.availableTokens[tokenAddress] &&
      this.availableTokens[tokenAddress].chain
    );
  }

  getChain(chain: string): string {
    return this.chainOpts[chain].chain;
  }

  getRatesApi() {
    return this.ratesApi;
  }

  getTokenRatesApi(tokenSymbol: string) {
    return `https://bws.bitpay.com/bws/api/v3/fiatrates/${tokenSymbol.toLowerCase()}`;
  }

  getBlockExplorerUrls() {
    return this.blockExplorerUrls;
  }

  getBlockExplorerUrlsTestnet() {
    return this.blockExplorerUrlsTestnet;
  }

  getPaymentCode(coin: string): string {
    return this.chainOpts[coin].paymentInfo.paymentCode;
  }

  getPrecision(chain: string) {
    return this.chainOpts[chain].unitInfo;
  }

  getTokenPrecision(tokenAddress: string) {
    return this.tokenProvider.getTokenUnitInfo(tokenAddress);
  }

  getProtocolPrefix(coin: string, network: string) {
    return this.chainOpts[coin].paymentInfo.protocolPrefix[network];
  }

  getFeeUnits(coin: string) {
    return this.chainOpts[coin].feeInfo;
  }

  getMaxMerchantFee(coin: string): string {
    return this.chainOpts[coin].feeInfo.maxMerchantFee;
  }

  getTheme(chain: string) {
    return this.chainOpts[chain].theme;
  }

  getTokenAddress(coin) {
    let tokens = this.getAvailableTokens();
    const token = tokens.find(x => x.tokenInfo.symbol == coin.toUpperCase());
    const tokenAddress = token && token.tokenInfo.address;
    return tokenAddress;
  }
}
