'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var expect         = chai.expect;
var sinon          = sinon || require('sinon');
var bitcore        = bitcore || require('bitcore');
var copay          = copay || require('../copay');
var Network        = copay.WebRTC || require('../js/models/network/WebRTC.js');

describe('Network / WebRTC', function() {

  it('should create an instance', function () {
    var n = new Network();
    should.exist(n);
  });

/*
  describe('#Network constructor', function() {
    it('should call cleanUp', function() {
      var save = Network.prototype.cleanUp;
      Network.prototype.cleanUp = sinon.spy();
      var n = new Network();
      n.cleanUp.calledOnce.should.equal(true);
      Network.prototype.cleanUp = save;
    });
  });

  describe('#cleanUp', function() {
    it('should set privkey to null', function() {
      var n = new Network();
      n.cleanUp();
      expect(n.privkey).to.equal(null);
    });
  });
  */

});
