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
    password: password,
  };

  beforeEach(function() {
    storage.getItem = sinon.stub();
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
      password: password
    }, storage);
    should.exist(p);
  });

  it('#fromObj #toObj round trip', function() {

    var p = new Profile(opts, storage);
    var p2 = Profile.fromObj(p.toObj(), storage);
    p2.should.deep.equal(p);
  });

  it('#store', function(done) {
    var p = new Profile(opts, storage);
    p.store(function(err) {
      should.not.exist(err);
      done();
    })
  });



});
