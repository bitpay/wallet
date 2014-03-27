'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('../node_modules/bitcore');
var Address        = bitcore.Address;
var buffertools    = bitcore.buffertools;
var cosign         = cosign || {};
var fakeStorage    = require('./FakeStorage');
var Wallet         = cosign.Wallet || require('soop').load('../js/models/Wallet', {Storage: fakeStorage});

var aMasterPrivKey = 'tprv8ZgxMBicQKsPdSVTiWXEqCCzqRaRr9EAQdn5UVMpT9UHX67Dh1FmzEMbavPumpAicsUm2XvC6NTdcWB89yN5DUWx5HQ7z3KByUg7Ht74VRZ';


var config = {
  network:'livenet',
};

var createW = function (network, bytes) {

  var config = {
    network: network || 'livenet',
  };
  if (bytes) config.bytes = bytes;

  var w = new Wallet(config);
  should.exist(w);

  var cosigners = [];
  for(var i=0; i<4; i++) {
    delete config['bytes'];
    var c = new Wallet(config);
    w.haveAllRequiredPubKeys().should.equal(false);

    w.addCosignerExtendedPubKey(c.getMasterExtendedPubKey());
    cosigners.push(c);
  }
  return {w:w, cosigners: cosigners};
};

describe('Wallet model', function() {

  it('should create an instance (livenet)', function () {
    var w = new Wallet({
      network: config.network
    });
    should.exist(w);
    w.network.name.should.equal('livenet');
  });
  it('should create an instance (testnet)', function () {
    var w2 = new Wallet();
    should.exist(w2);
    w2.network.name.should.equal('testnet');
  });

  it('should throw  master priv key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);

    w2.getMasterExtendedPrivKey.bind().should.throw();
  });


  it('should create an master priv key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);
    should.exist(w2.getMasterExtendedPrivKey());
  });


  it('should create an master pub key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);
    should.exist(w2.getMasterExtendedPubKey());
  });

  it('should fail to generate shared pub keys wo extended key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);

    w2.registeredCosigners().should.equal(1); 
    w2.haveAllRequiredPubKeys().should.equal(false);

    w2.getAddress.bind(false).should.throw();
  });

  it('should add and check when adding shared pub keys', function () {
    var k = createW();
    var w = k.w;
    var cosigners = k.cosigners;

    w.haveAllRequiredPubKeys().should.equal(true);
    w.addCosignerExtendedPubKey.bind(w.getMasterExtendedPubKey()).should.throw();
    w.addCosignerExtendedPubKey.bind(cosigners[0].getMasterExtendedPubKey()).should.throw();
    w.addCosignerExtendedPubKey.bind((new Wallet(config)).getMasterExtendedPubKey()).should.throw();
  });

  it('show be able to store and retrieve', function () {
    var k = createW();
    var w = k.w;
    var cosigners = k.cosigners;

    w.store().should.equal(true);
    var ID = w.id;
    delete w['id'];
    w.store.bind().should.throw();

    var w2 = Wallet.read(ID);
    w2.haveAllRequiredPubKeys().should.equal(true);
    w2.addCosignerExtendedPubKey.bind(w.getMasterExtendedPubKey()).should.throw();
    w2.addCosignerExtendedPubKey.bind(cosigners[0].getMasterExtendedPubKey()).should.throw();
    w2.addCosignerExtendedPubKey.bind((new Wallet(config)).getMasterExtendedPubKey()).should.throw();
 
  });


  it('should create some p2sh addresses', function () {
    var k = createW();
    var w = k.w;

    for(var isChange=0; isChange<2; isChange++) {
      for(var i=0; i<5; i++) {
        var addr = w.createAddress(isChange);
        var a = new Address(addr);
        a.isValid().should.equal(true);
        a.isScript().should.equal(true);
        a.network().name.should.equal('livenet');
      }
    }
  });

  it('should return wallet addresses', function () {
    var k = createW();
    var w = k.w;


    var a = w.getAddresses();
    a.length.should.equal(0);

    for(var isChange=0; isChange<2; isChange++) 
      for(var i=0; i<6; i++) 
         w.createAddress(isChange);
 
    var as = w.getAddresses();
    as.length.should.equal(12);
    for(var i in as) {
      var a = new Address(as[i]);
      a.isValid().should.equal(true);
    }
  });


  it('should create a TX', function () {
    var k = createW('testnet', aMasterPrivKey);
    var w = k.w;
    var as=[], j=0;
    for(var isChange=0; isChange<2; isChange++) 
      for(var i=0; i<6; i++) 
         as[j++] = w.createAddress(isChange);

    var utxos = [
      {
        address: as[0],
        txid: "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
        scriptPubKey: "76a9146ce4e1163eb18939b1440c42844d5f0261c0338288ac",
        vout: 1,
        amount: 1,                
        confirmations: 3
      },
      {
        address: as[1],
        txid: "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
        scriptPubKey: "76a9146ce4e1163eb18939b1440c42844d5f0261c0338288ac",
        vout: 1,
        amount: 1.01,                
        confirmations: 7
      },
    ];      


    var outs=[{
      address: 'mfwSGKeLEGdd1YwsZ1TkoEeKNk8TTWqXLC',
      amount: 1.5,
    }];
    var ret = w.createTx(utxos, outs, '2Mu1GwdF9X1LLxXNxtfNChi5ngBMJxi2csv');
    var tx=ret.tx;
    should.exist(tx);
    tx.ins.length.should.equal(2);
    tx.outs.length.should.equal(2);
    buffertools.toHex(tx.serialize()).should.equal('0100000002c1cf12ab89729d19d3cdec8ae531b5038d56c741006a105d532b3a7afa65c12a0100000000ffffffffc1cf12ab89729d19d3cdec8ae531b5038d56c741006a105d532b3a7afa65c12a0100000000ffffffff0280d1f008000000001976a91404a154d56e5455dc87f15e293b8872f31d03a12c88acb00b0a030000000017a914134ce4e4ea92b6cb0008803cafe25f197ff1dcb98700000000');

  });

});


