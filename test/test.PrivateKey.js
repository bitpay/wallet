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
var Address         = bitcore.Address;
var BitcorePrivateKey         = bitcore.PrivateKey;
var copay          = copay || require('../copay');
var PrivateKey     = copay.PrivateKey || require('../js/models/PrivateKey');

var config = {
  networkName:'livenet',
};

describe('PrivateKey model', function() {

  it('should create an instance', function () {
    var w = new PrivateKey(config);
    should.exist(w);
    should.exist(w.BIP32);
    should.exist(w.BIP32.derive);
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

});
