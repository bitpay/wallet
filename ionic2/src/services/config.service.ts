import { Injectable } from '@angular/core';
import { Logger } from 'angular2-logger/core';
import lodash from 'lodash';

import { StorageService } from './storage.service';

@Injectable()
export class ConfigService {

  constructor(
    public logger: Logger,
    public storageService: StorageService
  ) {}

  defaultConfig: any = {
    // wallet limits
    limits: {
      totalCopayers: 6,
      mPlusN: 100,
    },

    // Bitcore wallet service URL
    bws: {
      url: 'https://bws.bitpay.com/bws/api',
    },

    download: {
      url: 'https://bitpay.com/wallet',
    },

    rateApp: {
      ios: 'http://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=1149581638&pageNumber=0&sortOrdering=2&type=Purple+Software&mt=8',
      android: 'https://play.google.com/store/apps/details?id=com.bitpay.wallet',
      wp: ''
    },

    // wallet default config
    wallet: {
      requiredCopayers: 2,
      totalCopayers: 3,
      spendUnconfirmed: false,
      reconnectDelay: 5000,
      idleDurationMin: 4,
      settings: {
        unitName: 'BTC',
        unitToSatoshi: 100000000,
        unitDecimals: 8,
        unitCode: 'btc',
        alternativeName: 'US Dollar',
        alternativeIsoCode: 'USD',
      }
    },

    // External services
    glidera: {
      enabled: true,
      testnet: false
    },

    coinbase: {
      enabled: false, //disable coinbase for this release
      testnet: false
    },

    bitpayCard: {
      enabled: true
    },

    amazon: {
      enabled: true
    },

    //Experimental Features

    recentTransactions: {
      enabled: false //disabled by default
    },

    frequentlyUsed: {
      enabled: true
    },

    rates: {
      url: 'https://insight.bitpay.com:443/api/rates',
    },

    release: {
      url: 'https://api.github.com/repos/bitpay/copay/releases/latest'
    },

    pushNotifications: {
      enabled: true,
      config: {
        android: {
          senderID: '1036948132229',
          icon: 'push',
          iconColor: '#2F4053'
        },
        ios: {
          alert: 'true',
          badge: 'true',
          sound: 'true',
        },
        windows: {},
      }
    },

    emailNotifications: {
      enabled: false,
    },
  };

  configCache = null;

  colorList = [
    {
      color: "#DD4B39",
      name: "Cinnabar"
    },
      {
        color: "#F38F12",
        name: "Carrot Orange"
    },
      {
        color: "#FAA77F",
        name: "Light Salmon"
    },
      {
        color: "#D0B136",
        name: "Metallic Gold"
    },
      {
        color: "#9EDD72",
        name: "Feijoa"
    },
      {
        color: "#29BB9C",
        name: "Shamrock"
    },
      {
        color: "#019477",
        name: "Observatory"
    },
      {
        color: "#77DADA",
        name: "Turquoise Blue"
    },
      {
        color: "#4A90E2",
        name: "Cornflower Blue"
    },
      {
        color: "#484ED3",
        name: "Free Speech Blue"
    },
      {
        color: "#9B59B6",
        name: "Deep Lilac"
    },
      {
        color: "#E856EF",
        name: "Free Speech Magenta"
    },
      {
        color: "#FF599E",
        name: "Brilliant Rose"
    },
      {
        color: "#7A8C9E",
        name: "Light Slate Grey"
    }
  ];

  _queue = [];

  getColorList() {
    return this.colorList;
  }

  getSync() {
    if (!this.configCache)
      throw new Error('configService#getSync called when cache is not initialized');

    return this.configCache;
  }

  whenAvailable(cb) {
    if (!this.configCache) {
      this._queue.push(cb);
      return;
    }
    return cb(this.configCache);
  }


  get(cb) {

    this.storageService.getConfig((err, localConfig) => {
      if (localConfig) {
        this.configCache = JSON.parse(localConfig);

        //these ifs are to avoid migration problems
        if (!this.configCache.bws) {
          this.configCache.bws = this.defaultConfig.bws;
        }
        if (!this.configCache.wallet) {
          this.configCache.wallet = this.defaultConfig.wallet;
        }
        if (!this.configCache.wallet.settings.unitCode) {
          this.configCache.wallet.settings.unitCode = this.defaultConfig.wallet.settings.unitCode;
        }
        if (!this.configCache.glidera) {
          this.configCache.glidera = this.defaultConfig.glidera;
        }
        if (!this.configCache.coinbase) {
          this.configCache.coinbase = this.defaultConfig.coinbase;
        }
        if (!this.configCache.amazon) {
          this.configCache.amazon = this.defaultConfig.amazon;
        }
        if (!this.configCache.bitpayCard) {
          this.configCache.bitpayCard = this.defaultConfig.bitpayCard;
        }
        if (!this.configCache.recentTransactions) {
          this.configCache.recentTransactions = this.defaultConfig.recentTransactions;
        }
        if (!this.configCache.frequentlyUsed) {
          this.configCache.frequentlyUsed = this.defaultConfig.frequentlyUsed;
        }
        if (!this.configCache.pushNotifications) {
          this.configCache.pushNotifications = this.defaultConfig.pushNotifications;
        }

      } else {
        this.configCache = lodash.clone(this.defaultConfig);
      };

      this.configCache.bwsFor = this.configCache.bwsFor || {};
      this.configCache.colorFor = this.configCache.colorFor || {};
      this.configCache.aliasFor = this.configCache.aliasFor || {};
      this.configCache.emailFor = this.configCache.emailFor || {};

      // Coinbase
      // Disabled for testnet
      this.configCache.coinbase.testnet = false;

      this.logger.debug('Preferences read:', this.configCache)

      lodash.each(this._queue, (x) => {
        setTimeout(() => {
          return x(this.configCache);
        }, 1);
      });
      this._queue = [];

      return cb(err, this.configCache);
    });
  }

  set(newOpts, cb) {
    let config = lodash.cloneDeep(this.defaultConfig);
    this.storageService.getConfig((err, oldOpts) => {
      oldOpts = oldOpts || {};

      if (lodash.isString(oldOpts)) {
        oldOpts = JSON.parse(oldOpts);
      }
      if (lodash.isString(config)) {
        config = JSON.parse(config);
      }
      if (lodash.isString(newOpts)) {
        newOpts = JSON.parse(newOpts);
      }

      lodash.merge(config, oldOpts, newOpts);
      this.configCache = config;

      //$rootScope.$emit('Local/SettingsUpdated');

      this.storageService.storeConfig(JSON.stringify(config), cb);
    });
  };

  reset(cb) {
    this.configCache = lodash.clone(this.defaultConfig);
    this.storageService.removeConfig(cb);
  }

  getDefaults() {
    return lodash.clone(this.defaultConfig);
  }

}
