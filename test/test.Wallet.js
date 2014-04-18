'use strict';

var chai = chai || require('chai');
var should = chai.should();
var copay = copay || require('../copay');
var Wallet = require('../js/models/core/Wallet');
var Storage= require('./mocks/FakeStorage');
var Network= copay.WebRTC;
var Blockchain= copay.Insight;

var addCopayers = function (w) {
  for(var i=0; i<4; i++) {
    w.publicKeyRing.addCopayer();
  }
};

describe('Wallet model', function() {

  var config = {
    requiredCopayers: 3,
    totalCopayers: 5,
    spendUnconfirmed: 1,
    blockchain: {
      host: 'test.insight.is',
      port: 80
    },
    networkName: 'testnet',
  };

  it('should fail to create an instance', function () {
    (function(){new Wallet(config)}).should.throw();
  });

  var createW = function () {
    var c = JSON.parse(JSON.stringify(config));

    c.privateKey = new copay.PrivateKey({ networkName: c.networkName });

    c.publicKeyRing = new copay.PublicKeyRing({
      networkName: c.networkName,
      requiredCopayers: c.requiredCopayers,
      totalCopayers: c.totalCopayers,
    });
    c.publicKeyRing.addCopayer(c.privateKey.getExtendedPublicKeyString());

    c.txProposals = new copay.TxProposals({
      networkName: c.networkName,
    });
    c.storage     = new Storage(config.storage);
    c.network     = new Network(config.network);
    c.blockchain  = new Blockchain(config.blockchain);

    c.networkName = config.networkName;
    c.verbose     = config.verbose;

    return new Wallet(c);
  }

  it('should create an instance', function () {
    var w = createW();
    should.exist(w);
    w.publicKeyRing.walletId.should.equal(w.id);
    w.txProposals.walletId.should.equal(w.id);
    w.requiredCopayers.should.equal(3);
    should.exist(w.id);
    should.exist(w.publicKeyRing);
    should.exist(w.privateKey);
    should.exist(w.txProposals);
  });

  it('should provide some basic features', function () {
    var opts = {};
    var w = createW();
    addCopayers(w);
    w.publicKeyRing.generateAddress(false);
    w.publicKeyRing.isComplete().should.equal(true);
  });

  var unspentTest = [
    {
    "address": "dummy",
    "scriptPubKey": "dummy",
    "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
    "vout": 1,
    "amount": 10,
    "confirmations":7
  }
  ];

  var createW2 = function (privateKeys) {
    var w = createW();
    should.exist(w);

    var pkr =  w.publicKeyRing;

    for(var i=0; i<4; i++) {
      if (privateKeys) {
        var k=privateKeys[i];
        pkr.addCopayer(k?k.getExtendedPublicKeyString():null);
      }
      else 
        pkr.addCopayer();
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

  it('#create, 1 sign', function () {

    var w = createW2();

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(1, true);

    w.createTxSync(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest
    );

    var t = w.txProposals;
    var tx = t.txps[0].builder.build();
    should.exist(tx);
    tx.isComplete().should.equal(false);
    Object.keys(t.txps[0].signedBy).length.should.equal(1);
    Object.keys(t.txps[0].seenBy).length.should.equal(1);
  });

  it('#addressIsOwn', function () {
    var w = createW2();
    var l = w.getAddressesStr();
    for (var i=0; i<l.length; i++)
      w.addressIsOwn(l[i]).should.equal(true);
    w.addressIsOwn('mmHqhvTVbxgJTnePa7cfweSRjBCy9bQQXJ').should.equal(false);
    w.addressIsOwn('mgtUfP9sTJ6vPLoBxZLPEccGpcjNVryaCX').should.equal(false);
  });

  it('#create. Signing with derivate keys', function () {

    var w = createW2();

    var ts = Date.now();
    for (var isChange=0; isChange<2; isChange++) {
      for (var index=0; index<3; index++) {
        unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
        unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
        w.createTxSync(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
          '123456789', 
          unspentTest
        );
        var t = w.txProposals;
        var tx = t.txps[0].builder.build();
        should.exist(tx);
        tx.isComplete().should.equal(false);
        tx.countInputMissingSignatures(0).should.equal(2);

        ( t.txps[0].signedBy[w.privateKey.id] - ts > 0).should.equal(true);
        ( t.txps[0].seenBy[w.privateKey.id] - ts > 0).should.equal(true);
      }
    }
  });

});
