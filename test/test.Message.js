'use strict';

var chai = chai || require('chai');
var should = chai.should();
var sinon = require('sinon');
var Message = require('../js/models/core/Message');
var bitcore = bitcore || require('bitcore');
var Buffer = bitcore.Buffer;

describe('Message model', function() {
  var key = new bitcore.Key();
  key.private = bitcore.util.sha256(new Buffer('test'));
  key.regenerateSync();

  var key2 = new bitcore.Key();
  key2.private = bitcore.util.sha256(new Buffer('test 2'));
  key2.regenerateSync();

  describe('#encode', function() {
    
    it('should encode a message', function() {
      var message = new Buffer('message');
      var encoded = Message.encode(key2.public, key, message);
      should.exist(encoded.pubkey);
      should.exist(encoded.sig);
      should.exist(encoded.encrypted);
    });

  });

  describe('#decode', function() {

    it('should decode an encoded message', function() {
      var message = new Buffer('message');
      var messagehex = message.toString('hex');
      var encoded = Message.encode(key2.public, key, message);
    
      var decoded = Message.decode(key2, encoded);
      var payload = decoded.payload;
      payload.toString('hex').should.equal(messagehex);
    });

    it('should decode an encoded message with proper prevnonce', function() {
      var message = new Buffer('message');
      var messagehex = message.toString('hex');
      var nonce = new Buffer([0, 0, 0, 0, 0, 0, 0, 2]);
      var opts = {nonce: nonce};
      var encoded = Message.encode(key2.public, key, message, opts);
    
      var prevnonce = new Buffer([0, 0, 0, 0, 0, 0, 0, 1]);
      opts = {prevnonce: prevnonce};
      var decoded = Message.decode(key2, encoded, opts);
      var payload = decoded.payload;
      payload.toString('hex').should.equal(messagehex);
    });

    it('should decode an encoded message with proper prevnonce - for first part', function() {
      var message = new Buffer('message');
      var messagehex = message.toString('hex');
      var nonce = new Buffer([0, 0, 0, 2, 0, 0, 0, 0]);
      var opts = {nonce: nonce};
      var encoded = Message.encode(key2.public, key, message, opts);
    
      var prevnonce = new Buffer([0, 0, 0, 1, 0, 0, 0, 0]);
      opts = {prevnonce: prevnonce};
      var decoded = Message.decode(key2, encoded, opts);
      var payload = decoded.payload;
      payload.toString('hex').should.equal(messagehex);
    });

    it('should fail if prevnonce is too high', function() {
      var message = new Buffer('message');
      var messagehex = message.toString('hex');
      var nonce = new Buffer([0, 0, 0, 0, 0, 0, 0, 1]);
      var opts = {nonce: nonce};
      var encoded = Message.encode(key2.public, key, message, opts);
    
      var prevnonce = new Buffer([0, 0, 0, 0, 0, 0, 0, 1]);
      opts = {prevnonce: prevnonce};
      (function() {Message.decode(key2, encoded, opts)}).should.throw('Nonce not equal to zero and not greater than the previous nonce');
    });

    it('should fail if prevnonce is too high - for first part', function() {
      var message = new Buffer('message');
      var messagehex = message.toString('hex');
      var nonce = new Buffer([0, 0, 0, 1, 0, 0, 0, 0]);
      var opts = {nonce: nonce};
      var encoded = Message.encode(key2.public, key, message, opts);
    
      var prevnonce = new Buffer([0, 0, 0, 1, 0, 0, 0, 0]);
      opts = {prevnonce: prevnonce};
      (function() {Message.decode(key2, encoded, opts)}).should.throw('Nonce not equal to zero and not greater than the previous nonce');
    });

    it('should fail if the version number is incorrect', function() {
      var payload = new Buffer('message');
      var fromkey = key;
      var topubkey = key2.public;
      var version1 = new Buffer([2]);
      var version2 = new Buffer([0]);
      var nonce = new Buffer([0, 0, 0, 0, 0, 0, 0, 0]);
      var toencrypt = Buffer.concat([version1, version2, nonce, payload]);
      var encrypted = Message._encrypt(topubkey, toencrypt);
      var sig = Message._sign(fromkey, encrypted);
      var encoded = {
        pubkey: fromkey.public.toString('hex'),
        sig: sig.toString('hex'),
        encrypted: encrypted.toString('hex')
      };
    
      (function() {Message.decode(key2, encoded);}).should.throw('Invalid version number');
    });

  });

  describe('#_encrypt', function() {
    
    it('should encrypt data', function() {
      var payload = new Buffer('payload');
      var encrypted = Message._encrypt(key.public, payload);
      encrypted.length.should.equal(129);
    });

  });

  describe('#_decrypt', function() {
    var payload = new Buffer('payload');
    var payloadhex = payload.toString('hex');
    
    it('should decrypt encrypted data', function() {
      var encrypted = Message._encrypt(key.public, payload);
      var decrypted = Message._decrypt(key.private, encrypted);
      decrypted.toString('hex').should.equal(payloadhex);
    });

  });

  describe('#_sign', function() {
    
    it('should sign data', function() {
      var payload = new Buffer('payload');
      var sig = Message._sign(key, payload);
      sig.length.should.be.greaterThan(60);
    });

  });

  describe('#_verify', function() {
    var payload = new Buffer('payload');
    var sig = Message._sign(key, payload);
    
    it('should verify signed data', function() {
      Message._verify(key.public, sig, payload).should.equal(true);
    });

  });

});
