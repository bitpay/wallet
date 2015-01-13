'use strict';
var defaultConfig = {
  defaultLanguage: 'en',
  // DEFAULT network (livenet or testnet)
  networkName: 'livenet',
  logLevel: 'info',


  // wallet limits
  limits: {
    totalCopayers: 6,
    mPlusN: 100,
  },

  // network layer config
  network: {
    testnet: {
      url: 'https://test-insight.bitpay.com:443',
      transports: ['polling'],
    },
    livenet: {
      url: 'https://digiexplorer.info:443',
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
      unitName: 'DGB',
      unitToSatoshi: 100000000,
      unitDecimals: 8,
      alternativeName: 'US Dollar',
      alternativeIsoCode: 'USD',
    }
  },

  // local encryption/security config
  passphraseConfig: {
    iterations: 5000,
    storageSalt: 'mjuBtGybi/4=',
  },

  rates: {
    url: 'https://digiexplorer.info/api/rates',
  },

  verbose: 1,

  plugins: {
    //LocalStorage: true,
    //    EncryptedLocalStorage: true,
    //GoogleDrive: true,
    //InsightStorage: true
    EncryptedInsightStorage: true,
  },

  // This can be changed on the UX > Settings > Insight livenet
  EncryptedInsightStorage: {
    url: 'https://digiexplorer.info:443/api/email',
    //url: 'http://localhost:3001/api/email'

    // This KDF parameters are for the passphrase for Insight authentication
    // Are not related to encryption itself.
    //
    // WARN: Changing this parameters would prevent accesing previously created profiles.
    iterations: 1000,
    salt: 'jBbYTj8zTrOt6V',
  },

  minPasswordStrength: 4,

  /*
  GoogleDrive: {
    home: 'copay',

    
    // This clientId was generated at:
    // https://console.developers.google.com/project
    // To run DGBWallet with Google Drive at your domain you need
    // to generata your own Id.
    // for localhost:3001 you can use  you can:
    //
    clientId: '232630733383-a35gcnovnkgka94394i88gq60vtjb4af.apps.googleusercontent.com',

    // for dgbwallet.com:
    // clientId: '1036948132229-biqm3b8sirik9lt5rtvjo9kjjpotn4ac.apps.googleusercontent.com',
  },
  */
};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
