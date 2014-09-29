'use strict';

var chai = chai || require('chai');
var should = chai.should();
var bitcore = bitcore || require('bitcore');
var buffertools = bitcore.buffertools;
var Profile = require('../js/models/Profile')
var sinon = require('sinon');
var FakeStorage = function() {};

describe('Profile model', function() {
  var email = 'email@pepe.com';
  var password = 'iamnotsatoshi';
  var storage = new FakeStorage();
  var opts = {
    email: email,
  };

  beforeEach(function() {
    storage.getItem = sinon.stub();
    storage.set = sinon.stub();
    storage.set.yields(null);
    storage.get = sinon.stub().yields(null);
  });

  it('should fail create an instance', function() {
    (function() {
      new Profile({
        email: email,
      }, storage)
    }).should.throw('Illegal Arg');
  });

  it('should create an instance', function() {
    var p = new Profile({
      email: email,
    }, password, storage);
    should.exist(p);
  });

  it('#fromObj #toObj round trip', function() {
    var p = new Profile(opts, password, storage);
    var p2 = Profile.fromObj(p.toObj(), password, storage);
    p2.should.deep.equal(p);
  });

  describe.only('#addWallet', function() {
    it('should add a wallet id', function(done) {
      var p = new Profile(opts, password, storage);
      p.addWallet('123', function(err) {
        p.walletIds['123'].should.be.above(123456789);
        storage.set.getCall(0).args[1].should.deep.equal(p.toObj());
        done();
      })
    });
    it('should keep old value', function(done) {
      var p = new Profile(opts, password, storage);
      p.walletIds['123']=1;
      p.addWallet('123', function(err) {
        p.walletIds['123'].should.equal(1);
        should.not.exist(storage.set.getCall(0));
        done();
      })
    });
 
  });

  describe('#store', function() {
    it('should call storage set', function(done) {
      var p = new Profile(opts, password, storage);
      p.store({}, function(err) {
        storage.set.getCall(0).args[1].should.deep.equal(p.toObj());
        should.not.exist(err);
        done();
      })
    });
    it('should use fail to overwrite', function(done) {
      storage.get = sinon.stub().yields(123);
      var p = new Profile(opts, password, storage);
      p.store({}, function(err) {
        err.toString().should.contain('PEXISTS');
        should.not.exist(storage.set.getCall(0));
        done();
      })
    });

    it('should use overwrite param', function(done) {
      storage.get = sinon.stub().yields(123);
      var p = new Profile(opts, password, storage);
      p.store({
        overwrite: true
      }, function(err) {
        storage.set.getCall(0).args[1].should.deep.equal(p.toObj());
        should.not.exist(err);
        done();
      })
    });
  });
});
