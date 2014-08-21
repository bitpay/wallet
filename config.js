'use strict';
var defaultConfig = {
  // DEFAULT network (livenet or testnet)
  networkName: 'livenet',
  forceNetwork: false,

  // DEFAULT unit: Bit
  unitName: 'bits',
  unitToSatoshi: 100,

  // wallet limits
  limits: {
    totalCopayers: 12,
    mPlusN: 100,
    minAmountSatoshi: 5400,
  },

  // network layer (PeerJS) config
  network: {
    // Use this to run your own local PeerJS server
    // with params: ./peerjs  -p 10009  -k '6d6d751ea61e26f2'
    /*
key: '6d6d751ea61e26f2',
host: 'localhost',
port: 10009,
path: '/',
*/

    // Use this to connect to bitpay's PeerJS server
    key: 'satoshirocks',
    // host: '162.242.219.26',
    // port: 10000,
    // secure: false,
    host: 'live.copay.io',
    port: 9000,
    secure: true,
    path: '/',

    // other PeerJS config
    maxPeers: 15,
    debug: 2,

    // PeerJS internal config object 
    config: {
      'iceServers': [
        // Pass in STUN and TURN servers for maximum network compatibility
        {
        url: 'stun:162.242.219.26'
      }, {
        url: 'turn:162.242.219.26',
        username: 'bitcore',
        credential: 'bitcore',
      }
      // {
      //   url: 'stun:stun.l.google.com:19302'
      // }, {
      //   url: 'stun:stun1.l.google.com:19302'
      // }, {
      //   url: 'stun:stun2.l.google.com:19302'
      // }, {
      //   url: 'stun:stun3.l.google.com:19302'
      // }, {
      //   url: 'stun:stun4.l.google.com:19302'
      // }, {
      //   url: 'stun:stunserver.org'
      // }
      // // Options fot TURN servers with p2p communications are not possible.
      // {
      //   url: 'turn:numb.viagenie.ca',
      //   credential: 'muazkh',
      //   username: 'webrtc@live.com'
      // }, {
      //   url: 'turn:192.158.29.39:3478?transport=udp',
      //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      //   username: '28224511:1379330808'
      // }, {
      //   url: 'turn:192.158.29.39:3478?transport=tcp',
      //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      //   username: '28224511:1379330808'
      // }
      ]
    }
  },

  // wallet default config
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
    spendUnconfirmed: true,
    verbose: 1,
    // will duplicate itself after each try
    reconnectDelay: 5000,
    idleDurationMin: 4
  },

  // blockchain service API config
  blockchain: {
    schema: 'https',
    host: 'insight.bitpay.com',
    port: 443,
    retryDelay: 1000,
  },
  // socket service API config
  socket: {
    schema: 'https',
    host: 'insight.bitpay.com',
    port: 443,
    reconnectDelay: 1000,
  },

  // local encryption/security config
  passphrase: {
    iterations: 100,
    storageSalt: 'mjuBtGybi/4=',
  },

  disableVideo: true,
  verbose: 1,
};
if (typeof module !== 'undefined')
  module.exports = defaultConfig;
