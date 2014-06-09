'use strict';

var chai = chai || require('chai');
var should = chai.should();
var sinon = require('sinon');
var copay = copay || require('../copay');
var Wallet = require('../js/models/core/Wallet');
var Storage = require('./mocks/FakeStorage');
var Network = require('./mocks/FakeNetwork');
var Blockchain = require('./mocks/FakeBlockchain');

var addCopayers = function(w) {
  for (var i = 0; i < 4; i++) {
    w.publicKeyRing.addCopayer();
  }
};

describe('Wallet model', function() {

  var config = {
    requiredCopayers: 3,
    totalCopayers: 5,
    spendUnconfirmed: 1,
    reconnectDelay: 100,
    blockchain: {
      host: 'test.insight.is',
      port: 80
    },
    networkName: 'testnet',
  };

  it('should fail to create an instance', function() {
    (function() {
      new Wallet(config)
    }).should.
    throw ();
  });

  var createW = function(netKey) {
    var c = JSON.parse(JSON.stringify(config));

    if (netKey) c.netKey = netKey;
    c.privateKey = new copay.PrivateKey({
      networkName: c.networkName
    });

    c.publicKeyRing = new copay.PublicKeyRing({
      networkName: c.networkName,
      requiredCopayers: c.requiredCopayers,
      totalCopayers: c.totalCopayers,
    });
    var copayerEPK = c.privateKey.deriveBIP45Branch().extendedPublicKeyString()
    c.publicKeyRing.addCopayer(copayerEPK);

    c.txProposals = new copay.TxProposals({
      networkName: c.networkName,
    });
    c.storage = new Storage(config.storage);
    c.network = new Network(config.network);
    c.blockchain = new Blockchain(config.blockchain);

    c.networkName = config.networkName;
    c.verbose = config.verbose;
    c.version = '0.0.1';

    return new Wallet(c);
  }

  it('should create an instance', function() {
    var w = createW();
    should.exist(w);
    w.publicKeyRing.walletId.should.equal(w.id);
    w.txProposals.walletId.should.equal(w.id);
    w.requiredCopayers.should.equal(3);
    should.exist(w.id);
    should.exist(w.publicKeyRing);
    should.exist(w.privateKey);
    should.exist(w.txProposals);
    should.exist(w.netKey);
    var b = new Buffer(w.netKey, 'base64');
    b.toString('hex').length.should.equal(16);
  });

  it('should provide some basic features', function(done) {
    var opts = {};
    var w = createW();
    addCopayers(w);
    w.publicKeyRing.generateAddress(false);
    w.publicKeyRing.isComplete().should.equal(true);
    w.generateAddress(true).isValid().should.equal(true);
    w.generateAddress(true, function(addr) {
      addr.isValid().should.equal(true);
      done();
    });
  });

  var unspentTest = [{
    "address": "dummy",
    "scriptPubKey": "dummy",
    "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
    "vout": 1,
    "amount": 10,
    "confirmations": 7
  }];

  var createW2 = function(privateKeys) {
    var netKey = 'T0FbU2JLby0=';
    var w = createW(netKey);
    should.exist(w);

    var pkr = w.publicKeyRing;

    for (var i = 0; i < 4; i++) {
      if (privateKeys) {
        var k = privateKeys[i];
        pkr.addCopayer(k ? k.deriveBIP45Branch().extendedPublicKeyString() : null);
      } else {
        pkr.addCopayer();
      }
    }
    pkr.generateAddress(true);
    pkr.generateAddress(true);
    pkr.generateAddress(true);
    pkr.generateAddress(false);
    pkr.generateAddress(false);
    pkr.generateAddress(false);
    //3x3 indexes

    return w;
  };

  it('#create, 1 sign', function() {

    var w = createW2();

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true);

    var ntxid = w.createTxSync(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest
    );

    var t = w.txProposals;
    var txp = t.txps[ntxid];
    var tx = txp.builder.build();
    should.exist(tx);
    tx.isComplete().should.equal(false);
    Object.keys(txp.seenBy).length.should.equal(1);
    Object.keys(txp.signedBy).length.should.equal(1);
  });

  it('#addressIsOwn', function() {
    var w = createW2();
    var l = w.getAddressesStr();
    for (var i = 0; i < l.length; i++)
      w.addressIsOwn(l[i]).should.equal(true);

    w.addressIsOwn(l[0], {
      excludeMain: true
    }).should.equal(false);

    w.addressIsOwn('mmHqhvTVbxgJTnePa7cfweSRjBCy9bQQXJ').should.equal(false);
    w.addressIsOwn('mgtUfP9sTJ6vPLoBxZLPEccGpcjNVryaCX').should.equal(false);
  });

  it('#create. Signing with derivate keys', function() {

    var w = createW2();

    var ts = Date.now();
    for (var isChange = 0; isChange < 2; isChange++) {
      for (var index = 0; index < 3; index++) {
        unspentTest[0].address = w.publicKeyRing.getAddress(index, isChange).toString();
        unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
        w.createTxSync(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
          '123456789',
          unspentTest
        );
        var t = w.txProposals;
        var k = Object.keys(t.txps)[0];
        var tx = t.txps[k].builder.build();
        should.exist(tx);
        tx.isComplete().should.equal(false);
        tx.countInputMissingSignatures(0).should.equal(2);

        (t.txps[k].signedBy[w.privateKey.getId()] - ts > 0).should.equal(true);
        (t.txps[k].seenBy[w.privateKey.getId()] - ts > 0).should.equal(true);
      }
    }
  });

  it('#fromObj #toObj round trip', function() {

    var w = createW2();

    var o = w.toObj();
    o = JSON.parse(JSON.stringify(o));

    var w2 = Wallet.fromObj(o,
      new Storage(config.storage),
      new Network(config.network),
      new Blockchain(config.blockchain));
    should.exist(w2);
    w2.publicKeyRing.requiredCopayers.should.equal(w.publicKeyRing.requiredCopayers);
    should.exist(w2.publicKeyRing.getCopayerId);
    should.exist(w2.txProposals.toObj);
    should.exist(w2.privateKey.toObj);
  });

  it('#getSecret decodeSecret', function() {
    var w = createW2();
    var id = w.getMyCopayerId();
    var nk = w.netKey;

    var sb = w.getSecret();
    should.exist(sb);
    var s = Wallet.decodeSecret(sb);
    s.pubKey.should.equal(id);
    s.netKey.should.equal(nk);

  });
  it('decodeSecret check', function() {
    (function() {
      Wallet.decodeSecret('4fp61K187CsYmjoRQC5iAdC5eGmbCRsAAXfwEwetSQgHvZs27eWKaLaNHRoKM');
    }).should.not.
    throw ();
    (function() {
      Wallet.decodeSecret('4fp61K187CsYmjoRQC5iAdC5eGmbCRsAAXfwEwetSQgHvZs27eWKaLaNHRoK');
    }).should.
    throw ();
    (function() {
      Wallet.decodeSecret('12345');
    }).should.
    throw ();
  });

  it('call reconnect after interval', function(done) {
    var w = createW2();
    var testTime = 1000;
    var callCount = 0;
    var cT=w.reconnectDelay;
    var t=0;

    do {
      callCount++;
      t += cT;
      cT *= 2;
    } while (t<testTime);

    var spy = sinon.spy(w, 'scheduleConnect');
    w.netStart();
    setTimeout(function() {
      sinon.assert.callCount(spy, callCount);
      done();
    }, testTime);
  });

  it('handle network indexes correctly', function() {
    var w = createW();
    var aiObj = {
      walletId: w.id,
      changeIndex: 3,
      receiveIndex: 2
    };
    w._handleIndexes('senderID', aiObj, true);
    w.publicKeyRing.indexes.getReceiveIndex(2);
    w.publicKeyRing.indexes.getChangeIndex(3);
  });

  it('handle network pubKeyRings correctly', function() {
    var w = createW();
    var cepk = [
      w.publicKeyRing.toObj().copayersExtPubKeys[0],
      'xpub68cA58zTvAve3wDNS7UkY3zaS45iAsqtg6Syxcf4jDR7JtsX4EarofaRHCHqJZJbfyDS1dxuinMTBNiJ6Rx4YEtAvo8StqGGCNa1AV9Zeh9',
      'xpub695Ak6GSoEtCQJbwpw17sEPSNqecs15m6FAu7kFk12MCpWyCeMCQ8RmUcCwyfP1KhENZidA6s8nhBWaT1x5n9L8KZshLUscckwbZhSNQtYq',
    ];
    var pkrObj = {
      walletId: w.id,
      networkName: w.networkName,
      requiredCopayers: w.requiredCopayers,
      totalCopayers: w.totalCopayers,
      indexes: {
        walletId: undefined,
        changeIndex: 2,
        receiveIndex: 3
      },
      copayersExtPubKeys: cepk,
      nicknameFor: {},
    };
    w._handlePublicKeyRing('senderID', {
      publicKeyRing: pkrObj
    }, true);
    w.publicKeyRing.indexes.getReceiveIndex(2);
    w.publicKeyRing.indexes.getChangeIndex(3);
    for (var i = 0; i < w.requiredCopayers; i++) {
      w.publicKeyRing.toObj().copayersExtPubKeys[i].should.equal(cepk[i]);
    }
  });

  var newId = '00bacacafe';
  it('handle new connections', function(done) {
    var w = createW();
    w.on('connect', function(id) {
      id.should.equal(newId);
      done();
    });
    w._handleConnect(newId);
  });

  it('handle disconnections', function(done) {
    var w = createW();
    w.on('disconnect', function(id) {
      id.should.equal(newId);
      done();
    });
    w._handleDisconnect(newId);
  });

  it('should register new copayers correctly', function() {
    var w = createW();
    var r = w.getRegisteredCopayerIds();
    r.length.should.equal(1);
    w.publicKeyRing.addCopayer();
    r = w.getRegisteredCopayerIds();
    r.length.should.equal(2);
    r[0].should.not.equal(r[1]);
  });

  it('should register new peers correctly', function() {
    var w = createW();
    var r = w.getRegisteredPeerIds();
    r.length.should.equal(1);
    w.publicKeyRing.addCopayer();
    r = w.getRegisteredPeerIds();
    r.length.should.equal(2);
    r[0].should.not.equal(r[1]);
  });
  it('should get balance', function(done) {
    var w = createW();
    w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
      balance.should.equal(0);
      done();
    });
  });
  it('should create transaction', function(done) {
    var w = createW2();
    w.blockchain.fixUnspent([{
      'address': w.generateAddress(),
      'txid': '0be0fb4579911be829e3077202e1ab47fcc12cf3ab8f8487ccceae768e1f95fa',
      'vout': 0,
      'ts': 1402323949,
      'scriptPubKey': '21032ca453c1d9a93b7de8cf3d44d7bb8d52a45dbdf8fff63f69de4e51b740bb1da3ac',
      'amount': 25.0001,
      'confirmations': 10,
      'confirmationsFromCache': false
    }]);
    var toAddress = 'mjfAe7YrzFujFf8ub5aUrCaN5GfSABdqjh';
    var amountSatStr = '1000';
    w.createTx(toAddress, amountSatStr, function(ntxid) {
      ntxid.length.should.equal(64);
      done();
    });

  });
  it('#getNetworkName', function() {
    var w = createW();
    w.getNetworkName().should.equal('testnet');
  });
 
});
