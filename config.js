'use strict';
var defaultConfig = {
  // DEFAULT network (livenet or testnet)
  networkName: 'testnet',
  forceNetwork: false,

  // DEFAULT unit: Bit
  unitName: 'bits',
  unitToSatoshi: 100,

  // wallet limits
  limits: {
    totalCopayers: 12,
    mPlusN: 100
  },

  // network layer config
  network: {
    url: 'ws://localhost:61614/stomp',
    headers: {
      retroactive: true,
      dispatchAsync: true,
    },
    disableHearbeat: true,
    maxPeers: 12,
  },

  // wallet default config
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
    spendUnconfirmed: true,
    verbose: 1,
    // will duplicate itself after each try
    reconnectDelay: 5000,
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

  // theme list
  themes: ['default'],
  disableVideo: true,
  verbose: 1,
};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
