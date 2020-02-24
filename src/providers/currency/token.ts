export interface Token {
  name: string;
  symbol: string;
  decimal: number;
  address: string;
}

export enum Tokens {
  USDC = 'usdc',
  GUSD = 'gusd',
  PAX = 'pax',
  DAI = 'dai',
  BAT = 'bat',
  BNB = 'bnb',
  LINK = 'link',
  CVC = 'cvc',
  MANA = 'mana',
  GNT = 'gnt',
  OMG = 'omg',
  USDT = 'usdt',
  TRX = 'trx',
  ZRX = 'zrx'
}

export type TokensMap<T> = { [key in Tokens]: T };

export const TokenOpts: TokensMap<Token> = {
  usdc: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimal: 6,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  },
  pax: {
    name: 'Paxos Standard',
    symbol: 'PAX',
    decimal: 18,
    address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1'
  },
  gusd: {
    name: 'Gemini Dollar',
    symbol: 'GUSD',
    decimal: 2,
    address: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd'
  },
  dai: {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimal: 18,
    address: '0x6b175474e89094c44da98b954eedeac495271d0f'
  },
  bat: {
    name: 'Basic Attention Token',
    symbol: 'BAT',
    decimal: 18,
    address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef'
  },
  bnb: {
    name: 'Binance Coin',
    symbol: 'BNB',
    decimal: 18,
    address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52'
  },
  link: {
    name: 'ChainLink',
    symbol: 'LINK',
    decimal: 18,
    address: '0x514910771af9ca656af840dff83e8264ecf986ca'
  },
  cvc: {
    name: 'Civic',
    symbol: 'CVC',
    decimal: 8,
    address: '0x41e5560054824ea6b0732e656e3ad64e20e94e45'
  },
  mana: {
    name: 'Decentraland',
    symbol: 'MANA',
    decimal: 18,
    address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
  },
  gnt: {
    name: 'Golem',
    symbol: 'GNT',
    decimal: 18,
    address: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d'
  },
  omg: {
    name: 'OmiseGO',
    symbol: 'OMG',
    decimal: 18,
    address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
  },
  usdt: {
    name: 'Tether USD',
    symbol: 'USDT',
    decimal: 6,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7'
  },
  trx: {
    name: 'Tron',
    symbol: 'TRX',
    decimal: 6,
    address: '0xf230b790e05390fc8295f4d3f60332c93bed42e2'
  },
  zrx: {
    name: '0x',
    symbol: 'ZRX',
    decimal: 18,
    address: '0xe41d2489571d322189246dafa5ebde1f4699f498'
  }
};
