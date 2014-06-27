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
      decoded.toString('hex').should.equal(messagehex);
    });

    it('should fail if the version number is incorrect', function() {
      var payload = new Buffer('message');
      var fromkey = key;
      var topubkey = key2.public;
      var version = new Buffer([1]);
      var toencrypt = Buffer.concat([version, payload]);
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
