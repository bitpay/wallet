'use strict';
var defaultConfig = {
  defaultLanguage: 'en',
  // DEFAULT network (livenet or testnet)
  networkName: 'livenet',
  logLevel: 'debug',


  // wallet limits
  limits: {
    totalCopayers: 12,
    mPlusN: 100,
  },

  // network layer config
  network: {
    testnet: {
      url: 'https://test-insight.bitpay.com:443',
      transports: ['polling'],
    },
    livenet: {
      url: 'https://insight.bitpay.com:443',
      transports: ['polling'],
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
    LocalStorage: true,
    //GoogleDrive: true,
  },

  GoogleDrive: {
    home: 'copay',

    /* 
     * This clientId was generated at:
     * https://console.developers.google.com/project
     * To run Copay with Google Drive at your domain you need
     * to generata your own Id.
     */
    // for localhost:3001 you can use  you can:
    clientId: '232630733383-a35gcnovnkgka94394i88gq60vtjb4af.apps.googleusercontent.com',

    // for copay.io:
    // clientId: '1036948132229-biqm3b8sirik9lt5rtvjo9kjjpotn4ac.apps.googleusercontent.com',
  },
};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
