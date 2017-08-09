'use strict';

angular.module('copayApp.services').factory('networkHelper', function($log, lodash, gettextCatalog, configService) {
  var root = {};

  // Define all supported networks.
  var networks = [
    {
      currency: 'btc',
      net: 'livenet',
      label: gettextCatalog.getString('Bitcoin'),
      units: [{
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getName: function() { return root.getName(this) },
      legacyName: 'livenet', // Used to update legacy wallets
      default:  true
    },
    {
      currency: 'btc',
      net: 'testnet',
      label: gettextCatalog.getString('Bitcoin Testnet'),
      units: [{
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getName: function() { return root.getName(this) },
      legacyName: 'testnet' // Used to update legacy wallets
    },
    {
      currency: 'bch',
      net: 'livenet',
      label: gettextCatalog.getString('Bitcoin Cash'),
      units: [{
        name: 'BCH',
        shortName: 'BCH',
        value: 100000000,
        decimals: 8,
        code: 'bch',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BCH)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin Cash transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getName: function() { return root.getName(this) },
    },
    {
      currency: 'bch',
      net: 'testnet',
      label: gettextCatalog.getString('Bitcoin Cash Testnet'),
      units: [{
        name: 'BCH',
        shortName: 'BCH',
        value: 100000000,
        decimals: 8,
        code: 'bch',
        kind: 'standard',
        userSelectable: true
      }, {
        name: 'bits (1,000,000 bits = 1BCH)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
        kind: 'alternative',
        userSelectable: true
      }, {
        name: 'satoshi (100,000,000 satoshi = 1BTC)',
        shortName: 'satoshis',
        value: 1,
        decimals: 0,
        code: 'satoshi',
        kind: 'atomic',
        userSelectable: false
      }],
      feePolicy: {
        options: {
          urgent: gettextCatalog.getString('Urgent'),
          priority: gettextCatalog.getString('Priority'),
          normal: gettextCatalog.getString('Normal'),
          economy: gettextCatalog.getString('Economy'),
          superEconomy: gettextCatalog.getString('Super Economy'),
          custom: gettextCatalog.getString('Custom')
        },
        explainer: {
          heading: gettextCatalog.getString('Bitcoin Cash transactions include a fee collected by miners on the network.'),
          description: gettextCatalog.getString('The higher the fee, the greater the incentive a miner has to include that transaction in a block. Current fees are determined based on network load and the selected policy.')
        }
      },
      getName: function() { return root.getName(this) },
    }
  ];

  // Initialize currency network settings if not present.
  var initConfig = function() {
    configService.whenAvailable(function(config) {

      var existingConfig = Object.keys(config.currencyNetworks);
      var opts = {
        currencyNetworks: {}
      };

      for (var i = 0; i < networks.length; i++) {
        if (!existingConfig.includes(networks[i].getName())) {
          var unitDesc = networks[i].units[0]; // Initialize to first element in units list
          opts.currencyNetworks[networks[i].getName()] = {
            unitName:           unitDesc.shortName,
            unitToAtomicUnit:   unitDesc.value,
            unitDecimals:       unitDesc.decimals,
            unitCode:           unitDesc.code,
            atomicUnitCode:     root.getAtomicUnit(networks[i].getName()),
            alternativeName:    'US Dollar', // Default to using USD for alternative currency
            alternativeIsoCode: 'USD',
            feeLevel:           'normal'
          };
        }
      }

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
      });
    });
  };

  initConfig();

  root.getNetworks = function() {
    return networks;
  };

  root.getLiveNetworks = function() {
    return lodash.filter(networks, function(n) {
      return root.isLivenet(n.net);
    });
  };

  root.getTestNetworks = function() {
    return lodash.filter(networks, function(n) {
      return root.isTestnet(n.net);
    });
  };

  root.getDefaultNetwork = function() {
    return lodash.find(networks, function(n) {
      return n.default;
    });
  };

  root.getNetworkByName = function(networkName) {
    return lodash.find(networks, function(n) {
      return n.getName() == networkName;
    });
//    var currency = root.parseCurrency(networkName);
//    var net = root.parseNet(networkName);
//    return lodash.find(networks, function(n) {
//      return n.currency == currency && n.net == net;
//    });
  };

  root.getName = function(network) {
    return network.net + '/' + network.currency;
  };

  root.getAtomicUnit = function(networkName) {
    var n = root.getNetworkByName(networkName);
    var unit = lodash.find(n.units, function(u) {
      return u.kind == 'atomic';
    });
    if (!unit) {
      $log.error('No atomic currency unit defined for network \`' + networkName + '\`');
    }    
    return unit;
  };

  root.getStandardUnit = function(networkName) {
    var n = root.getNetworkByName(networkName);
    var unit = lodash.find(n.units, function(u) {
      return u.kind == 'standard';
    });
    if (!unit) {
      $log.error('No standard currency unit defined for network \`' + networkName + '\`');
    }    
    return unit;
  };

  root.getASUnitRatio = function(networkName) {
    var aUnit = root.getAtomicUnit(networkName);
    var sUnit = root.getStandardUnit(networkName);
    return aUnit / sUnit;
  };

  // Update the specified legacy network name to use the newest format.
  root.getUpdatedNetworkName = function(networkName) {
    var network = lodash.find(networks, function(n) {
      return n.legacyName == networkName;
    });

    if (network) {
      return network.getName();
    } else {
      return networkName;
    }
  };

  // Parsers

  root.parseCurrency = function(networkName) {
    return networkName.trim().split('/')[1];
  };

  root.parseNet = function(networkName) {
    return networkName.trim().split('/')[0];
  };

  root.isLivenet = function(networkName) {
    return root.parseNet(networkName) == 'livenet';
  };

  root.isTestnet = function(networkName) {
    return root.parseNet(networkName) == 'testnet';
  };

  return root;
});
