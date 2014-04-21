'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var Address        = bitcore.Address;
var buffertools    = bitcore.buffertools;
var copay          = copay || require('../copay');
var PublicKeyRing  = copay.PublicKeyRing;

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
    w.isComplete().should.equal(false);
    var newEpk = w.addCopayer();
    copayers.push(newEpk);
  }
  w.walletId = '1234567';
  
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
    w2.isComplete().should.equal(false);

    (function() {w2.getAddress(0, false);}).should.throw();
  });

  it('should add and check when adding shared pub keys', function () {
    var k = createW();
    var w = k.w;
    var copayers = k.copayers;

    w.isComplete().should.equal(true);
    w.addCopayer.should.throw();
    for(var i =0; i<5; i++) {
      (function() {w.addCopayer(copayers[i])}).should.throw();
    }
  });

  it('show be able to tostore and read', function () {
    var k = createW();
    var w = k.w;
    var copayers = k.copayers;
    var changeN = 2;
    var addressN = 2;
    var start = new Date().getTime();
    for(var i=0; i<changeN; i++) {
      w.generateAddress(true);
    }
    for(var i=0; i<addressN; i++) {
      w.generateAddress(false);
    }

    var data = w.toObj();
    should.exist(data);

    var w2 = PublicKeyRing.fromObj(data);
    w2.walletId.should.equal(w.walletId);
    w2.isComplete().should.equal(true);
    w2.addCopayer.should.throw();
    for(var i =0; i<5; i++) {
      (function() {w.addCopayer(copayers[i])}).should.throw();
    }

    w2.changeAddressIndex.should.equal(changeN);   
    w2.addressIndex.should.equal(addressN); 
  });


  it('should generate some p2sh addresses', function () {
    var k = createW();
    var w = k.w;

    for(var isChange=0; isChange<2; isChange++) {
      for(var i=0; i<2; i++) {
        var a = w.generateAddress(isChange);
        a.isValid().should.equal(true);
        a.isScript().should.equal(true);
        a.network().name.should.equal('livenet');
        if (i>1) {
          w.getAddress(i-1,isChange).toString().should
            .not.equal(w.getAddress(i-2,isChange).toString());
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
      for(var i=0; i<2; i++) 
         w.generateAddress(isChange);
 
    var as = w.getAddresses();
    as.length.should.equal(4);
    for(var j in as) {
      var a = as[j];
      a.isValid().should.equal(true);
    }
  });

  it('should count generation indexes', function () {
    var k = createW();
    var w = k.w;

    for(var i=0; i<3; i++)
      w.generateAddress(true);
    for(var i=0; i<2; i++)
      w.generateAddress(false);

    w.changeAddressIndex.should.equal(3);   
    w.addressIndex.should.equal(2); 
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
      walletId: w.walletId,
    });
    w2.merge(w).should.equal(true);
    w2.requiredCopayers.should.equal(3);   
    w2.totalCopayers.should.equal(5);   
    w2.changeAddressIndex.should.equal(2);   
    w2.addressIndex.should.equal(3); 

    //
    w2.merge(w).should.equal(false);
  });


  it('#merge check tests', function () {
    var config = {
      networkName: 'livenet',
    };

    var w = new PublicKeyRing(config);
    w.walletId = 'lwjd5qra8257b9';
    var w2 = new PublicKeyRing({
      networkName: 'testnet',    //wrong
      walletId: w.walletId,
    });
    (function() { w2.merge(w);}).should.throw();

    var w3 = new PublicKeyRing({
      networkName: 'livenet',
      walletId: w.walletId,
      requiredCopayers: 2,      // wrong
    });
    (function() { w3.merge(w);}).should.throw();

    var w4 = new PublicKeyRing({
      networkName: 'livenet',
      walletId: w.walletId,
      totalCopayers: 3,      // wrong
    });
    (function() { w4.merge(w);}).should.throw();


    var w6 = new PublicKeyRing({
      networkName: 'livenet',
    });
    (function() { w6.merge(w);}).should.throw();
    w.networkName= 'livenet';
    (function() { w6.merge(w);}).should.throw();


    var w0 = new PublicKeyRing({
      networkName: 'livenet',
    });
    w0.addCopayer();
    w0.addCopayer();
    w0.addCopayer();
    w0.addCopayer();
    w0.addCopayer();
    (function() { w0.merge(w);}).should.throw();
    w.merge(w0,true).should.equal(true);
    w.isComplete().should.equal(true);

    var wx = new PublicKeyRing({
      networkName: 'livenet',
    });
    wx.addCopayer();
    (function() { w.merge(wx, true);}).should.throw();


  });


  it('#merge pubkey tests', function () {
    var w = new PublicKeyRing(config);
    should.exist(w);
    var copayers = [];
    for(var i=0; i<2; i++) {
      w.isComplete().should.equal(false);
      w.addCopayer();
    }

    var w2 = new PublicKeyRing({
      networkName: 'livenet',
      id: w.id,
    });
    should.exist(w);
    var copayers = [];
    for(var i=0; i<3; i++) {
      w2.isComplete().should.equal(false);
      w2.addCopayer();
    }
    w2.merge(w).should.equal(true);
    w2.isComplete().should.equal(true);
    w2.merge(w).should.equal(false);

    w.isComplete().should.equal(false);
    w.merge(w2).should.equal(true);
    w.isComplete().should.equal(true);
    w.merge(w2).should.equal(false);
  });

  it('#merge pubkey tests (case 2)', function () {
    var w = new PublicKeyRing(config);
    should.exist(w);

    for(var i=0; i<5; i++) {
      w.isComplete().should.equal(false);
      var w2 = new PublicKeyRing({
        networkName: 'livenet',
        id: w.id,
      });
      w2.addCopayer();
      w.merge(w2).should.equal(true);
    }
    w.isComplete().should.equal(true);
  });


  it('#getRedeemScriptMap check tests', function () {
    var k = createW();
    var w = k.w;

    for(var i=0; i<2; i++)
      w.generateAddress(true);
    for(var i=0; i<2; i++)
      w.generateAddress(false);

    var m = w.getRedeemScriptMap();
    Object.keys(m).length.should.equal(4);
    Object.keys(m).forEach(function (k) {
      should.exist(m[k]);
    });
  });

});


