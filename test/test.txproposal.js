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

var createW = function (bip32s) {
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

  it('#create', function () {
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createW(),
    });
    should.exist(w);
    w.network.name.should.equal('livenet');

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true);
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getRedeemScript(1, true).getBuffer();

    var tx = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest
    );
    should.exist(tx);
    tx.isComplete().should.equal(false);
  });

  it('#create. Signing with derivate keys', function () {

    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createW([priv.getBIP32()]),
    });

    var ts = Date.now();
    for (var isChange=0; isChange<2; isChange++) {
      for (var index=0; index<3; index++) {
        unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange);
        unspentTest[0].scriptPubKey   = w.publicKeyRing.getRedeemScript(index, isChange).getBuffer();
        var tx = w.create(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
          bignum('123456789'), 
          unspentTest,
          priv
        );
        should.exist(tx);
        tx.isComplete().should.equal(false);
        tx.countInputMissingSignatures(0).should.equal(2);
        (w.txs[0].signedBy[priv.id] - ts > 0).should.equal(true);
        (w.txs[0].seenBy[priv.id] - ts > 0).should.equal(true);
      }
    }
  });
  it('#toObj #fromObj roundtrip', function () {

    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createW([priv.getBIP32()]),
    });
    var ts = Date.now();
    var isChange=0; 
    var index=0; 

    unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange);
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getRedeemScript(index, isChange).getBuffer();
    var tx = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest,
      priv
    );
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txs[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txs[0].seenBy[priv.id] - ts > 0).should.equal(true);

    var o = w.toObj();
    should.exist(o);
    o.txs.length.should.equal(1);
    should.exist(o.txs[0].txHex);
    should.exist(o.txs[0].signedBy);
    should.exist(o.txs[0].seenBy);
    should.exist(o.txs[0].signedBy[priv.id]);

    var w2 = TxProposals.fromObj(o);
    var tx2 = w2.txs[0].tx;
    tx2.isComplete().should.equal(false);
    tx2.countInputMissingSignatures(0).should.equal(2);
    (w2.txs[0].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txs[0].seenBy[priv.id] - ts > 0).should.equal(true);
  });
});
 
