'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var Address        = bitcore.Address;
var buffertools    = bitcore.buffertools;
var copay          = copay || require('../copay');
var fakeStorage    = copay.FakeStorage;
var PublicKeyRing  = copay.PublicKeyRing || require('soop').load('../js/models/PublicKeyRing', {Storage: fakeStorage});

var aMasterPubKey = 'tprv8ZgxMBicQKsPdSVTiWXEqCCzqRaRr9EAQdn5UVMpT9UHX67Dh1FmzEMbavPumpAicsUm2XvC6NTdcWB89yN5DUWx5HQ7z3KByUg7Ht74VRZ';


var config = {
  networkName:'livenet',
};

var createW = function (networkName) {

  var config = {
    networkName: networkName || 'livenet',
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
      networkName: config.networkName
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
    for(var i=0; i<3; i++)
      w.generateAddress(true);
    for(var i=0; i<5; i++)
      w.generateAddress(false);

    w.store().should.equal(true);
    var ID = w.id;
    delete w['id'];
    w.store.bind().should.throw();

    var w2 = PublicKeyRing.read(ID);
    w2.haveAllRequiredPubKeys().should.equal(true);
    w2.addCopayer.bind().should.throw();
    for(var i =0; i<5; i++) 
      w2.addCopayer.bind(copayers[i]).should.throw();

    w2.changeAddressIndex.should.equal(3);   
    w2.addressIndex.should.equal(5); 
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
    for(var j in as) {
      var a = new Address(as[j]);
      a.isValid().should.equal(true);
    }
  });

  it('should count generation indexes', function () {
    var k = createW();
    var w = k.w;

    for(var i=0; i<3; i++)
      w.generateAddress(true);
    for(var i=0; i<5; i++)
      w.generateAddress(false);

    w.changeAddressIndex.should.equal(3);   
    w.addressIndex.should.equal(5); 
  });

  it('#merge index tests', function () {
    var k = createW();
    var w = k.w;

    for(var i=0; i<2; i++)
      w.generateAddress(true);
    for(var i=0; i<3; i++)
      w.generateAddress(false);

    var w2 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
    });
    w2.merge(w.toObj()).should.equal(true);
    w2.requiredCopayers.should.equal(3);   
    w2.totalCopayers.should.equal(5);   
    w2.changeAddressIndex.should.equal(2);   
    w2.addressIndex.should.equal(3); 

    //
    w2.merge(w.toObj()).should.equal(false);
  });


  it('#merge check tests', function () {
    var k = createW();
    var w = k.w;

    for(var i=0; i<2; i++)
      w.generateAddress(true);
    for(var i=0; i<3; i++)
      w.generateAddress(false);



    var w2 = new PublicKeyRing({
      networkName: 'livenet',
    });
    (function() { w2.merge(w.toObj());}).should.throw();
    (function() { w2.merge(w,true);}).should.throw();

console.log('[test.publickeyring.js.190]'); //TODO
    w2.merge(w.toObj(),true).should.equal(true);

console.log('[test.publickeyring.js.193]'); //TODO


    var w3 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
      requiredCopayers: 2,
    });
    (function() { w3.merge(w.toObj());}).should.throw();

    var w4 = new PublicKeyRing({
      networkName: 'testnet',
      id: w.id,
    });
    (function() { w4.merge(w.toObj());}).should.throw();

    var w5 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
      totalCopayers: 4, 
    });
    (function() { w5.merge(w.toObj());}).should.throw();

    var w6 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
    });
    (function() { w6.merge(w);}).should.throw();
    w.networkName= 'livenet';
    (function() { w6.merge(w);}).should.throw();


  });


  it('#merge pubkey tests', function () {
    var w = new PublicKeyRing(config);
    should.exist(w);
    var copayers = [];
    for(var i=0; i<2; i++) {
      w.haveAllRequiredPubKeys().should.equal(false);
      w.addCopayer();
    }

    var w2 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
    });
    should.exist(w);
    var copayers = [];
    for(var i=0; i<3; i++) {
      w2.haveAllRequiredPubKeys().should.equal(false);
      w2.addCopayer();
    }
    w2.merge(w.toObj()).should.equal(true);
    w2.haveAllRequiredPubKeys().should.equal(true);
    w2.merge(w.toObj()).should.equal(false);

    w.haveAllRequiredPubKeys().should.equal(false);
    w.merge(w2.toObj()).should.equal(true);
    w.haveAllRequiredPubKeys().should.equal(true);
    w.merge(w2.toObj()).should.equal(false);
  });

  it('#merge pubkey tests (case 2)', function () {
    var w = new PublicKeyRing(config);
    should.exist(w);

    for(var i=0; i<5; i++) {
      w.haveAllRequiredPubKeys().should.equal(false);
      var w2 = new PublicKeyRing({
        networkName: 'livenet',
        id: w.id,
      });
      w2.addCopayer();
      w.merge(w2.toObj()).should.equal(true);
    }
    w.haveAllRequiredPubKeys().should.equal(true);
  });
});


