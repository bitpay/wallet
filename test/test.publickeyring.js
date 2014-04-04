'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('../node_modules/bitcore');
var Address        = bitcore.Address;
var buffertools    = bitcore.buffertools;
var copay          = copay || {};
var fakeStorage    = require('./FakeStorage');
var PublicKeyRing  = copay.PublicKeyRing || require('soop').load('../js/models/PublicKeyRing', {Storage: fakeStorage});

var aMasterPubKey = 'tprv8ZgxMBicQKsPdSVTiWXEqCCzqRaRr9EAQdn5UVMpT9UHX67Dh1FmzEMbavPumpAicsUm2XvC6NTdcWB89yN5DUWx5HQ7z3KByUg7Ht74VRZ';


var config = {
  network:'livenet',
};

var createW = function (network) {

  var config = {
    network: network || 'livenet',
  };

  var w = new PublicKeyRing(config);
  should.exist(w);

  var copayers = [];
  for(var i=0; i<5; i++) {
    w.haveAllRequiredPubKeys().should.equal(false);
    var newEpk = w.addCopayer();
    copayers.push(newEpk);
  }
  
  return {w:w, copayers: copayers};
};

describe('PublicKeyRing model', function() {

  it('should create an instance (livenet)', function () {
    var w = new PublicKeyRing({
      network: config.network
    });
    should.exist(w);
    w.network.name.should.equal('livenet');
  });
  it('should create an instance (testnet)', function () {
    var w2 = new PublicKeyRing();
    should.exist(w2);
    w2.network.name.should.equal('testnet');
  });

  it('should fail to generate shared pub keys wo extended key', function () {
    var w2 = new PublicKeyRing(config);
    should.exist(w2);

    w2.registeredCopayers().should.equal(0); 
    w2.haveAllRequiredPubKeys().should.equal(false);

    w2.getAddress.bind(false).should.throw();
  });

  it('should add and check when adding shared pub keys', function () {
    var k = createW();
    var w = k.w;
    var copayers = k.copayers;

    w.haveAllRequiredPubKeys().should.equal(true);
    w.addCopayer.bind().should.throw();
    for(var i =0; i<5; i++) 
      w.addCopayer.bind(copayers[i]).should.throw();
  });

  it('show be able to store and retrieve', function () {
    var k = createW();
    var w = k.w;
    var copayers = k.copayers;

    w.store().should.equal(true);
    var ID = w.id;
    delete w['id'];
    w.store.bind().should.throw();

    var w2 = PublicKeyRing.read(ID);
    w2.haveAllRequiredPubKeys().should.equal(true);
    w2.addCopayer.bind().should.throw();
    for(var i =0; i<5; i++) 
      w2.addCopayer.bind(copayers[i]).should.throw();
 
  });


  it('should generate some p2sh addresses', function () {
    var k = createW();
    var w = k.w;

    for(var isChange=0; isChange<2; isChange++) {
      for(var i=0; i<5; i++) {
        var addr = w.generateAddress(isChange);
        var a = new Address(addr);
        a.isValid().should.equal(true);
        a.isScript().should.equal(true);
        a.network().name.should.equal('livenet');

        if (i>1) {
          w.getAddress(i-1,isChange).should
            .not.equal(w.getAddress(i-2,isChange));
        }
      }
    }
  });

  it('should return PublicKeyRing addresses', function () {
    var k = createW();
    var w = k.w;


    var a = w.getAddresses();
    a.length.should.equal(0);

    for(var isChange=0; isChange<2; isChange++) 
      for(var i=0; i<6; i++) 
         w.generateAddress(isChange);
 
    var as = w.getAddresses();
    as.length.should.equal(12);
    for(var i in as) {
      var a = new Address(as[i]);
      a.isValid().should.equal(true);
    }
  });

});


