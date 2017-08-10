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
      getURI: function() { return root.getURI(this) },
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
      getURI: function() { return root.getURI(this) },
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
      getURI: function() { return root.getURI(this) },
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
      getURI: function() { return root.getURI(this) },
    }
  ];

  // Initialize currency network settings if not present.
  var initConfig = function() {
    configService.whenAvailable(function(config) {

      var existingConfig = Object.keys(config.currencyNetworks);
      var opts = {
        currencyNetworks: {
          default: 'livenet/btc'
        }
      };

      for (var i = 0; i < networks.length; i++) {
        if (!existingConfig.includes(networks[i].getURI())) {
          var unitDesc = networks[i].units[0]; // Initialize to first element in units list
          opts.currencyNetworks[networks[i].getURI()] = {
            unitName:           unitDesc.shortName,
            unitToAtomicUnit:   unitDesc.value,
            unitDecimals:       unitDesc.decimals,
            unitCode:           unitDesc.code,
            atomicUnitCode:     root.getAtomicUnit(networks[i].getURI()),
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

  root.getNetworkByName = function(networkURI) {
    return lodash.find(networks, function(n) {
      return n.getURI() == networkURI;
    });
//    var currency = root.parseCurrency(networkURI);
//    var net = root.parseNet(networkURI);
//    return lodash.find(networks, function(n) {
//      return n.currency == currency && n.net == net;
//    });
  };

  root.getURI = function(network) {
    return network.net + '/' + network.currency;
  };

  root.getAtomicUnit = function(networkURI) {
    var n = root.getNetworkByName(networkURI);
    var unit = lodash.find(n.units, function(u) {
      return u.kind == 'atomic';
    });
    if (!unit) {
      $log.error('No atomic currency unit defined for network \`' + networkURI + '\`');
    }    
    return unit;
  };

  root.getStandardUnit = function(networkURI) {
    var n = root.getNetworkByName(networkURI);
    var unit = lodash.find(n.units, function(u) {
      return u.kind == 'standard';
    });
    if (!unit) {
      $log.error('No standard currency unit defined for network \`' + networkURI + '\`');
    }    
    return unit;
  };

  root.getASUnitRatio = function(networkURI) {
    var aUnit = root.getAtomicUnit(networkURI);
    var sUnit = root.getStandardUnit(networkURI);
    return aUnit.value / sUnit.value;
  };

  // Update the specified legacy network name to use the newest format.
  root.getUpdatednetworkURI = function(networkURI) {
    var network = lodash.find(networks, function(n) {
      return n.legacyName == networkURI;
    });

    if (network) {
      return network.getURI();
    } else {
      return networkURI;
    }
  };

  // Parsers

  root.parseCurrency = function(networkURI) {
    return networkURI.trim().split('/')[1];
  };

  root.parseNet = function(networkURI) {
    return networkURI.trim().split('/')[0];
  };

  root.isLivenet = function(networkURI) {
    return root.parseNet(networkURI) == 'livenet';
  };

  root.isTestnet = function(networkURI) {
    return root.parseNet(networkURI) == 'testnet';
  };

  return root;
});
