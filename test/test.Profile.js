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
    storage.setFromObj = sinon.stub();
    storage.setFromObj.yields(null);
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

  it('#store', function(done) {
    var p = new Profile(opts, password, storage);
    p.store(function(err) {
      storage.setFromObj.getCall(0).args[1].should.deep.equal(p.toObj());
      should.not.exist(err);
      done();
    })
  });



});
