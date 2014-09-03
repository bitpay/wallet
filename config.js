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
    host: 'test-insight.bitpay.com',
    port: 443,
    schema: 'https'
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
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
    }
  },

  // blockchain service API config
  blockchain: {
    schema: 'https',
    host: 'test-insight.bitpay.com',
    port: 443,
    retryDelay: 1000,
  },
  // socket service API config
  socket: {
    schema: 'https',
    host: 'test-insight.bitpay.com',
    port: 443,
    reconnectDelay: 1000,
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
