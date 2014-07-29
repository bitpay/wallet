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

var addCopayers = function(w) {
  for (var i = 0; i < 4; i++) {
    w.publicKeyRing.addCopayer();
  }
};



var chai = chai || require('chai');
var should = chai.should();

var FakeStorage = require('./mocks/FakeLocalStorage');
//var copay = copay || require('../copay');
var sinon = require('sinon');
var FakeNetwork = require('./mocks/FakeNetwork');
var FakeBlockchain = require('./mocks/FakeBlockchain');
var FakeStorage = require('./mocks/FakeStorage');
var WalletFactory = require('../js/models/core/WalletFactory');
var Passphrase = require('../js/models/core/Passphrase');



var G = typeof window !== 'undefined' ? window : global;
G.SSL_UNTRUSTED = true;

if (!is_browser) {
  // Disable strictSSL
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

  var _request = require('request');
  G.$http = function(options) {
    var ret = {
      success: function(cb) {
        this._success = cb;
        return this;
      },
      error: function(cb) {
        this._error = cb;
        return this;
      }
    };
    if (options.responseType === 'arraybuffer') {
      delete options.responseType;
      options.encoding = null;
    }
    _request(options, function(err, res, body) {
      if (err) return ret._error(null, null, null, options);
      return ret._success(body, res.statusCode, res.headers, options);
    });
    return ret;
  };
}

function startServer_() {
  if (is_browser) {
    return cb(null, {
      close: function() {
        ;
      }
    });
  }

  var spawn = require('child_process').spawn;
  var path = require('path');

  //var bc = path.dirname(require.resolve('bitcore/package.json'));
  //var bc = path.dirname(require.resolve(__dirname + '/../node_modules/bitcore/package.json'));
  var bc = path.dirname(require.resolve(__dirname + '/../../bitcore/package.json'));

  var options = {
    cwd: process.cwd(),
    env: process.env,
    setsid: false,
    customFds: [-1, -1, -1]
  };

  var ps = spawn('node',
    [bc + '/examples/PayPro/index.js', '-p', '8080'],
    options);

  ps.close = function() {
    ps.once('error', function() {
      server.kill('SIGKILL');
    });
    ps.kill('SIGTERM');
  };

  process.on('exit', function() {
    ps.close();
  });

  return cb(null, ps);
}

function startServer(cb) {
  if (is_browser) {
    return cb(null, {
      close: function() {
        ;
      }
    });
  }

  var path = require('path');
  var bc = path.dirname(require.resolve(__dirname + '/../../bitcore/package.json'));
  var example = bc + '/examples/PayPro/server.js';
  var server = require(example);

  server.listen(8080, function(addr) {
    return cb(null, server);
  });
}

// var server = startServer();
// server.uri = 'https://localhost:8080/-';

var server;

