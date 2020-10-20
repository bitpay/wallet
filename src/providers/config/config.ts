import { Injectable } from '@angular/core';
import { CoinsMap, CurrencyProvider } from '../../providers/currency/currency';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash';

export interface Config {
  limits: {
    totalCopayers: number;
    mPlusN: number;
  };

  wallet: {
    requiredCopayers: number;
    totalCopayers: number;
    spendUnconfirmed: boolean;
    reconnectDelay: number;
    idleDurationMin: number;
    settings: {
      unitName: string;
      unitToSatoshi: number;
      unitDecimals: number;
      unitCode: string;
      alternativeName: string;
      alternativeIsoCode: string;
      defaultLanguage: string;
      feeLevel: string;
    };
  };

  bws: {
    url: string;
  };

  adPubKey: {
    pubkey: string;
  };

  download: {
    bitpay: {
      url: string;
    };
    copay: {
      url: string;
    };
  };

  rateApp: {
    bitpay: {
      ios: string;
      android: string;
      wp: string;
    };
    copay: {
      ios: string;
      android: string;
      wp: string;
    };
  };

  lock: {
    method: any;
    value: any;
    bannedUntil: any;
  };

  showIntegration: {
    coinbase: boolean;
    debitcard: boolean;
    amazon: boolean;
    mercadolibre: boolean;
    shapeshift: boolean;
    buycrypto: boolean;
    exchangecrypto: boolean;
    giftcards: boolean;
    walletConnect: boolean;
  };

  pushNotifications: {
    enabled: boolean;
  };

  desktopNotifications: {
    enabled: boolean;
  };

  confirmedTxsNotifications: {
    enabled: boolean;
  };

  productsUpdates: {
    enabled: boolean;
  };

  offersAndPromotions: {
    enabled: boolean;
  };

  emailNotifications: {
    enabled: boolean;
    email: string;
  };

  emailFor?: any;
  bwsFor?: any;
  aliasFor?: any;
  colorFor?: any;
  touchIdFor?: any;

  log: {
    weight: number;
  };

  blockExplorerUrl: CoinsMap<string>;

  blockExplorerUrlTestnet: CoinsMap<string>;

  allowMultiplePrimaryWallets: boolean;

  legacyQrCode: {
    show: boolean;
  };

  theme: {
    enabled: boolean;
    system: boolean;
    name: string;
  };

  totalBalance: {
    show: boolean;
  };
}

@Injectable()
export class ConfigProvider {
  public configCache: Config;
  public readonly configDefault: Config;

