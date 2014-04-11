'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var Transaction        = bitcore.Transaction;
var buffertools    = bitcore.buffertools;
var WalletKey    = bitcore.WalletKey;
var Key    = bitcore.Key;
var BIP32    = bitcore.BIP32;
var bignum         = bitcore.bignum;
var Script         = bitcore.Script;
var util         = bitcore.util;
var networks         = bitcore.networks;
var copay          = copay || require('../copay');
var fakeStorage    = copay.FakeStorage;
var PrivateKey    = copay.PrivateKey || require('../js/models/PrivateKey');
var TxProposals    = copay.TxProposals || require('../js/models/TxProposal');
var PublicKeyRing  = (typeof process.versions === 'undefined') ? copay.PublicKeyRing :
  require('soop').load('../js/models/PublicKeyRing', {Storage: fakeStorage});

var config = {
  networkName:'livenet',
};

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

var createPKR = function (bip32s) {
  var w = new PublicKeyRing(config);
  should.exist(w);

  for(var i=0; i<5; i++) {
    if (bip32s) {
      var b=bip32s[i];
      w.addCopayer(b?b.extendedPublicKeyString():null);
    }
    else 
      w.addCopayer();
  }
   w.generateAddress(true);
   w.generateAddress(true);
   w.generateAddress(true);
   w.generateAddress(false);
   w.generateAddress(false);
   w.generateAddress(false);
   //3x3 indexes
  
  return w;
};


describe('TxProposals model', function() {

  it('should create an instance', function () {
    var w = new TxProposals({
      networkName: config.networkName
    });
    should.exist(w);
    w.network.name.should.equal('livenet');
  });

  it('#create, no signing', function () {
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createPKR(),
    });
    should.exist(w);
    w.network.name.should.equal('livenet');

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(1, true);

    var tx = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest
    );
    should.exist(tx);
    tx.isComplete().should.equal(false);
    Object.keys(w.txps[0].signedBy).length.should.equal(0);
    Object.keys(w.txps[0].seenBy).length.should.equal(0);
  });


  it('#create, signing with wrong key', function () {
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createPKR(),
    });
    should.exist(w);
    w.network.name.should.equal('livenet');

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(1, true);

    var priv = new PrivateKey(config);
    var tx = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv
    );
    should.exist(tx);
    tx.isComplete().should.equal(false);
    Object.keys(w.txps[0].signedBy).length.should.equal(0);
    Object.keys(w.txps[0].seenBy).length.should.equal(1);
  });


  it('#create. Signing with derivate keys', function () {

    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createPKR([priv.getBIP32()]),
    });

    var ts = Date.now();
    for (var isChange=0; isChange<2; isChange++) {
      for (var index=0; index<3; index++) {
        unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
        unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
        var tx = w.create(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
          bignum('123456789'), 
          unspentTest,
          priv
        );
        should.exist(tx);
        tx.isComplete().should.equal(false);

        tx.countInputMissingSignatures(0).should.equal(2);

        (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
        (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);
      }
    }
  });

  it('#merge with self', function () {

    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createPKR([priv.getBIP32()]),
    });
    var ts = Date.now();
    var isChange=0; 
    var index=0; 

    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    var tx = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv
    );

    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);

    w.merge(w);
    w.txps.length.should.equal(1);

    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);
 
  });



  it('#merge, merge signatures case 1', function () {

    var priv2 = new PrivateKey(config);
    var priv = new PrivateKey(config);
    var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv.getBIP32()]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};


    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv2,
      opts
    );

    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(1);

    Object.keys(w.txps[0].signedBy).length.should.equal(0);
    Object.keys(w.txps[0].seenBy).length.should.equal(1);


    var w2 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: w.publicKeyRing,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w2.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv,
      opts
    );

    w2.txps[0].tx.isComplete().should.equal(false);
    w2.txps[0].tx.countInputMissingSignatures(0).should.equal(2);

    (w2.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);

    w.merge(w2);
    w.txps.length.should.equal(1);

    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);
 
  });

var _dumpChunks = function (scriptSig, label) {
   console.log('## DUMP: ' + label + ' ##');
   for(var i=0; i<scriptSig.chunks.length; i++) {
     console.log('\tCHUNK ', i, scriptSig.chunks[i]); 
   }
};


  it('#merge, merge signatures case 2', function () {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
   var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv.getBIP32(), priv2.getBIP32()]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};

    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv3,
      opts
    );

    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(1);

    Object.keys(w.txps[0].signedBy).length.should.equal(0);
    Object.keys(w.txps[0].seenBy).length.should.equal(1);


    var w2 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w2.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv,
      opts
    );
    w2.txps[0].tx.isComplete().should.equal(false);
    w2.txps[0].tx.countInputMissingSignatures(0).should.equal(2);

    (w2.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);

    w.merge(w2);
    w.txps.length.should.equal(1);
    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);


    var w3 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w3.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv2,
      opts
    );
    w3.txps[0].tx.isComplete().should.equal(false);
    w3.txps[0].tx.countInputMissingSignatures(0).should.equal(2);

    (w3.txps[0].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w3.txps[0].seenBy[priv2.id] - ts > 0).should.equal(true);

    w.merge(w3);
    w.txps.length.should.equal(1);

    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv2.id] - ts > 0).should.equal(true);

    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(1);
  });


  it('#merge, merge signatures case 3', function () {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
   var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv.getBIP32(), priv2.getBIP32(),  priv3.getBIP32() ]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};

    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv,
      opts
    );
    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);


    var w2 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w2.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv2,
      opts
    );
    w2.txps[0].tx.isComplete().should.equal(false);
    w2.txps[0].tx.countInputMissingSignatures(0).should.equal(2);
    (w2.txps[0].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w2.txps[0].seenBy[priv2.id] - ts > 0).should.equal(true);


    var w3 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    w3.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv3,
      opts
    );
    w3.txps[0].tx.isComplete().should.equal(false);
    w3.txps[0].tx.countInputMissingSignatures(0).should.equal(2);
    (w3.txps[0].signedBy[priv3.id] - ts > 0).should.equal(true);
    (w3.txps[0].seenBy[priv3.id] - ts > 0).should.equal(true);

    w.merge(w2);
    w.txps[0].tx.isComplete().should.equal(false);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(1);


    w.merge(w3);
    w.txps[0].tx.isComplete().should.equal(true);
    w.txps[0].tx.countInputMissingSignatures(0).should.equal(0);
  });



  it('#toObj #fromObj roundtrip', function () {

    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createPKR([priv.getBIP32()]),
    });
    var ts = Date.now();
    var isChange=0; 
    var index=0; 

    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
    var tx = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv
    );
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);

    var o = w.toObj();
    should.exist(o);
    o.txps.length.should.equal(1);
    should.exist(o.txps[0].txHex);
    should.exist(o.txps[0].signedBy);
    should.exist(o.txps[0].seenBy);
    should.exist(o.txps[0].signedBy[priv.id]);

    var w2 = TxProposals.fromObj(o);
    var tx2 = w2.txps[0].tx;
    tx2.isComplete().should.equal(false);
    tx2.countInputMissingSignatures(0).should.equal(2);
    (w2.txps[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[0].seenBy[priv.id] - ts > 0).should.equal(true);
  });

});
 
