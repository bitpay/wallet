'use strict';
var _ = require('underscore');
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
  var hash = '1234';
  var storage = new FakeStorage();
  var opts = {
    email: email,
    hash: hash,
  };

  beforeEach(function() {
    storage.setPassword = sinon.stub();
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
      hash: hash,
    }, storage);
    should.exist(p);
  });

  it('#fromObj #toObj round trip', function() {
    var p = new Profile(opts, storage);
    var p2 = new Profile(p.toObj(), storage);
    p2.should.deep.equal(p);
  });

  describe('#addWallet', function() {
    it('should add a wallet id', function(done) {
      var p = new Profile(opts, storage);
      p.addWallet('123', {}, function(err) {
        p.getWallet('123').createdTs.should.be.above(123456789);
        storage.set.getCall(0).args[1].should.deep.equal(p.toObj());
        done();
      })
    });
    it('should keep old ts value', function(done) {
      var p = new Profile(opts, storage);
      p.walletInfos['123'] = {
        createdTs: 1
      };
      p.addWallet('123', {}, function(err) {
        err.toString().should.contain('WEXIST');
        p.walletInfos['123'].createdTs.should.equal(1);
        should.not.exist(storage.set.getCall(0));
        done();
      })
    });
    it('should add a wallet info', function(done) {
      var p = new Profile(opts, storage);
      p.addWallet('123', {
        a: 1,
        b: 2
      }, function(err) {
        var w = p.getWallet('123');
        w.createdTs.should.be.above(123456789);
        w.a.should.equal(1);
        w.b.should.equal(2);
        storage.set.getCall(0).args[1].should.deep.equal(p.toObj());
        done();
      })
    });
  });

  describe('#addToWallet', function() {
    it('should warn if wallet does not exist', function(done) {
      var p = new Profile(opts, storage);
      p.addToWallet('234', {
        1: 1
      }, function(err) {
        err.toString().should.contain('WNOEXIST');
        done();
      });
    });
    it('should add info to a wallet', function(done) {
      var p = new Profile(opts, storage);
      p.addWallet('234', {}, function(err) {
        p.addToWallet('234', {
          'hola': 1
        }, function(err) {
          var w = p.getWallet('234');
          should.exist(w);
          w.hola.should.equal(1);
          w.createdTs.should.be.above(123456789);
          done();
        })
      })
    });
  });



  describe('#listWallets', function() {
    it('should list wallets in order', function(done) {
      var p = new Profile(opts, storage);
      p.addWallet('123', {}, function(err) {
        setTimeout(function() {
          p.addWallet('234', {}, function(err) {
            _.pluck(p.listWallets(), 'id').should.deep.equal(['123', '234']);
            done();
          })
        }, 10);
      });
    });
  });

  describe('#deleteWallet', function() {
    it('should delete a wallet', function(done) {
      var p = new Profile(opts, storage);
      p.addWallet('123', {}, function(err) {
        p.addWallet('234', {}, function(err) {
          p.addWallet('345', {}, function(err) {
            _.pluck(p.listWallets(), 'id').sort().should.deep.equal(['123', '234', '345']);
            p.deleteWallet('234', function(err) {
              _.pluck(p.listWallets(), 'id').sort().should.deep.equal(['123', '345']);
              done();
            });
          })
        });
      });
    });
    it('should warn if wallet does not exist', function(done) {
      var p = new Profile(opts, storage);
      p.deleteWallet('234', function(err) {
        err.toString().should.contain('WNOEXIST');
        done();
      });
    });
  });


  describe('#store', function() {
    it('should call storage set', function(done) {
      var p = new Profile(opts, storage);
      p.store({}, function(err) {
        storage.set.getCall(0).args[1].should.deep.equal(p.toObj());
        should.not.exist(err);
        done();
      })
    });
    it('should use fail to overwrite', function(done) {
      storage.get = sinon.stub().yields(123);
      var p = new Profile(opts, storage);
      p.store({}, function(err) {
        err.toString().should.contain('PEXISTS');
        should.not.exist(storage.set.getCall(0));
        done();
      })
    });

    it('should use overwrite param', function(done) {
      storage.get = sinon.stub().yields(123);
      var p = new Profile(opts, storage);
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