  constructor(
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private persistence: PersistenceProvider
  ) {
    this.logger.debug('ConfigProvider initialized');
    this.configDefault = {
      // wallet limits
      limits: {
        totalCopayers: 6,
        mPlusN: 100
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
          defaultLanguage: '',
          feeLevel: 'normal'
        }
      },

      // Bitcore wallet service URL
      bws: {
        url: 'https://bws.bitpay.com/bws/api' // Uncomment and replace w/ http://localhost:3232/bws/api for testing
      },

      adPubKey: {
        pubkey:
          '022fd3864dcba0c5177a0b76a94143ac26dcf4cf32ce7bb3d42a1cecae4102e105'
      },
      download: {
        bitpay: {
          url: 'https://bitpay.com/wallet'
        },
        copay: {
          url: 'https://copay.io/#download'
        }
      },

      rateApp: {
        bitpay: {
          ios:
            'https://itunes.apple.com/app/bitpay-secure-bitcoin-wallet/id1149581638',
          android:
            'https://play.google.com/store/apps/details?id=com.bitpay.wallet',
          wp: ''
        },
        copay: {
          ios: 'https://itunes.apple.com/app/copay-bitcoin-wallet/id951330296',
          android:
            'https://play.google.com/store/apps/details?id=com.bitpay.copay',
          wp: ''
        }
      },

      lock: {
        method: null,
        value: null,
        bannedUntil: null
      },

      // External services
      showIntegration: {
        coinbase: true,
        debitcard: true,
        amazon: true,
        mercadolibre: true,
        shapeshift: true,
        buycrypto: true,
        exchangecrypto: true,
        giftcards: true,
        walletConnect: true
      },

      pushNotifications: {
        enabled: true
      },

      desktopNotifications: {
        enabled: true
      },

      confirmedTxsNotifications: {
        enabled: true
      },

      productsUpdates: {
        enabled: true
      },

      offersAndPromotions: {
        enabled: true
      },

      emailNotifications: {
        enabled: false,
        email: ''
      },

      log: {
        weight: 3
      },

      blockExplorerUrl: this.currencyProvider.getBlockExplorerUrls(),

      blockExplorerUrlTestnet: this.currencyProvider.getBlockExplorerUrlsTestnet(),

      allowMultiplePrimaryWallets: false,

      legacyQrCode: {
        show: false
      },

      theme: {
        enabled: true,
        system: true,
        name: 'light'
      },

      totalBalance: {
        show: true
      }
    };
  }

  public load() {
    return new Promise(resolve => {
      this.persistence
        .getConfig()
        .then((config: Config) => {
          if (!_.isEmpty(config)) {
            this.logger.debug('Using Custom Configuration');
            this.configCache = _.clone(config);
            this.backwardCompatibility();
          } else {
            this.logger.debug('Using Default Configurartion');
            this.configCache = _.clone(this.configDefault);
          }
          this.logImportantConfig(this.configCache);
          resolve();
        })
        .catch(err => {
          this.logger.error(err.message);
          this.logger.error(
            'There was an error reading the app config. It was reseted to default values'
          );
          this.configCache = _.clone(this.configDefault);
          this.reset(); // remove local config
          resolve();
        });
    });
  }

  private logImportantConfig(config: Config): void {
    const spendUnconfirmed = config.wallet.spendUnconfirmed;
    const lockMethod = config && config.lock ? config.lock.method : null;

    this.logger.debug(
      'Config | spendUnconfirmed: ' +
        spendUnconfirmed +
        ' - lockMethod: ' +
        lockMethod
    );
  }

  /**
   * @param newOpts object or string (JSON)
   */
  public set(newOpts) {
    const config = _.cloneDeep(this.configDefault);

    if (_.isString(newOpts)) {
      newOpts = JSON.parse(newOpts);
    }
    _.merge(config, this.configCache, newOpts);
    this.configCache = config;
    this.persistence.storeConfig(this.configCache).then(() => {
      this.logger.info('Config saved');
    });
  }

  public get(): Config {
    return this.configCache;
  }

  public getDefaults(): Config {
    return this.configDefault;
  }

  private backwardCompatibility() {
    this.logger.debug('Config: setting backwardCompatibility');
    // these ifs are to avoid migration problems
    if (this.configCache.bws) {
      this.configCache.bws = this.configDefault.bws;
    }
    if (!this.configCache.wallet) {
      this.configCache.wallet = this.configDefault.wallet;
    }
    if (!this.configCache.wallet.settings.unitCode) {
      this.configCache.wallet.settings.unitCode = this.configDefault.wallet.settings.unitCode;
    }
    if (!this.configCache.showIntegration) {
      this.configCache.showIntegration = this.configDefault.showIntegration;
    } else {
      if (this.configCache.showIntegration.giftcards !== false) {
        this.configCache.showIntegration.giftcards = this.configDefault.showIntegration.giftcards;
      }
      if (this.configCache.showIntegration.buycrypto !== false) {
        this.configCache.showIntegration.buycrypto = this.configDefault.showIntegration.buycrypto;
      }
      if (this.configCache.showIntegration.exchangecrypto !== false) {
        this.configCache.showIntegration.exchangecrypto = this.configDefault.showIntegration.exchangecrypto;
      }
      if (this.configCache.showIntegration.coinbase !== false) {
        this.configCache.showIntegration.coinbase = this.configDefault.showIntegration.coinbase;
      }
    }
    if (!this.configCache.pushNotifications) {
      this.configCache.pushNotifications = this.configDefault.pushNotifications;
    }
    if (!this.configCache.desktopNotifications) {
      this.configCache.desktopNotifications = this.configDefault.desktopNotifications;
    }
    if (!this.configCache.emailNotifications) {
      this.configCache.emailNotifications = this.configDefault.emailNotifications;
    }
    if (!this.configCache.lock) {
      this.configCache.lock = this.configDefault.lock;
    }
    if (!this.configCache.confirmedTxsNotifications) {
      this.configCache.confirmedTxsNotifications = this.configDefault.confirmedTxsNotifications;
    }

    if (this.configCache.wallet.settings.unitCode == 'bit') {
      // Convert to BTC. Bits will be disabled
      this.configCache.wallet.settings.unitName = this.configDefault.wallet.settings.unitName;
      this.configCache.wallet.settings.unitToSatoshi = this.configDefault.wallet.settings.unitToSatoshi;
      this.configCache.wallet.settings.unitDecimals = this.configDefault.wallet.settings.unitDecimals;
      this.configCache.wallet.settings.unitCode = this.configDefault.wallet.settings.unitCode;
    }

    if (
      !this.configCache.theme ||
      (this.configCache.theme && !this.configCache.theme.enabled)
    ) {
      this.configCache.theme = this.configDefault.theme;
    }

    if (!this.configCache.totalBalance) {
      this.configCache.totalBalance = this.configDefault.totalBalance;
    }

    if (!this.configCache.legacyQrCode) {
      this.configCache.legacyQrCode = this.configDefault.legacyQrCode;
    }
  }

  public reset() {
    this.persistence.clearConfig();
  }
}
