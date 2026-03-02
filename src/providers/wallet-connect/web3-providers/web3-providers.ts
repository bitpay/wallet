export interface IProviderData {
  name: string;
  short_name: string;
  chain: string;
  network: string;
  chain_id: number;
  network_id: number;
  rpc_url: string;
  native_currency: IAssetData;
}

export interface IAssetData {
  symbol: string;
  name: string;
  decimals: string;
  contractAddress: string;
  balance?: string;
}

export const ETH_STANDARD_PATH = "m/44'/60'/0'/0";
export const MAINNET_CHAIN_ID = 1;
export const ROPSTEN_CHAIN_ID = 3;
export const RINKEBY_CHAIN_ID = 4;
export const GOERLI_CHAIN_ID = 5;
export const KOVAN_CHAIN_ID = 42;

export const supportedProviders: IProviderData[] = [
  {
    name: 'Ethereum Mainnet',
    short_name: 'eth',
    chain: 'ETH',
    network: 'mainnet',
    chain_id: 1,
    network_id: 1,
    rpc_url: 'https://mainnet.infura.io/v3/%API_KEY%',
    native_currency: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: '18',
      contractAddress: '',
      balance: ''
    }
  },
  {
    name: 'Ethereum Kovan',
    short_name: 'kov',
    chain: 'ETH',
    network: 'kovan',
    chain_id: 42,
    network_id: 42,
    rpc_url: 'https://kovan.infura.io/v3/%API_KEY%',
    native_currency: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: '18',
      contractAddress: '',
      balance: ''
    }
  }
];
