'use strict';
var defaultConfig = {
  defaultLanguage: 'en',
  // DEFAULT network (livenet or testnet)
  networkName: 'testnet',
  forceNetwork: false,
  logLevel: 'info',


  // wallet limits
  limits: {
    totalCopayers: 12,
    mPlusN: 100,
  },

  // network layer config
  network: {
    testnet: {
      url: 'https://test-insight.bitpay.com:443'
    },
    livenet: {
      url: 'https://insight.bitpay.com:443'
    },
  },

  // wallet default config
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
    spendUnconfirmed: true,
    reconnectDelay: 5000,
    idleDurationMin: 4,
    settings: {
      unitName: 'bits',
      unitToSatoshi: 100,
      unitDecimals: 2,
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
    }
  },

  // local encryption/security config
  passphrase: {
    iterations: 100,
    storageSalt: 'mjuBtGybi/4=',
  },

  rate: {
    url: 'https://bitpay.com/api/rates',
    updateFrequencySeconds: 60 * 60
  },

  verbose: 1,

  plugins: {
    googleDrive: true,
  },

  googleDrive: {
    clientId: '1',
  },
};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
