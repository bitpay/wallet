'use strict';
var defaultConfig = {
  // DEFAULT network (livenet or testnet)
  networkName: 'livenet',
  logLevel: 'info',


  // wallet limits
  limits: {
    totalCopayers: 1,
    mPlusN: 100,
  },

  // network layer config
  network: {
    testnet: {
      url: 'http://testnet.explorer.startcoin.org',
      transports: ['polling'],
    },
    livenet: {
      url: 'http://explorer.startcoin.org',
      transports: ['polling'],
    },
  },

  // wallet default config
  wallet: {
    requiredCopayers: 1,
    totalCopayers: 1,
    spendUnconfirmed: true,
    reconnectDelay: 5000,
    idleDurationMin: 4,
    settings: {
      unitName: 'START',
      unitToSatoshi: 100000000,
      unitDecimals: 8,
      alternativeName: 'Pound Sterling',
      alternativeIsoCode: 'GBP',
    }
  },

  // local encryption/security config
  passphraseConfig: {
    iterations: 5000,
    storageSalt: 'yfRXuHmeakCvsdsddvx',
  },

  rates: {
    url: 'https://insight.bitpay.com:443/api/rates',
  },

  verbose: 1,

  plugins: {
    //LocalStorage: true,
    //    EncryptedLocalStorage: true,
    //GoogleDrive: true,
    //InsightStorage: true
    EncryptedInsightStorage: true
  },

  // This can be changed on the UX > Settings > Insight livenet
  EncryptedInsightStorage: {
    url: 'http://dev.api.startwallet.com:80/api/email',
    //url: 'http://localhost:3001/api/email'

    // This KDF parameters are for the passphrase for Insight authentication
    // Are not related to encryption itself.
    //
    // WARN: Changing this parameters would prevent accesing previously created profiles.
    iterations: 1000,
    salt: 'PNhuTZ6Bjg2gD7ggf67',
  },

  minPasswordStrength: 4,

  /*
  GoogleDrive: {
    home: 'copay',

    
    // This clientId was generated at:
    // https://console.developers.google.com/project
    // To run Copay with Google Drive at your domain you need
    // to generata your own Id.
    // for localhost:3001 you can use  you can:
    //
    clientId: '232630733383-a35gcnovnkgka94394i88gq60vtjb4af.apps.googleusercontent.com',

    // for copay.io:
    // clientId: '1036948132229-biqm3b8sirik9lt5rtvjo9kjjpotn4ac.apps.googleusercontent.com',
  },
  */
};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
