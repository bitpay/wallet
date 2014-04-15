'use strict';

var chai = chai || require('chai');
var should = chai.should();
var copay = copay || require('../copay');
var Wallet = require('soop').load('../js/models/core/Wallet', {
  Storage: require('./FakeStorage'),
  Network: copay.WebRTC,
  Blockchain: copay.Insight
});


var addCopayers = function (w) {
  for(var i=0; i<4; i++) {
    w.publicKeyRing.addCopayer();
  }
};

describe('Wallet model', function() {
  var config = {
    wallet: {
      requiredCopayers: 3,
      totalCopayers: 5,
    },
    blockchain: {
      host: 'test.insight.is',
      port: 80
    },
  };
  var opts = {};


  it('should create an instance', function () {
    var opts = {};
    var w = new Wallet(config);
    should.exist(w);
  });


  it('should fail to load', function () {
    var opts = {};
    var w = new Wallet(config);
    w.load(123);
    should.not.exist(w.id);
  });


  it('should create', function () {
    var opts = {};
    var w = new Wallet(config);
    w.create();
    should.exist(w.id);
    should.exist(w.publicKeyRing);
    should.exist(w.privateKey);
    should.exist(w.txProposals);
  });

  it('should list unspent', function (done) {
    var opts = {};
    var w = new Wallet(config);
    w.create();
    addCopayers(w);
    w.publicKeyRing.generateAddress(false);

    should.exist(w.id);
    w.publicKeyRing.isComplete().should.equal(true);

    w.listUnspent(function(utxos) {
      utxos.length.should.equal(0);
      done();
    });
  });

  describe('factory', function() {
    it('should create the factory', function() {
      should.exist(Wallet.factory);
    });
    it('should be able to create wallets', function() {
      var w = Wallet.factory.create(config, opts);
      should.exist(w);
    });
    it.skip('should be able to get wallets', function() {
      var w = Wallet.factory.create(config, opts);
      var v = Wallet.factory.get(config, w.id);
      should.exist(w);
    });
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

  var createWallet = function (bip32s) {
    var w = new Wallet(config);
    w.create();
    should.exist(w);

    var pkr =  w.publicKeyRing;

    for(var i=0; i<4; i++) {
      if (bip32s) {
        var b=bip32s[i];
        pkr.addCopayer(b?b.extendedPublicKeyString():null);
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

    var w = createWallet();

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(1, true);

    w.createTx(
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



  it('#create. Signing with derivate keys', function () {

    var w = createWallet();

    var ts = Date.now();
    for (var isChange=0; isChange<2; isChange++) {
      for (var index=0; index<3; index++) {
        unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
        unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
        w.createTx(
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

  // TODO: when sign is implemented
  it.skip('#create, signing with wrong key', function () {
    var w1 = createWallet();

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(1, true);

    var priv = new PrivateKey(config);
    w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest
    );
    var tx = w.txps[0].builder.build();
    should.exist(tx);
    tx.isComplete().should.equal(false);
    Object.keys(w.txps[0].signedBy).length.should.equal(0);
    Object.keys(w.txps[0].seenBy).length.should.equal(1);
  });


});
