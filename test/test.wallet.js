'use strict';

var chai = chai || require('chai');
var should  = chai.should();
var bitcore = bitcore || require('../node_modules/bitcore');

var cosign = cosign || {};

var fakeStorage = require('./FakeStorage');
var Wallet = cosign.Wallet || require('soop').load('../js/models/Wallet', {Storage: fakeStorage});
 

var config = {
  network:'livenet',
};

var createW = function () {
  var w = new Wallet(config);
  should.exist(w);

  var cosigners = [];
  for(var i=0; i<4; i++) {
    var c = new Wallet(config);
    w.haveAllNeededPubKeys().should.equal(false);

    w.addCosignerExtendedPubKey(c.getExtendedPubKey());
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

    w2.getExtendedPrivKey.bind().should.throw();
  });


  it('should create an master priv key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);
    should.exist(w2.getExtendedPrivKey());
  });


  it('should create an master pub key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);
    should.exist(w2.getExtendedPubKey());
  });

  it('should fail to generate shared pub keys wo extended key', function () {
    var w2 = new Wallet(config);
    should.exist(w2);

    w2.registeredCosigners().should.equal(1); 
    w2.haveAllNeededPubKeys().should.equal(false);

    w2.getChangeAddress.bind(0).should.throw();
  });

  it('should add and check when adding shared pub keys', function () {
    var k = createW();
    var w = k.w;
    var cosigners = k.cosigners;

    w.haveAllNeededPubKeys().should.equal(true);
    w.addCosignerExtendedPubKey.bind(w.getExtendedPubKey()).should.throw();
    w.addCosignerExtendedPubKey.bind(cosigners[0].getExtendedPubKey()).should.throw();
    w.addCosignerExtendedPubKey.bind((new Wallet(config)).getExtendedPubKey()).should.throw();
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
    w2.haveAllNeededPubKeys().should.equal(true);
    w2.addCosignerExtendedPubKey.bind(w.getExtendedPubKey()).should.throw();
    w2.addCosignerExtendedPubKey.bind(cosigners[0].getExtendedPubKey()).should.throw();
    w2.addCosignerExtendedPubKey.bind((new Wallet(config)).getExtendedPubKey()).should.throw();
 
  });

});


