import { CoinsMap } from './currency';

export interface CoinOpts {
  // Bitcore-node
  name: string;
  chain: string;
  coin: string;
  unitInfo: {
    // Config/Precision
    unitName: string;
    unitToSatoshi: number;
    unitDecimals: number;
    unitCode: string;
  };
  properties: {
    // Properties
    hasMultiSig: boolean;
    hasMultiSend: boolean;
    isUtxo: boolean;
    isERCToken: boolean;
    isStableCoin: boolean;
    singleAddress: boolean;
  };
  paymentInfo: {
    paymentCode: string;
    protocolPrefix: { livenet: string; testnet: string };
    // Urls
    ratesApi: string;
    blockExplorerUrls: string;
    blockExplorerUrlsTestnet: string;
  };
  feeInfo: {
    // Fee Units
    feeUnit: string;
    feeUnitAmount: number;
    blockTime: number;
    maxMerchantFee: string;
  };
  theme: {
    coinColor: string;
    backgroundColor: string;
    gradientBackgroundColor: string;
  };
}

export const availableCoins: CoinsMap<CoinOpts> = {
  btc: {
    name: 'Bitcoin',
    chain: 'BTC',
    coin: 'btc',
    unitInfo: {
      unitName: 'BTC',
      unitToSatoshi: 100000000,
      unitDecimals: 8,
      unitCode: 'btc'
    },
    properties: {
      hasMultiSig: true,
      hasMultiSend: true,
      isUtxo: true,
      isERCToken: false,
      isStableCoin: false,
      singleAddress: false
    },
    paymentInfo: {
      paymentCode: 'BIP73',
      protocolPrefix: { livenet: 'bitcoin', testnet: 'bitcoin' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/btc',
      blockExplorerUrls: 'bitpay.com/insight/#/BTC/mainnet/',
      blockExplorerUrlsTestnet: 'bitpay.com/insight/#/BTC/testnet/'
    },
    feeInfo: {
      feeUnit: 'sat/byte',
      feeUnitAmount: 1000,
      blockTime: 10,
      maxMerchantFee: 'urgent'
    },
    theme: {
      coinColor: '#f7931a',
      backgroundColor: '#f7921a',
      gradientBackgroundColor: '#f7921a'
    }
  },
  bch: {
    name: 'Bitcoin Cash',
    chain: 'BCH',
    coin: 'bch',
    unitInfo: {
      unitName: 'BCH',
      unitToSatoshi: 100000000,
      unitDecimals: 8,
      unitCode: 'bch'
    },
    properties: {
      hasMultiSig: true,
      hasMultiSend: true,
      isUtxo: true,
      isERCToken: false,
      isStableCoin: false,
      singleAddress: false
    },
    paymentInfo: {
      paymentCode: 'BIP73',
      protocolPrefix: { livenet: 'bitcoincash', testnet: 'bchtest' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/bch',
      blockExplorerUrls: 'bitpay.com/insight/#/BCH/mainnet/',
      blockExplorerUrlsTestnet: 'bitpay.com/insight/#/BCH/testnet/'
    },
    feeInfo: {
      feeUnit: 'sat/byte',
      feeUnitAmount: 1000,
      blockTime: 10,
      maxMerchantFee: 'normal'
    },
    theme: {
      coinColor: '#2fcf6e',
      backgroundColor: '#2fcf6e',
      gradientBackgroundColor: '#2fcf6e'
    }
  },
  eth: {
    name: 'Ethereum',
    chain: 'ETH',
    coin: 'eth',
    unitInfo: {
      unitName: 'ETH',
      unitToSatoshi: 1e18,
      unitDecimals: 18,
      unitCode: 'eth'
    },
    properties: {
      hasMultiSig: true,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: false,
      isStableCoin: false,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/eth',
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
      coinColor: '#6b71d6',
      backgroundColor: '#1e90ff',
      gradientBackgroundColor: '#1e90ff'
    }
  },
  xrp: {
    name: 'XRP',
    chain: 'XRP',
    coin: 'xrp',
    unitInfo: {
      unitName: 'XRP',
      unitToSatoshi: 1e6,
      unitDecimals: 6,
      unitCode: 'xrp'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: false,
      isStableCoin: false,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'BIP73',
      protocolPrefix: { livenet: 'ripple', testnet: 'ripple' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/xrp',
      blockExplorerUrls: 'xrpscan.com/',
      blockExplorerUrlsTestnet: 'test.bithomp.com/explorer/'
    },
    feeInfo: {
      feeUnit: 'drops',
      feeUnitAmount: 1e6,
      blockTime: 0.05,
      maxMerchantFee: 'normal'
    },
    theme: {
      coinColor: '#000000',
      backgroundColor: '#565d6d',
      gradientBackgroundColor: '#565d6d'
    }
  },
  busd: {
    name: 'Binance USD Coin',
    chain: 'ETH',
    coin: 'busd',
    unitInfo: {
      unitName: 'BUSD',
      unitToSatoshi: 1e18,
      unitDecimals: 18,
      unitCode: 'busd'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: true,
      isStableCoin: true,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681b',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/busd',
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
      coinColor: '#f3ba2d',
      backgroundColor: 'rgba(135,206,250,1)',
      gradientBackgroundColor: 'rgba(30,144,255, 0.2)'
    }
  },
  pax: {
    name: 'Paxos Standard',
    chain: 'ETH',
    coin: 'pax',
    unitInfo: {
      unitName: 'PAX',
      unitToSatoshi: 1e18,
      unitDecimals: 18,
      unitCode: 'pax'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: true,
      isStableCoin: true,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681b',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/pax',
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
      coinColor: '#e6f3f9',
      backgroundColor: '#00845d',
      gradientBackgroundColor: '#00845d'
    }
  },
  usdc: {
    name: 'USD Coin',
    chain: 'ETH',
    coin: 'usdc',
    unitInfo: {
      unitName: 'USDC',
      unitToSatoshi: 1e6,
      unitDecimals: 6,
      unitCode: 'usdc'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: true,
      isStableCoin: true,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681b',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/usdc',
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
  },
  gusd: {
    name: 'Gemini Dollar',
    chain: 'ETH',
    coin: 'gusd',
    unitInfo: {
      unitName: 'GUSD',
      unitToSatoshi: 1e2,
      unitDecimals: 2,
      unitCode: 'gusd'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: true,
      isStableCoin: true,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681b',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/gusd',
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
      coinColor: '#00ddfa',
      backgroundColor: '#00dcfa',
      gradientBackgroundColor: '#00dcfa'
    }
  },
  dai: {
    name: 'DAI',
    chain: 'ETH',
    coin: 'dai',
    unitInfo: {
      unitName: 'DAI',
      unitToSatoshi: 1e18,
      unitDecimals: 18,
      unitCode: 'dai'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: true,
      isStableCoin: true,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681b',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/gusd',
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
      coinColor: '#00ddfa', // TODO: change to proper color after beta
      backgroundColor: '#00dcfa', // TODO: change to proper color after beta
      gradientBackgroundColor: '#00dcfa' // TODO: change to proper color after beta
    }
  },
  wbtc: {
    name: 'Wrapped Bitcoin',
    chain: 'ETH',
    coin: 'wbtc',
    unitInfo: {
      unitName: 'WBTC',
      unitToSatoshi: 1e8,
      unitDecimals: 8,
      unitCode: 'wbtc'
    },
    properties: {
      hasMultiSig: false,
      hasMultiSend: false,
      isUtxo: false,
      isERCToken: true,
      isStableCoin: true,
      singleAddress: true
    },
    paymentInfo: {
      paymentCode: 'EIP681b',
      protocolPrefix: { livenet: 'ethereum', testnet: 'ethereum' },
      ratesApi: 'https://bws.bitpay.com/bws/api/v3/fiatrates/btc',
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
      coinColor: '#00ddfa', // TODO: change to proper color after beta
      backgroundColor: '#00dcfa', // TODO: change to proper color after beta
      gradientBackgroundColor: '#00dcfa' // TODO: change to proper color after beta
    }
  }
};
