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
      host: 'test-insight.bitpay.com',
      port: 443,
      schema: 'https'
    },
    livenet: {
      host: 'insight.bitpay.com',
      port: 443,
      schema: 'https'
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

};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
