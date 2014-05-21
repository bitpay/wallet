'use strict';
var defaultConfig = {
  networkName: 'testnet',
  network: {
    // key: 'lwjd5qra8257b9', //Copay API key for public PeerJS server
    //   This is for running local peerJs with params: ./peerjs  -p 10009  -k 'sdfjhwefh'
    //key: 'sdfjhwefh',
    //host: 'localhost',
    //port: 10009,
    //path: '/',
    //
    key: 'g23ihfh82h35rf', // api key for the peerjs server
    host: '162.242.245.33', // peerjs server
    port: 10009,
    path: '/',
    maxPeers: 15,
    debug: 3,
    sjclParams: {
      salt: 'mjuBtGybi/4=', // choose your own salt (base64)
      iter: 1000,
      mode: 'ccm',
      ts: parseInt(64),
    },
    config: {
      'iceServers': [
        // Pass in STUN and TURN servers for maximum network compatibility
        {
          url: 'stun:stun01.sipphone.com'
        }, {
          url: 'stun:stun.ekiga.net'
        }, {
          url: 'stun:stun.fwdnet.net'
        }, {
          url: 'stun:stun.ideasip.com'
        }, {
          url: 'stun:stun.iptel.org'
        }, {
          url: 'stun:stun.rixtelecom.se'
        }, {
          url: 'stun:stun.schlund.de'
        }, {
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
        }, {
          url: 'stun:stun.softjoys.com'
        }, {
          url: 'stun:stun.voiparound.com'
        }, {
          url: 'stun:stun.voipbuster.com'
        }, {
          url: 'stun:stun.voipstunt.com'
        }, {
          url: 'stun:stun.voxgratia.org'
        }, {
          url: 'stun:stun.xten.com'
        }, {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        }, {
          url: 'turn:192.158.29.39:3478?transport=udp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        }, {
          url: 'turn:192.158.29.39:3478?transport=tcp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        }
      ]
    }
  },
  limits: {
    totalCopayers: 12,
    mPlusN: 100
  },
  wallet: {
    requiredCopayers: 2,
    totalCopayers: 3,
    spendUnconfirmed: 1,
    verbose: 1,
  },
  blockchain: {
    host: 'test.insight.is',
    port: 3001
  },
  socket: {
    host: 'test.insight.is',
    port: 3001
  },
  passphrase: {
    iterations: 100,
    storageSalt: 'mjuBtGybi/4=', 
  },
  themes: ['default'],
  verbose: 1,
};
