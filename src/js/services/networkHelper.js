'use strict';

angular.module('copayApp.services').factory('networkHelper', function(lodash, gettextCatalog) {
  var root = {};

  var networks = [
    {
      chain:    'btc',
      net:      'livenet',
      label:    gettextCatalog.getString('Bitcoin'),
      unitList: [{
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
      }, {
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
      }],
      default:  true
    },
    {
      chain:    'btc',
      net:      'testnet',
      label:    gettextCatalog.getString('Bitcoin Testnet'),
      unitList: [{
        name: 'bits (1,000,000 bits = 1BTC)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
      }, {
        name: 'BTC',
        shortName: 'BTC',
        value: 100000000,
        decimals: 8,
        code: 'btc',
      }]
    },
    {
      chain:    'bch',
      net:      'livenet',
      label:    gettextCatalog.getString('Bitcoin Cash'),
      unitList: [{
        name: 'bits (1,000,000 bits = 1BCH)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
      }, {
        name: 'BCH',
        shortName: 'BCH',
        value: 100000000,
        decimals: 8,
        code: 'bch',
      }]
    },
    {
      chain:    'bch',
      net:      'testnet',
      label:    gettextCatalog.getString('Bitcoin Cash Testnet'),
      unitList: [{
        name: 'bits (1,000,000 bits = 1BCH)',
        shortName: 'bits',
        value: 100,
        decimals: 2,
        code: 'bit',
      }, {
        name: 'BCH',
        shortName: 'BCH',
        value: 100000000,
        decimals: 8,
        code: 'bch',
      }]
    }
  ];

  root.getAllNetworks = function() {
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

  root.getLivenetForChain = function(chain) {
    return lodash.find(networks, function(n) {
      return n.net == 'livenet' && n.chain == chain;
    });
  };

  root.getTestnetForChain = function(chain) {
    return lodash.find(networks, function(n) {
      return n.net == 'testnet' && n.chain == chain;
    });
  };

  root.getName = function(network) {
    return network.net + '/' + network.chain;
  };

  // Parsers

  root.parseChain = function(networkName) {
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
