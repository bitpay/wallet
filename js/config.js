'use strict';

var config = {
  networkName: 'testnet',
  network: {
    apiKey: 'lwjd5qra8257b9',
    maxPeers: 3,
    debug: 3,
  },
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
  },
  insight: {
    host: 'localhost',
    port: 3001
  },
  verbose: 1,
};

var log = function () {
  if (config.verbose) console.log(arguments);
}

