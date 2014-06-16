'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var expect         = chai.expect;
var sinon          = sinon || require('sinon');
var bitcore        = bitcore || require('bitcore');
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

  describe('#_encrypt', function() {

    it('should encrypt data successfully', function() {
      var n = new WebRTC();
      var data = new bitcore.Buffer('my data to encrypt');
      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();
      var encrypted = n._encrypt(key.public, data);
      encrypted.length.should.not.equal(0);
      encrypted.length.should.equal(145);
    });

  });

  describe('#_decrypt', function() {

    it('should decrypt that which was encrypted', function() {
      var n = new WebRTC();
      var data = new bitcore.Buffer('my data to encrypt');
      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();
      var encrypted = n._encrypt(key.public, data);
      var decrypted = n._decrypt(key.private, encrypted);
      encrypted.length.should.not.equal(0);
      decrypted.toString().should.equal('my data to encrypt');
    });

  });

  describe('#send', function() {

    it('should call _sendToOne for a copayer', function(done) {
      var n = new WebRTC();

      var data = new bitcore.Buffer('my data to send');

      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();

      var copayerId = key.public.toString('hex');
      n._sendToOne = function(a1, a2, a3, cb) {cb();};
      var sig = undefined;
      n.send(copayerId, data, function() {
        done();
      });

    });

    it('should call _sendToOne for a list of copayers', function(done) {
      var n = new WebRTC();

      var data = new bitcore.Buffer('my data to send');

      var privkeystr = new bitcore.Buffer('test privkey');
      var privkey = bitcore.util.sha256(privkeystr);
      var key = new bitcore.Key();
      key.private = privkey;
      key.regenerateSync();

      var copayerIds = [key.public.toString('hex')];
      n._sendToOne = function(a1, a2, a3, cb) {cb();};
      var sig = undefined;
      n.send(copayerIds, data, function() {
        done();
      });

    });
  });

});
