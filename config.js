'use strict';
var defaultConfig = {
  // livenet or testnet
  networkName: 'testnet',

  // wallet limits
  limits: {
    totalCopayers: 12,
    mPlusN: 100
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
    host: '162.242.219.26',
    port: 10000,
    path: '/',

    // other PeerJS config
    maxPeers: 15,
    debug: 3,

    // Network encryption config
    sjclParams: {
      salt: 'mjuBtGybi/4=', // choose your own salt (base64)
      iter: 1000,
      mode: 'ccm',
      ts: parseInt(64),
    },

    // PeerJS internal config object 
    config: {
      'iceServers': [
        // Pass in STUN and TURN servers for maximum network compatibility
        // {
        //   url: 'stun:162.242.219.26'
        // }, {
        //   url: 'turn:162.242.219.26',
        //   username: 'bitcore',
        //   credential: 'bitcore',
        // }
        {
          url: 'stun:stun.l.google.com:19302'
        }, {
          url: 'stun:stun1.l.google.com:19302'
        }, {
          url: 'stun:stun2.l.google.com:19302'
        }, {
          url: 'stun:stun3.l.google.com:19302'
        }, {
          url: 'stun:stun4.l.google.com:19302'
        }, {
          url: 'stun:stunserver.org'
        }
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
    spendUnconfirmed: 1,
    verbose: 1,
    reconnectDelay: 5000,
  },

  // blockchain service API config
  blockchain: {
    host: 'test.insight.is',
    port: 80,
    retryDelay: 1000,
  },
  // socket service API config
  socket: {
    host: 'test.insight.is',
    port: 80,
    // will duplicate itself after each try
    reconnectDelay: 500,
  },

  // local encryption/security config
  passphrase: {
    iterations: 100,
    storageSalt: 'mjuBtGybi/4=', 
  },

  // theme list
  themes: ['default'],
  disableVideo: 1,
  verbose: 1,
};
