'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var expect         = chai.expect;
var sinon          = sinon || require('sinon');
var bitcore        = bitcore || require('bitcore');
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}
var WebRTC = require('../js/models/network/WebRTC');

describe('Network / WebRTC', function() {

  it('should create an instance', function () {
    var n = new WebRTC();
    should.exist(n);
  });

  describe('#WebRTC constructor', function() {
    it('should set reconnect attempts', function() {
      var n = new WebRTC();
      n.reconnectAttempts.should.equal(3);
    });

    it('should call cleanUp', function() {
      var save = WebRTC.prototype.cleanUp;
      WebRTC.prototype.cleanUp = sinon.spy();
      var n = new WebRTC();
      n.cleanUp.calledOnce.should.equal(true);
      WebRTC.prototype.cleanUp = save;
    });
  });

  describe('#cleanUp', function() {
    it('should set privkey to null', function() {
      var n = new WebRTC();
      n.cleanUp();
      expect(n.privkey).to.equal(null);
    });
  });

});
