'use strict';

var config = {
  networkName: 'testnet',
  network: {
    apiKey: 'lwjd5qra8257b9',
    maxPeers: 3,
    debug: 0,
  },
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
  },
  insight: {
    host: 'localhost',
    port: 3001
  },
  verbose: 0,
};

var log = function () {
  if (config.verbose) console.log(arguments);
}

