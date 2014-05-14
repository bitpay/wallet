'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var Transaction        = bitcore.Transaction;
var buffertools    = bitcore.buffertools;
var WalletKey    = bitcore.WalletKey;
var Key    = bitcore.Key;
var bignum         = bitcore.bignum;
var networks         = bitcore.networks;
var Address         = bitcore.Address;
var BitcorePrivateKey         = bitcore.PrivateKey;
var copay          = copay || require('../copay');
var PrivateKey     = copay.PrivateKey || require('../js/models/core/PrivateKey');

var config = {
  networkName:'livenet',
};

describe('PrivateKey model', function() {

  it('should create an instance', function () {
    var w = new PrivateKey(config);
    should.exist(w);
    should.exist(w.bip);
    should.exist(w.bip.derive);
  });

  it('should derive priv keys', function () {
    var w = new PrivateKey(config);
    for(var j=0; j<2; j++) {
      for(var i=0; i<3; i++) {
        var wk = w.get(i,j); 
        should.exist(wk);
        var o=wk.storeObj();
        should.exist(o);
        should.exist(o.priv);
        should.exist(o.pub);
        should.exist(o.addr);
        var a = new Address(o.addr);
        a.isValid().should.equal(true);
        (function() {
          var p = new PrivateKey(o.priv)
        }).should.not.throw();
      }
    }
  });
  it('should derive priv keys array', function () {
    var w = new PrivateKey(config);
    var wks = w.getAll(2,3); 
    wks.length.should.equal(5);
    for(var j=0; j<wks.length; j++) {
      var wk = wks[j];
      should.exist(wk);
      var o=wk.storeObj();
      should.exist(o);
      should.exist(o.priv);
      should.exist(o.pub);
      should.exist(o.addr);
      var a = new Address(o.addr);
      a.isValid().should.equal(true);
      (function() {
        var p = new PrivateKey(o.priv)
      }).should.not.throw();
    }
  });

  it('should calculate .id', function () {
    var w1 = new PrivateKey(config);
    should.exist(w1.getId());
    w1.getId().length.should.equal(66);
  });
  it('fromObj toObj roundtrip', function () {
    var w1 = new PrivateKey(config);
    var o = JSON.parse(JSON.stringify(w1.toObj()))
    var w2 = PrivateKey.fromObj(o);

    w2.toObj().extendedPrivateKeyString.should.equal(w1.toObj().extendedPrivateKeyString);
    w2.getId().should.equal(w1.getId());

    JSON.stringify(w2.get(1,1).storeObj()).should
      .equal(JSON.stringify(w1.get(1,1).storeObj()));
    JSON.stringify(w2.get(1,0).storeObj()).should
      .equal(JSON.stringify(w1.get(1,0).storeObj()));
  });
 

});
