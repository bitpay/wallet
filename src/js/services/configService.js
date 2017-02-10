'use strict';

angular.module('copayApp.services').factory('configService', function(storageService, lodash, $log, $timeout, $rootScope) {
  var root = {};

  var defaultConfig = {
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
    recentTransactions: {
      enabled: true,
    },

    hideNextSteps: {
      enabled: false,
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

  var configCache = null;

  root.getSync = function() {
    if (!configCache)
      throw new Error('configService#getSync called when cache is not initialized');

    return configCache;
  };

  root._queue = [];
  root.whenAvailable = function(cb) {
    if (!configCache) {
      root._queue.push(cb);
      return;
    }
    return cb(configCache);
  };


  root.get = function(cb) {

    storageService.getConfig(function(err, localConfig) {
      if (localConfig) {
        configCache = JSON.parse(localConfig);

        //these ifs are to avoid migration problems
        if (!configCache.bws) {
          configCache.bws = defaultConfig.bws;
        }
        if (!configCache.wallet) {
          configCache.wallet = defaultConfig.wallet;
        }
        if (!configCache.wallet.settings.unitCode) {
          configCache.wallet.settings.unitCode = defaultConfig.wallet.settings.unitCode;
        }

        if (!configCache.hideNextSteps) {
          configCache.hideNextSteps = defaultConfig.hideNextSteps;
        }

        if (!configCache.recentTransactions) {
          configCache.recentTransactions = defaultConfig.recentTransactions;
        }
        if (!configCache.pushNotifications) {
          configCache.pushNotifications = defaultConfig.pushNotifications;
        }

      } else {
        configCache = lodash.clone(defaultConfig);
      };

      configCache.bwsFor = configCache.bwsFor || {};
      configCache.colorFor = configCache.colorFor || {};
      configCache.aliasFor = configCache.aliasFor || {};
      configCache.emailFor = configCache.emailFor || {};

      $log.debug('Preferences read:', configCache)

      lodash.each(root._queue, function(x) {
        $timeout(function() {
          return x(configCache);
        }, 1);
      });
      root._queue = [];

      return cb(err, configCache);
    });
  };

  root.set = function(newOpts, cb) {
    var config = lodash.cloneDeep(defaultConfig);
    storageService.getConfig(function(err, oldOpts) {
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
      configCache = config;

      $rootScope.$emit('Local/SettingsUpdated');

      storageService.storeConfig(JSON.stringify(config), cb);
    });
  };

  root.reset = function(cb) {
    configCache = lodash.clone(defaultConfig);
    storageService.removeConfig(cb);
  };

  root.getDefaults = function() {
    return lodash.clone(defaultConfig);
  };


  return root;
});
