'use strict';

var chai = chai || require('chai');
var should = chai.should();
var expect = chai.expect;
var sinon = sinon || require('sinon');
var bitcore = bitcore || require('bitcore');
var WebRTC = require('../js/models/network/WebRTC');

describe('Network / WebRTC', function() {

  it('should create an instance', function() {
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

    it('should not set netKey', function() {
      var n = new WebRTC();
      (n.netKey === undefined).should.equal(true);
    });

    it('should set privkey to null', function() {
      var n = new WebRTC();
      n.cleanUp();
      expect(n.privkey).to.equal(null);
    });

  });

  describe('#_encode', function() {

    it('should encode data successfully', function() {
      var n = new WebRTC();
      var data = new bitcore.Buffer('my data to encode');
      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();
      var encoded = n._encode(key.public, key, data);
      should.exist(encoded);
      encoded.sig.length.should.not.equal(0);
      encoded.pubkey.length.should.not.equal(0);
      encoded.encrypted.length.should.not.equal(0);
    });

  });

  describe('#_decode', function() {

    it('should decode that which was encoded', function() {
      var n = new WebRTC();
      var data = new bitcore.Buffer('my data to encrypt');
      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();
      var encoded = n._encode(key.public, key, data);
      var decoded = n._decode(key, encoded);
      encoded.sig.should.not.equal(0);
      decoded.toString().should.equal('my data to encrypt');
    });

  });

  describe('#send', function() {

    it('should call _sendToOne for a copayer', function(done) {
      var n = new WebRTC();
      n.privkey = bitcore.util.sha256('test');

      var data = new bitcore.Buffer('my data to send');

      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();

      var copayerId = key.public.toString('hex');
      n._sendToOne = function(a1, a2, a3, cb) {
        cb();
      };
      var sig = undefined;
      n.send(copayerId, data, function() {
        done();
      });

    });

    it('should call _sendToOne with encrypted data for a copayer', function(done) {
      var n = new WebRTC();
      n.privkey = bitcore.util.sha256('test');

      var data = new bitcore.Buffer('my data to send');

      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();

      var copayerId = key.public.toString('hex');
      n._sendToOne = function(a1, encPayload, a3, cb) {
        encPayload.sig.length.should.be.greaterThan(0);
        cb();
      };
      var sig = undefined;
      n.send(copayerId, data, function() {
        done();
      });

    });

    it('should call _sendToOne for a list of copayers', function(done) {
      var n = new WebRTC();
      n.privkey = bitcore.util.sha256('test');

      var data = new bitcore.Buffer('my data to send');

      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();

      var copayerIds = [key.public.toString('hex')];
      n._sendToOne = function(a1, a2, a3, cb) {
        cb();
      };
      var sig = undefined;
      n.send(copayerIds, data, function() {
        done();
      });

    });
  });

});
