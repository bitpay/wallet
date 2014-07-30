'use strict';

var chai = chai || require('chai');
var should = chai.should();
var sinon = require('sinon');
var is_browser = (typeof process == 'undefined' || typeof process.versions === 'undefined');
if (is_browser) {
  var copay = require('copay'); //browser
} else {
  var copay = require('../copay'); //node
}
var copayConfig = require('../config');
var Wallet = require('../js/models/core/Wallet');
var Structure = copay.Structure;
var Storage = require('./mocks/FakeStorage');
var Network = require('./mocks/FakeNetwork');
var Blockchain = require('./mocks/FakeBlockchain');
var bitcore = bitcore || require('bitcore');
var TransactionBuilder = bitcore.TransactionBuilder;
var Transaction = bitcore.Transaction;
var Address = bitcore.Address;
var PayPro = bitcore.PayPro;
var startServer = require('./mocks/FakePayProServer');

var G = is_browser ? window : global;
G.SSL_UNTRUSTED = true;

var server;

describe('PayPro (in Wallet) model', function() {
  var config = {
    // requiredCopayers: 3,
    // totalCopayers: 5,
    requiredCopayers: 1,
    totalCopayers: 1,
    spendUnconfirmed: true,
    reconnectDelay: 100,
    networkName: 'testnet',
  };

  var createW = function(netKey, N, conf) {
    var c = JSON.parse(JSON.stringify(conf || config));
    if (!N) N = c.totalCopayers;

    if (netKey) c.netKey = netKey;
    var mainPrivateKey = new copay.PrivateKey({
      networkName: config.networkName
    });
    var mainCopayerEPK = mainPrivateKey.deriveBIP45Branch().extendedPublicKeyString();
    c.privateKey = mainPrivateKey;

    c.publicKeyRing = new copay.PublicKeyRing({
      networkName: c.networkName,
      requiredCopayers: Math.min(N, c.requiredCopayers),
      totalCopayers: N,
    });
    c.publicKeyRing.addCopayer(mainCopayerEPK);

    c.txProposals = new copay.TxProposals({
      networkName: c.networkName,
    });

    var storage = new Storage(config.storage);
    var network = new Network(config.network);
    var blockchain = new Blockchain(config.blockchain);
    c.storage = storage;
    c.network = network;
    c.blockchain = blockchain;

    c.addressBook = {
      '2NFR2kzH9NUdp8vsXTB4wWQtTtzhpKxsyoJ': {
        label: 'John',
        copayerId: '026a55261b7c898fff760ebe14fd22a71892295f3b49e0ca66727bc0a0d7f94d03',
        createdTs: 1403102115,
        hidden: false
      },
      '2MtP8WyiwG7ZdVWM96CVsk2M1N8zyfiVQsY': {
        label: 'Jennifer',
        copayerId: '032991f836543a492bd6d0bb112552bfc7c5f3b7d5388fcbcbf2fbb893b44770d7',
        createdTs: 1403103115,
        hidden: false
      }
    };

    c.networkName = config.networkName;
    c.verbose = config.verbose;
    c.version = '0.0.1';

    return new Wallet(c);
  }

  var cachedW = null;
  var cachedWobj = null;
  var cachedCreateW = function() {
    if (!cachedW) {
      cachedW = createW();
      cachedWobj = cachedW.toObj();
      cachedWobj.opts.reconnectDelay = 100;
    }
    var w = Wallet.fromObj(cachedWobj, cachedW.storage, cachedW.network, cachedW.blockchain);
    return w;
  };

  var unspentTest = [{
    "address": "dummy",
    "scriptPubKey": "dummy",
    "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
    "vout": 1,
    "amount": 10,
    "confirmations": 7
  }];

  var createW2 = function(privateKeys, N, conf) {
    if (!N) N = 3;
    var netKey = 'T0FbU2JLby0=';
    var w = createW(netKey, N, conf);
    should.exist(w);

    var pkr = w.publicKeyRing;

    for (var i = 0; i < N - 1; i++) {
      if (privateKeys) {
        var k = privateKeys[i];
        pkr.addCopayer(k ? k.deriveBIP45Branch().extendedPublicKeyString() : null);
      } else {
        pkr.addCopayer();
      }
    }

    return w;
  };

  var cachedW2 = null;
  var cachedW2obj = null;
  var cachedCreateW2 = function() {
    if (!cachedW2) {
      cachedW2 = createW2();
      cachedW2obj = cachedW2.toObj();
      cachedW2obj.opts.reconnectDelay = 100;
    }
    var w = Wallet.fromObj(cachedW2obj, cachedW2.storage, cachedW2.network, cachedW2.blockchain);
    return w;
  };

  it('#start the example server', function(done) {
    startServer(function(err, s) {
      if (err) return done(err);
      server = s;
      server.uri = 'https://localhost:8080/-';
      done();
    });
  });

  it('#send a payment request', function(done) {
    var w = cachedCreateW2();
    should.exist(w);
    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);
    w.getUnspent = function(cb) {
      return setTimeout(function() {
        return cb(null, unspentTest, []);
      }, 1);
    };
    var address = 'bitcoin:mq7se9wy2egettFxPbmn99cK8v5AFq55Lx?amount=0.11&r=' + server.uri + '/request';
    var commentText = 'Hello, server. I\'d like to make a payment.';
    w.createTx(address, commentText, function(ntxid, ca) {
      if (w.totalCopayers > 1) {
        should.exist(ntxid);
        console.log('Sent TX proposal to other copayers:');
        console.log([ntxid, ca]);
        server.close(function() {
          done();
        });
      } else {
        console.log('Sending TX to merchant server:');
        console.log(ntxid);
        w.sendTx(ntxid, function(txid, ca) {
          should.exist(txid);
          console.log('TX sent:');
          console.log([ntxid, ca]);
          server.close(function() {
            done();
          });
        });
      }
    });
  });
});
