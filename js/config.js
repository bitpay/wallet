'use strict';

var config = {
  networkName: 'testnet',
  network: {
     key: 'lwjd5qra8257b9',
    //   This is for running local peerJs with params: ./peerjs  -p 10009  -k 'sdfjhwefh'
    // key: 'sdfjhwefh',
    // host: 'localhost',
    // port: 10009,
    // path: '/',
    maxPeers: 3,
    debug: 3,
  },
  limits: {
    totalCopayers: 10,
    mPlusN: 15
  },
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
    spendUnconfirmed: 1,
    verbose: 1,
  },
  blockchain: {
    host: 'localhost',
    port: 3001
  },
  socket: {
    host: 'localhost',
    port: 3001
  },
  verbose: 1,
};

var log = function () {
  if (config.verbose) console.log(arguments);
}

