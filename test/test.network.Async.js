'use strict';

var chai = chai || require('chai');
var should = chai.should();
var expect = chai.expect;
var sinon = sinon || require('sinon');
var bitcore = bitcore || require('bitcore');
var Async = require('../js/models/network/Async');
var EventEmitter = require('events').EventEmitter;

describe('Network / Async', function() {


  var createN = function(pk) {
    var n = new Async();
    var fakeSocket = {};
    fakeSocket.emit = function() {};
    fakeSocket.on = function() {};
    n.createSocket = function() {
      return fakeSocket;
    };
    var opts = {
      copayerId: '03b51d01d798522cf61211b4dfcdd6db219ee33cf166e1cb7f43d836ab00ccddee',
      privkey: pk || '31701118abde096d166607115ed00ce74a2231f68f43144406c863f5ebf06c32',
      lastTimestamp: 1,
    };
    n.start(opts);
    return n;
  };

  it('should create an instance', function() {
    var n = createN();
    should.exist(n);
  });

  describe('#cleanUp', function() {

    it('should not set netKey', function() {
      var n = createN();
      (n.netKey === undefined).should.equal(true);
    });

    it('should set privkey to null', function() {
      var n = createN();
      n.cleanUp();
      expect(n.privkey).to.equal(null);
    });

    it('should remove handlers', function() {
      var n = createN();
      var save = Async.prototype.removeAllListeners;
      var spy = Async.prototype.removeAllListeners = sinon.spy();
      n.cleanUp();
      spy.calledOnce.should.equal(true);
      Async.prototype.removeAllListeners = save;
    });
  });

  describe('#send', function() {

    it('should call _sendToOne for a copayer', function(done) {
      var n = createN();
      n.privkey = bitcore.util.sha256('test');
      n.key = null;

      var data = new bitcore.Buffer('my data to send');

      var copayerId = '03b51d01d798522cf61211b4dfcdd6d01020304cf166e1cb7f43d836abc5c18b23';
      n._sendToOne = function(a, b, cb) {
        cb();
      };
      var opts = {};
      n.send(copayerId, data, done);

    });

    it('should call _sendToOne with encrypted data for a copayer', function(done) {
      var n = createN();
      n.privkey = bitcore.util.sha256('test');
      n.key = null;

      var data = new bitcore.Buffer('my data to send');

      var copayerId = '03b51d01d798522cf61001b4dfcdd6db219ee33cf166e1cb7f43d836abc5c18b23';
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
      var n = createN();
      n.privkey = bitcore.util.sha256('test');

      var data = new bitcore.Buffer('my data to send');
      var copayerIds = ['03b51d01d798522cf61211b4dfcdd6db219ee33cf166e1cb7f43d836abc5c18b23'];
      n._sendToOne = function(a1, a2, cb) {
        cb();
      };
      var opts = {};
      n.send(copayerIds, data, function() {
        done();
      });

    });
  });

  describe('#_onMessage', function() {
    var privkey1 = bitcore.util.sha256('test privkey 1');
    var privkey2 = bitcore.util.sha256('test privkey 2');
    var privkey3 = bitcore.util.sha256('test privkey 2');

    var key1 = new bitcore.Key();
    key1.private = privkey1;
    key1.regenerateSync();
    var pk1 = key1.private.toString('hex');
    var cid1 = key1.public.toString('hex');

    var key2 = new bitcore.Key();
    key2.private = privkey2;
    key2.regenerateSync();
    var pk2 = key2.private.toString('hex');
    var cid2 = key2.public.toString('hex');

    var key3 = new bitcore.Key();
    key3.private = privkey3;
    key3.regenerateSync();
    var pk3 = key3.private.toString('hex');
    var cid3 = key3.public.toString('hex');

    it('should not reject data sent from a peer with hijacked pubkey', function() {
      var n = createN(pk2);

      var message = {
        type: 'hello',
        copayerId: cid1
      };
      var enc = n.encode(cid2, message);

      n._deletePeer = sinon.spy();

      n._onMessage(enc);
      n._deletePeer.calledOnce.should.equal(false);
    });

    it('should reject data sent from a peer with hijacked pubkey', function() {
      var n = createN(pk2);

      var message = {
        type: 'hello',
        copayerId: cid3 // MITM
      };
      
      var enc = n.encode(cid2, message);

      n._deletePeer = sinon.spy();

      n._onMessage(enc);
      n._deletePeer.calledOnce.should.equal(true);
      n._deletePeer.getCall(0).args[0].should.equal(peerId);
      n._deletePeer.getCall(0).args[1].should.equal('incorrect pubkey for peerId');
    });

    it('should not reject data sent from a peer with no previously set nonce but who is setting one now', function() {
      var n = createN();
      n.privkey = key2.private.toString('hex');
      n.key = null;

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

      n._onMessage(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
      n.getHexNonces()[(new bitcore.SIN(key1.public)).toString()].toString('hex').should.equal('0000000000000001');
    });

    it('should not reject data sent from a peer with a really big new nonce', function() {
      var n = createN();
      n.privkey = key2.private.toString('hex');
      n.key = null;
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

      n._onMessage(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
    });

    it('should not reject data sent from a peer with a really big new nonce', function() {
      var n = createN();
      n.privkey = key2.private.toString('hex');
      n.key = false;
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

      n._onMessage(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(false);
    });

    it('should reject data sent from a peer with an outdated nonce', function() {
      var n = createN();
      n.privkey = key2.private.toString('hex');
      n.key = null;
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

      n._onMessage(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(true);
    });

    it('should reject data sent from a peer with a really big outdated nonce', function() {
      var n = createN();
      n.privkey = key2.private.toString('hex');
      n.key = null;
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

      n._onMessage(encodeduint, isInbound, peerId);
      n._deletePeer.calledOnce.should.equal(true);
    });

  });

  describe('#setHexNonce', function() {

    it('should set a nonce from a hex value', function() {
      var hex = '0000000000000000';
      var n = createN();
      n.setHexNonce(hex);
      n.getHexNonce().should.equal(hex);
      n.networkNonce.toString('hex').should.equal(hex);
    });

  });

  describe('#setHexNonces', function() {

    it('should set a nonce from a hex value', function() {
      var hex = '0000000000000000';
      var n = createN();
      n.setHexNonces({
        fakeid: hex
      });
      n.getHexNonces().fakeid.should.equal(hex);
    });

  });

  describe('#getHexNonce', function() {

    it('should get a nonce hex value', function() {
      var hex = '0000000000000000';
      var n = createN();
      n.setHexNonce(hex);
      n.getHexNonce().should.equal(hex);
    });

  });

  describe('#getHexNonces', function() {

    it('should get a nonce from a hex value', function() {
      var hex = '0000000000000000';
      var n = createN();
      n.setHexNonces({
        fakeid: hex
      });
      n.getHexNonces().fakeid.should.equal(hex);
    });

  });

  describe('#iterateNonce', function() {

    it('should set a nonce not already set', function() {
      var n = createN();
      n.iterateNonce();
      n.networkNonce.slice(4, 8).toString('hex').should.equal('00000001');
      n.networkNonce.slice(0, 4).toString('hex').should.not.equal('00000000');
    });

    it('called twice should increment', function() {
      var n = createN();
      n.iterateNonce();
      n.networkNonce.slice(4, 8).toString('hex').should.equal('00000001');
      n.iterateNonce();
      n.networkNonce.slice(4, 8).toString('hex').should.equal('00000002');
    });

    it('should set the first byte to the most significant "now" digit', function() {
      var n = createN();
      n.iterateNonce();
      var buf = new Buffer(4);
      buf.writeUInt32BE(Math.floor(Date.now() / 1000), 0);
      n.networkNonce[0].should.equal(buf[0]);
    });

  });

});
