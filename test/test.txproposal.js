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
      w.addCopayer(b?b.extendedPrivateKeyString():null);
    }
    else 
      w.addCopayer();
  }
  w.generateAddress(true);
  w.generateAddress(true);
  w.generateAddress(true);
  w.generateAddress(false);
  w.generateAddress(false);
  
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

    var txHex = w.create(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      bignum('123456789'), 
      unspentTest
    );
    should.exist(txHex);

    var t2=new Transaction();
    t2.parse(txHex);
    t2.isComplete().should.equal(false);
  });

  it('#create. Singing with derivate keys', function () {

    var oneBIP32 = new BIP32(config.networkName);

    var w = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: createW([oneBIP32]),
    });
    should.exist(w);
    w.network.name.should.equal('livenet');


    for (var isChange=0; isChange<2; isChange++) {
      for (var index=0; index<3; index++) {
        unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange);
        unspentTest[0].scriptPubKey   = w.publicKeyRing.getRedeemScript(index, isChange).getBuffer();

        var derivedBip32 = oneBIP32.derive( isChange ? PublicKeyRing.ChangeBranch(index):PublicKeyRing.PublicBranch(index) );
        var wk = new WalletKey({network: networks.livenet});
        var p = derivedBip32.eckey.private.toString('hex');
        wk.fromObj({priv: p});

        var txHex = w.create(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
          bignum('123456789'), 
          unspentTest,
          wk
        );
        should.exist(txHex);
        var t2=new Transaction();
        t2.parse(txHex);
        t2.isComplete().should.equal(false);
        t2.countInputMissingSignatures(0).should.equal(2);
      }
    }

  });
});
 
