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

    it('should remove handlers', function() {
      var n = new WebRTC();
      var save = WebRTC.prototype.removeAllListeners;
      var spy = WebRTC.prototype.removeAllListeners = sinon.spy();
      n.cleanUp();
      spy.calledOnce.should.equal(true);
      WebRTC.prototype.removeAllListeners = save;
    });
  });


  describe('#_setupPeerHandlers', function() {
    var n = new WebRTC();
    n.peer = {};
    var spy = n.peer.on = sinon.spy();
    it('should setup handlers', function() {
      n._setupPeerHandlers();
      spy.calledWith('connection').should.equal(true);
      spy.calledWith('open').should.equal(true);
      spy.calledWith('error').should.equal(true);
    });
  });

  describe('#_handlePeerOpen', function() {
    var n = new WebRTC();
    it('should call openCallback handler', function(done) {
      n.peerId = 1;
      n.copayerId = 2;
      n._handlePeerOpen(function() {
        n.connectedPeers.should.deep.equal([1]);
        n.copayerForPeer.should.deep.equal({
          1: 2
        });
        done();
      });
    });
  });

  describe('#_handlePeerError', function() {
    var log = console.log;
    var n = new WebRTC();
    it('should call _checkAnyPeer on could not connect error', function() {
      var save = n._checkAnyPeer;
      var spy = n._checkAnyPeer = sinon.spy();
      var logSpy = console.log = sinon.spy();
      n._handlePeerError({
        message: 'Could not connect to peer xxx'
      });
      console.log = log;
      spy.called.should.equal(true);
      logSpy.called.should.equal(true);
      n._checkAnyPeer = save;
    });

    it('should call not call _checkAnyPeer other error', function() {
      var save = n._checkAnyPeer;
      var spy = n._checkAnyPeer = sinon.spy();
      var otherMessage = 'Could connect to peer xxx';
      var logSpy = console.log = sinon.spy();
      n._handlePeerError({
        message: otherMessage,
      });
      console.log = log;
      spy.called.should.equal(false);
      n.criticalError.should.equal(otherMessage);
      logSpy.called.should.equal(true);
      n._checkAnyPeer = save;
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
      n._sendToOne = function(a1, a2, cb) {
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
      n._sendToOne = function(a1, enc, cb) {
        var encPayload = JSON.parse(enc.toString());
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
      n._sendToOne = function(a1, a2, cb) {
        cb();
      };
      var sig = undefined;
      n.send(copayerIds, data, function() {
        done();
      });

    });
  });

  describe('#_onData', function() {
    var privkey1 = bitcore.util.sha256('test privkey 1');
    var privkey2 = bitcore.util.sha256('test privkey 2');
    var privkey3 = bitcore.util.sha256('test privkey 2');

    var key1 = new bitcore.Key();
    key1.private = privkey1;
    key1.regenerateSync();

    var key2 = new bitcore.Key();
    key2.private = privkey2;
    key2.regenerateSync();

    var key3 = new bitcore.Key();
    key3.private = privkey3;
    key3.regenerateSync();

    it('should not reject data sent from a peer with hijacked pubkey', function() {
      var n = new WebRTC();
      n.privkey = key2.private.toString('hex');

      var message = {
        type: 'hello',
        copayerId: key1.public.toString('hex')
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var encoded = n._encode(key2.public, key1, messagebuf);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
    });

    it('should reject data sent from a peer with hijacked pubkey', function() {
      var n = new WebRTC();
      n.privkey = key2.private.toString('hex');

      var message = {
        type: 'hello',
        copayerId: key3.public.toString('hex') //MITM pubkey 3
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var encoded = n._encode(key2.public, key1, messagebuf);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(true);
      n._deletePeer.getCall(0).args[0].should.equal(peerId);
      n._deletePeer.getCall(0).args[1].should.equal('incorrect pubkey for peerId');
    });

  });

});
