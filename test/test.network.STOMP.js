'use strict';

var chai = chai || require('chai');
var should = chai.should();
var expect = chai.expect;
var sinon = sinon || require('sinon');
var bitcore = bitcore || require('bitcore');
var STOMP = require('../js/models/network/STOMP');

describe('Network / STOMP', function() {

  it('should create an instance', function() {
    var n = new STOMP({
      url: 'pepe'
    });
    should.exist(n);
  });

  describe.skip('#STOMP constructor', function() {

    it('should set reconnect attempts', function() {
      var n = new STOMP();
      n.reconnectAttempts.should.equal(3);
    });

    it('should call cleanUp', function() {
      var save = STOMP.prototype.cleanUp;
      STOMP.prototype.cleanUp = sinon.spy();
      var n = new STOMP({
        url: 'pepe'
      });
      n.cleanUp.calledOnce.should.equal(true);
      STOMP.prototype.cleanUp = save;
    });
  });

  describe.skip('#cleanUp', function() {

    it('should not set netKey', function() {
      var n = new STOMP();
      (n.netKey === undefined).should.equal(true);
    });

    it('should set privkey to null', function() {
      var n = new STOMP();
      n.cleanUp();
      expect(n.privkey).to.equal(null);
    });

    it('should remove handlers', function() {
      var n = new STOMP();
      var save = STOMP.prototype.removeAllListeners;
      var spy = STOMP.prototype.removeAllListeners = sinon.spy();
      n.cleanUp();
      spy.calledOnce.should.equal(true);
      STOMP.prototype.removeAllListeners = save;
    });
  });


  describe.skip('#_setupPeerHandlers', function() {
    var n = new STOMP({
      url: 'pepe'
    });
    n.peer = {};
    var spy = n.peer.on = sinon.spy();
    it('should setup handlers', function() {
      n._setupPeerHandlers();
      spy.calledWith('connection').should.equal(true);
      spy.calledWith('open').should.equal(true);
      spy.calledWith('error').should.equal(true);
    });
  });

  describe.skip('#_handlePeerOpen', function() {
    var n = new STOMP({
      url: 'pepe'
    });
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

  describe.skip('#_handlePeerError', function() {
    var log = console.log;
    var n = new STOMP({
      url: 'pepe'
    });
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



  describe.skip('#_encode', function() {

    it('should encode data successfully', function() {
      var n = new STOMP({
        url: 'pepe'
      });
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

  describe.skip('#_decode', function() {

    it('should decode that which was encoded', function() {
      var n = new STOMP({
        url: 'pepe'
      });
      var data = new bitcore.Buffer('my data to encrypt');
      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();
      var encoded = n._encode(key.public, key, data);
      var decoded = n._decode(key, encoded);
      encoded.sig.should.not.equal(0);
      decoded.payload.toString().should.equal('my data to encrypt');
    });

  });

  describe.skip('#send', function() {

    it('should call _sendToOne for a copayer', function(done) {
      var n = new STOMP({
        url: 'pepe'
      });
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
      var opts = {};
      n.send(copayerId, data, function() {
        done();
      });

    });

    it('should call _sendToOne with encrypted data for a copayer', function(done) {
      var n = new STOMP({
        url: 'pepe'
      });
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
      var opts = {};
      n.send(copayerId, data, function() {
        done();
      });

    });

    it('should call _sendToOne for a list of copayers', function(done) {
      var n = new STOMP({
        url: 'pepe'
      });
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
      var opts = {};
      n.send(copayerIds, data, function() {
        done();
      });

    });
  });

  describe.skip('#_onData', function() {
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
    var n = new STOMP({url:'pepe'});
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
    var n = new STOMP({url:'pepe'});
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

    it('should not reject data sent from a peer with no previously set nonce but who is setting one now', function() {
    var n = new STOMP({url:'pepe'});
      n.privkey = key2.private.toString('hex');
      //n.networkNonces = {};
      //n.networkNonces[(new bitcore.SIN(key1.public)).toString()] = new Buffer('0000000000000001', 'hex'); //previously used nonce

      var message = {
        type: 'hello',
        copayerId: key1.public.toString('hex')
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var opts = {
        nonce: new Buffer('0000000000000001', 'hex')
      }; //message send with new nonce
      var encoded = n._encode(key2.public, key1, messagebuf, opts);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
      n.getHexNonces()[(new bitcore.SIN(key1.public)).toString()].toString('hex').should.equal('0000000000000001');
    });

    it('should not reject data sent from a peer with a really big new nonce', function() {
    var n = new STOMP({url:'pepe'});
      n.privkey = key2.private.toString('hex');
      n.networkNonces = {};
      n.networkNonces[(new bitcore.SIN(key1.public)).toString()] = new Buffer('5000000000000001', 'hex'); //previously used nonce

      var message = {
        type: 'hello',
        copayerId: key1.public.toString('hex')
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var opts = {
        nonce: new Buffer('5000000000000002', 'hex')
      }; //message send with new nonce
      var encoded = n._encode(key2.public, key1, messagebuf, opts);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
    });

    it('should not reject data sent from a peer with a really big new nonce', function() {
    var n = new STOMP({url:'pepe'});
      n.privkey = key2.private.toString('hex');
      n.networkNonces = {};
      n.networkNonces[(new bitcore.SIN(key1.public)).toString()] = new Buffer('5000000000000001', 'hex'); //previously used nonce

      var message = {
        type: 'hello',
        copayerId: key1.public.toString('hex')
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var opts = {
        nonce: new Buffer('5000000000000002', 'hex')
      }; //message send with new nonce
      var encoded = n._encode(key2.public, key1, messagebuf, opts);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
    });

    it('should reject data sent from a peer with an outdated nonce', function() {
    var n = new STOMP({url:'pepe'});
      n.privkey = key2.private.toString('hex');
      n.networkNonces = {};
      n.networkNonces[(new bitcore.SIN(key1.public)).toString()] = new Buffer('0000000000000002', 'hex'); //previously used nonce

      var message = {
        type: 'hello',
        copayerId: key1.public.toString('hex')
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var opts = {
        nonce: new Buffer('0000000000000001', 'hex')
      }; //message send with old nonce
      var encoded = n._encode(key2.public, key1, messagebuf, opts);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(true);
    });

    it('should reject data sent from a peer with a really big outdated nonce', function() {
    var n = new STOMP({url:'pepe'});
      n.privkey = key2.private.toString('hex');
      n.networkNonces = {};
      n.networkNonces[(new bitcore.SIN(key1.public)).toString()] = new Buffer('5000000000000002', 'hex'); //previously used nonce

      var message = {
        type: 'hello',
        copayerId: key1.public.toString('hex')
      };
      var messagestr = JSON.stringify(message);
      var messagebuf = new Buffer(messagestr);

      var opts = {
        nonce: new Buffer('5000000000000001', 'hex')
      }; //message send with old nonce
      var encoded = n._encode(key2.public, key1, messagebuf, opts);
      var encodedstr = JSON.stringify(encoded);
      var encodeduint = new Buffer(encodedstr);

      var isInbound = true;
      var peerId = new bitcore.SIN(key1.public);

      n._deletePeer = sinon.spy();

      n._onData(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(true);
    });

  });

  describe('#setHexNonce', function() {

    it('should set a nonce from a hex value', function() {
      var hex = '0000000000000000';
    var n = new STOMP({url:'pepe'});
      n.setHexNonce(hex);
      n.getHexNonce().should.equal(hex);
      n.networkNonce.toString('hex').should.equal(hex);
    });

  });

  describe('#setHexNonces', function() {

    it('should set a nonce from a hex value', function() {
      var hex = '0000000000000000';
    var n = new STOMP({url:'pepe'});
      n.setHexNonces({
        fakeid: hex
      });
      n.getHexNonces().fakeid.should.equal(hex);
    });

  });

  describe('#getHexNonce', function() {

    it('should get a nonce hex value', function() {
      var hex = '0000000000000000';
    var n = new STOMP({url:'pepe'});
      n.setHexNonce(hex);
      n.getHexNonce().should.equal(hex);
    });

  });

  describe('#getHexNonces', function() {

    it('should get a nonce from a hex value', function() {
      var hex = '0000000000000000';
    var n = new STOMP({url:'pepe'});
      n.setHexNonces({
        fakeid: hex
      });
      n.getHexNonces().fakeid.should.equal(hex);
    });

  });

  describe('#iterateNonce', function() {

    it('should set a nonce not already set', function() {
    var n = new STOMP({url:'pepe'});
      n.iterateNonce();
      n.networkNonce.slice(4, 8).toString('hex').should.equal('00000001');
      n.networkNonce.slice(0, 4).toString('hex').should.not.equal('00000000');
    });

    it('called twice should increment', function() {
    var n = new STOMP({url:'pepe'});
      n.iterateNonce();
      n.networkNonce.slice(4, 8).toString('hex').should.equal('00000001');
      n.iterateNonce();
      n.networkNonce.slice(4, 8).toString('hex').should.equal('00000002');
    });

    it('should set the first byte to the most significant "now" digit', function() {
    var n = new STOMP({url:'pepe'});
      n.iterateNonce();
      var buf = new Buffer(4);
      buf.writeUInt32BE(Math.floor(Date.now() / 1000), 0);
      n.networkNonce[0].should.equal(buf[0]);
    });

  });

});