/*
describe('PayPro (in Wallet) model', function() {
  var config = {
    Network: FakeNetwork,
    Blockchain: FakeBlockchain,
    Storage: FakeStorage,
    wallet: {
      // requiredCopayers: 3,
      // totalCopayers: 5,
      requiredCopayers: 1,
      totalCopayers: 1,
      spendUnconfirmed: 1,
      reconnectDelay: 100,
    },
    blockchain: {
      host: 'test.insight.is',
      port: 80
    },
    networkName: 'testnet',
    passphrase: 'test',
    storageObj: new FakeStorage(),
    networkObj: new FakeNetwork(),
    blockchainObj: new FakeBlockchain(),
  };

  beforeEach(function() {
    config.storageObj.reset();
  });

  it('should start the example server', function(done) {
    startServer(function(err, s) {
      if (err) return done(err);
      server = s;
      server.uri = 'https://localhost:8080/-';
      done();
    });
  });

  it('should be able to create wallets', function(done) {
    var wf = new WalletFactory(config, '0.0.1');
    var w = wf.create();

    var unspentTest = [{
      'address': null,
      "scriptPubKey": null,
      "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
      "vout": 1,
      "amount": 10,
      "confirmations": 7

      , hashToScriptMap: {
        '2N6fdPg2QL7V36XKe7a8wkkA5HCy7fNYmZF': '5321027445ab3a935dce7aee1dadb0d103ed6147a0f83deb80474a04538b2c5bc4d5092102ab32ba51402a139873aeb919c738f5a945f3956f8f8c6ba296677bd29e85d7e821036f119b72e09f76c11ebe2cf754d64eac2cb42c9e623455d54aaa89d70c11f9c82103bcbd3f8ab2c849ea9eae434733cee8b75120d26233def56011b3682ca12081d72103f37f81dc534163b9f73ecf36b91e6c3fb8ae370c24618f91bb1d972e86ceeee255ae'
      }
    }];

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);

    if (0)
    var unspentTest = [{
      address: '2N6fdPg2QL7V36XKe7a8wkkA5HCy7fNYmZF',
      scriptPubKey: 'a91493372782bab70f4eefdefefea8ece0df44f9596887',
      txid: '2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1',
      vout: 1,
      amount: 10,
      confirmations: 7,
      scriptSig: ['00493046022100b8249a4fc326c4c33882e9d5468a1c6faa01e8c6cef0a24970122e804abdd860022100dbf6ee3b07d3aad8f73997e62ad20654a08aa63a7609792d02f3d5d088e69ad9014cad5321027445ab3a935dce7aee1dadb0d103ed6147a0f83deb80474a04538b2c5bc4d5092102ab32ba51402a139873aeb919c738f5a945f3956f8f8c6ba296677bd29e85d7e821036f119b72e09f76c11ebe2cf754d64eac2cb42c9e623455d54aaa89d70c11f9c82103bcbd3f8ab2c849ea9eae434733cee8b75120d26233def56011b3682ca12081d72103f37f81dc534163b9f73ecf36b91e6c3fb8ae370c24618f91bb1d972e86ceeee255ae'],
      hashToScriptMap: {
        '2N6fdPg2QL7V36XKe7a8wkkA5HCy7fNYmZF': '5321027445ab3a935dce7aee1dadb0d103ed6147a0f83deb80474a04538b2c5bc4d5092102ab32ba51402a139873aeb919c738f5a945f3956f8f8c6ba296677bd29e85d7e821036f119b72e09f76c11ebe2cf754d64eac2cb42c9e623455d54aaa89d70c11f9c82103bcbd3f8ab2c849ea9eae434733cee8b75120d26233def56011b3682ca12081d72103f37f81dc534163b9f73ecf36b91e6c3fb8ae370c24618f91bb1d972e86ceeee255ae'
      }
    }];

    // Addresses
    var addrs = [
      'mzTQ66VKcybz9BD1LAqEwMFp9NrBGS82sY',
      'mmu9k3KzsDMEm9JxmJmZaLhovAoRKW3zr4',
      'myqss64GNZuWuFyg5LTaoTCyWEpKH56Fgz'
    ];

    // Private keys in WIF format (see TransactionBuilder.js for other options)
    var keys = [
      'cVvr5YmWVAkVeZWAawd2djwXM4QvNuwMdCw1vFQZBM1SPFrtE8W8',
      'cPyx1hXbe3cGQcHZbW3GNSshCYZCriidQ7afR2EBsV6ReiYhSkNF'
      // 'cUB9quDzq1Bj7pocenmofzNQnb1wJNZ5V3cua6pWKzNL1eQtaDqQ'
    ];

    var unspent = [{
      // http://blockexplorer.com/testnet/rawtx/1fcfe898cc2612f8b222bd3b4ac8d68bf95d43df8367b71978c184dea35bde22
      'txid': '1fcfe898cc2612f8b222bd3b4ac8d68bf95d43df8367b71978c184dea35bde22',
      'vout': 1,
      'address': addrs[0],
      'scriptPubKey': '76a94c14cfbe41f4a518edc25af71bafc72fb61bfcfc4fcd88ac',
      'amount': 1.60000000,
      'confirmations': 9
    },

    {
      // http://blockexplorer.com/testnet/rawtx/0624c0c794447b0d2343ae3d20382983f41b915bb115a834419e679b2b13b804
      'txid': '0624c0c794447b0d2343ae3d20382983f41b915bb115a834419e679b2b13b804',
      'vout': 1,
      'address': addrs[1],
      'scriptPubKey': '76a94c14460376539c219c5e3274d86f16b40e806b37817688ac',
      'amount': 1.60000000,
      'confirmations': 9
    }
    ];


    should.exist(w);

    w.getUnspent = function(cb) {
      return setTimeout(function() {
        return cb(null, unspentTest, []);
      }, 1);
    };

    var address = server.uri + '/request';
    var commentText = 'Hello, server. I\'d like to make a payment.';
    w.createTx(address, commentText, function(ntxid, ca) {
      if (w.totalCopayers > 1) {
        should.exist(ntxid);
        console.log('Sent TX proposal to other copayers:');
        console.log([ntxid, ca]);
        server.close();
        done();
      } else {
        console.log('Sending TX to merchant server:');
        console.log(ntxid);
        w.sendTx(ntxid, function(txid, ca) {
          should.exist(txid);
          console.log('TX sent:');
          console.log([ntxid, ca]);
          server.close();
          done();
        });
      }
    });
  });
});
*/

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

  it('should start the example server', function(done) {
    startServer(function(err, s) {
      if (err) return done(err);
      server = s;
      server.uri = 'https://localhost:8080/-';
      done();
    });
  });

  it('#create a payment transaction', function() {
    var w = cachedCreateW2();
    var comment = 'This is a comment';

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);

    var ntxid = w.createTxSync(
      'mgGJEugdPnvhmRuFdbdQcFfoFLc1XXeB79',
      '123456789',
      comment,
      unspentTest
    );

    var t = w.txProposals;
    var txp = t.txps[ntxid];
    var tx = txp.builder.build();
    should.exist(tx);
    txp.comment.should.equal(comment);
  });

  it('should send a payment request', function(done) {
    var w = cachedCreateW2();
    should.exist(w);
    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);
    w.getUnspent = function(cb) {
      return setTimeout(function() {
        return cb(null, unspentTest, []);
      }, 1);
    };
    var address = server.uri + '/request';
    var commentText = 'Hello, server. I\'d like to make a payment.';
    w.createTx(address, commentText, function(ntxid, ca) {
      if (w.totalCopayers > 1) {
        should.exist(ntxid);
        console.log('Sent TX proposal to other copayers:');
        console.log([ntxid, ca]);
        server.close();
        done();
      } else {
        console.log('Sending TX to merchant server:');
        console.log(ntxid);
        w.sendTx(ntxid, function(txid, ca) {
          should.exist(txid);
          console.log('TX sent:');
          console.log([ntxid, ca]);
          server.close();
          done();
        });
      }
    });
  });
});
