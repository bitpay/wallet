import { CoinOpts } from './coin';
export class TokenProvider {
  public tokens: { [key: string]: CoinOpts };

  constructor() {
    this.getTokens();
  }

  public getTokenUnitInfo(tokenAddress: string) {
    if (this.tokens[tokenAddress]) {
      return this.tokens[tokenAddress].unitInfo;
    } else {
      console.log('#### getTokenUnitInfo error', tokenAddress);
      return undefined;
    }
  }

  private getTokens() {
    // retrieve Tokens from cache or endpoint
    this.tokens = {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
        name: 'USD Coin',
        chain: 'ETH',
        coin: 'usdc',
        unitInfo: {
          unitName: 'USDC',
          unitToSatoshi: 1e6,
          unitDecimals: 6,
          unitCode: 'usdc'
        },
        tokenInfo: {
          symbol: 'USDC',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        }
      },
      '0x8e870d67f660d95d5be530380d0ec0bd388289e1': {
        name: 'Paxos Standard',
        chain: 'ETH',
        coin: 'pax',
        unitInfo: {
          unitName: 'PAX',
          unitToSatoshi: 1e18,
          unitDecimals: 18,
          unitCode: 'pax'
        },
        tokenInfo: {
          symbol: 'PAX',
          address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
        }
      },
      '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd': {
        name: 'Gemini Dollar',
        coin: 'gusd',
        chain: 'ETH',
        unitInfo: {
          unitName: 'GUSD',
          unitToSatoshi: 1e2,
          unitDecimals: 2,
          unitCode: 'gusd'
        },
        tokenInfo: {
          symbol: 'GUSD',
          address: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd'
        }
      },
      '0x4fabb145d64652a948d72533023f6e7a623c7c53': {
        name: 'Binance USD Coin',
        coin: 'busd',
        chain: 'ETH',
        unitInfo: {
          unitName: 'BUSD',
          unitToSatoshi: 1e18,
          unitDecimals: 18,
          unitCode: 'busd'
        },
        tokenInfo: {
          symbol: 'BUSD',
          address: '0x4fabb145d64652a948d72533023f6e7a623c7c53'
        }
      },
      '0x6b175474e89094c44da98b954eedeac495271d0f': {
        name: 'Dai',
        coin: 'dai',
        chain: 'ETH',
        unitInfo: {
          unitName: 'DAI',
          unitToSatoshi: 1e18,
          unitDecimals: 18,
          unitCode: 'dai'
        },
        tokenInfo: {
          symbol: 'DAI',
          address: '0x6b175474e89094c44da98b954eedeac495271d0f'
        }
      },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
        name: 'Wrapped Bitcoin',
        coin: 'wbtc',
        chain: 'ETH',
        unitInfo: {
          unitName: 'WBTC',
          unitToSatoshi: 1e8,
          unitDecimals: 8,
          unitCode: 'wbtc'
        },
        tokenInfo: {
          symbol: 'WBTC',
          address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
        }
      }
    };
  }
}
