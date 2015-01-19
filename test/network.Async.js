'use strict';

var Async = copay.Async;
var EventEmitter = require('events').EventEmitter;

describe('Network / Async', function() {


  var createN = function(pk) {
    var n = new Async({
      url: 'http://insight.example.com:1234'
    });
    var fakeSocket = {};
    fakeSocket.emit = function() {};
    fakeSocket.on = function() {};
    fakeSocket.disconnect = function() {};
    fakeSocket.removeAllListeners = function() {};
    n.createSocket = function() {
      return fakeSocket;
    };
    var opts = {
      copayerId: '03b51d01d798522cf61211b4dfcdd6db219ee33cf166e1cb7f43d836ab00ccddee',
      privkey: pk || '31701118abde096d166607115ed00ce74a2231f68f43144406c863f5ebf06c32',
      lastTimestamp: 1,
    };
    n.secretNumber = 'mySecret';
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

    it('should be able to broadcast', function() {
      var n = createN('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
      var spy = sinon.spy();
      var dummy = {
        dummy: true
      };
      n.send(null, dummy, spy);
      spy.calledOnce.should.be.true;
    });
    it('should call _sendToOne for a copayer', function(done) {
      var n = createN('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
      var data = 'my data to send';

      var copayerId = '03b51d01d798522cf61211b4dfcdd6d01020304cf166e1cb7f43d836abc5c18b23';
      n._sendToOne = function(a, b, cb) {
        cb();
      };
      var opts = {};
      n.send(copayerId, data, done);

    });

    it('should call _sendToOne with encrypted data for a copayer', function(done) {
      var n = createN('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
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
      var n = createN('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
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
    var pk1 = 'fb23b9074ca5e7163719b86b41c7ce8348cf3d2839bb5f6125ef6efd5d40d7d3';
    var cid1 = '0311a10109320efb3646c832d3e140c6d9c4f69b16e73fc3f0c23b3d014ec77828';

    var pk2 = '89073fe4d3fdef2c5f2909bcda92e4470633f08640d1a62acc464327d611577e';
    var cid2 = '03ceefb9dbcf7410411e5c1268d9d8e850ffd3a55da764a8377f3212571a52c01b';

    var pk3 = 'a2ae2c7029c6a4136d7fe60c4d078a2e9d5af8a246bf2d5fee3410e273a5d430';
    var cid3 = '034d3dd2054234737c1cff9d973c9c7e0fb5902c8e56c9d57a699b7842cedfe984';

    it('should not reject data sent from a peer with hijacked pubkey', function() {
      var n1 = createN(pk1);
      var n2 = createN(pk2);
      n2._deletePeer = sinon.spy();

      var message = {
        type: 'hello',
        copayerId: cid1,
        secretNumber: 'mySecret'
      };
      var enc = n1.encode(cid2, message);
      n2._onMessage(enc);
      n2._deletePeer.calledOnce.should.equal(false);
    });

    it('should reject data sent from a peer with hijacked pubkey', function() {
      var n = createN(pk2);

      var message = {
        type: 'hello',
        copayerId: cid3, // MITM
        secretNumber: 'mySecret'
      };

      var enc = n.encode(cid2, message);

      n._deletePeer = sinon.spy();

      n._onMessage(enc);
      n._deletePeer.calledOnce.should.equal(true);
      n._deletePeer.getCall(0).args[1].should.equal('incorrect pubkey for peerId');
    });

    it('should not reject data sent from a peer with no previously set nonce but who is setting one now', function() {
      var n1 = createN(pk1);
      var n2 = createN(pk2);
      n2._deletePeer = sinon.spy();

      var message = {
        type: 'hello',
        copayerId: cid1,
        secretNumber: 'mySecret'
      };
      var nonce = new Buffer('0000000000000001', 'hex');
      var enc = n1.encode(cid2, message, nonce);
      n2._onMessage(enc);
      n2._deletePeer.calledOnce.should.equal(false);
      n2.getHexNonces()[cid1].toString('hex').should.equal('0000000000000001');
    });

    it('should not reject data sent from a peer with a really big new nonce', function() {
      var n1 = createN(pk1);
      var n2 = createN(pk2);
      n2._deletePeer = sinon.spy();

      var message = {
        type: 'hello',
        copayerId: cid1,
        secretNumber: 'mySecret'
      };
      n2.networkNonces = {};
      n2.networkNonces[cid1] = new Buffer('5000000000000001', 'hex');
      var nonce = new Buffer('5000000000000002', 'hex')
      var enc = n1.encode(cid2, message, nonce);
      n2._onMessage(enc);
      n2._deletePeer.calledOnce.should.equal(false);
      n2.getHexNonces()[cid1].toString('hex').should.equal('5000000000000002');
      n2._deletePeer.calledOnce.should.equal(false);
    });

    it('should reject data sent from a peer with an outdated nonce', function() {
      var n1 = createN(pk1);
      var n2 = createN(pk2);
      n2._deletePeer = sinon.spy();

      var message = {
        type: 'hello',
        copayerId: cid1,
        secretNumber: 'mySecret'
      };
      n2.networkNonces = {};
      n2.networkNonces[cid1] = new Buffer('0000000000000002', 'hex');
      var nonce = new Buffer('0000000000000001', 'hex');
      var enc = n1.encode(cid2, message, nonce);
      n2._onMessage(enc);
      n2._deletePeer.calledOnce.should.equal(true);
    });

    it('should accept join with a correct secret number', function() {
      var n1 = createN(pk1);
      var n2 = createN(pk2);
      n2._deletePeer = sinon.spy();

      var message = {
        type: 'hello',
        copayerId: cid1,
        secretNumber: 'mySecret'
      };

      var enc = n1.encode(cid2, message);
      n2._onMessage(enc);
      n2._deletePeer.calledOnce.should.equal(false);

    });

    it('should reject join with a incorrect secret number', function() {
      var n1 = createN(pk1);
      var n2 = createN(pk2);
      n2._deletePeer = sinon.spy();

      var message = {
        type: 'hello',
        copayerId: cid1,
        secretNumber: 'otherSecret'
      };

      var enc = n1.encode(cid2, message);
      n2._onMessage(enc);
      n2._deletePeer.calledOnce.should.equal(true);

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

    it('should return an error', function() {
      var hex = '0000';
      var n = createN();
      (function() {
        n.setHexNonce(hex);
      }).should.throw('incorrect length');
    });

    it('should iterateNonce', function() {
      var n = createN();
      n.iterateNonce = sinon.spy();
      n.setHexNonce();
      n.iterateNonce.callCount.should.be.equal(1);
      n.setHexNonce(null);
      n.iterateNonce.callCount.should.be.equal(2);
      n.setHexNonce(undefined);
      n.iterateNonce.callCount.should.be.equal(3);

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

  describe('#_arrayRemove', function() {
    it('should remove an element from an array', function() {
      var array = ['1', '2', '3', '4'];
      array = Async._arrayRemove('2', array);
      array.length.should.be.equal(3);
      array.indexOf('2').should.be.equal(-1);
      array = Async._arrayRemove('5', array);
      array.length.should.be.equal(3);
    });
  });

  describe('#getOnlinePeerIDs', function() {
    it('should get peer ids that are online', function() {
      var n = createN();
      n.getOnlinePeerIDs().length.should.be.equal(0);
      n._addCopayer('ab0001');
      n.getOnlinePeerIDs().length.should.be.equal(1);
      n._addCopayer('ab0001');
      n.getOnlinePeerIDs().length.should.be.equal(1);
      n._addCopayer('ab0002');
      n.getOnlinePeerIDs().length.should.be.equal(2);
    });
  });

  describe('#connectedCopayers', function() {
    it('should get peer ids that are online', function() {
      var n = createN();
      n.connectedCopayers().length.should.be.equal(0);
      n._addCopayer('ab0001');
      n.connectedCopayers().length.should.be.equal(1);
      n._addCopayer('ab0001');
      n.connectedCopayers().length.should.be.equal(1);
      n._addCopayer('ab0002');
      n.connectedCopayers().length.should.be.equal(2);
    });
  });

  describe('#_deletePeer', function() {
    it('should delete a Peer', function() {
      var n = createN();
      n._addCopayer('ab0001');
      n.connectedPeers.length.should.be.equal(1);
      var peerId = n.connectedPeers[0];
      n._deletePeer(peerId);
      n.connectedPeers.length.should.be.equal(0);
    });
  });

  describe('#getCopayerIds', function() {
    it('should return the copayer ids', function() {
      var n = createN();
      n.getCopayerIds().length.should.be.equal(1);
    });
  });

  describe('#isOnline', function() {
    it('should return if is online', function() {
      var n = createN();
      n.isOnline().should.be.true;
      n.cleanUp();
      n.isOnline().should.be.false;
    });
  });

  describe('#greet', function() {
    it('should greet ', function() {
      var n = createN();
      n.greet('03b51d01d798522cf61211b4dfcdd6db219ee33cf166e1cb7f43d836ab00ccddee', 'mySecret');
    });
  });

  describe('#setCopayers', function() {
    it('should setCopayers ', function() {
      var n = createN();
      n.connectedPeers.length.should.be.equal(0);
      var cids = ['abc001', 'abc002'];
      n.setCopayers(cids);
      n.connectedPeers.length.should.be.equal(2);
    });
  });


  describe('#lockIncommingConnections', function() {
    it('should lock Incomming Connections ', function() {
      var n = createN();
      var cids = ['abc001', 'abc002', 'abc003'];
      n.setCopayers(cids);

      var lockIds = ['abc001', 'abc002'];
      n.lockIncommingConnections(lockIds);
      console.log(n.allowedCopayerIds);
      Object.keys(n.allowedCopayerIds).length.should.be.equal(2);
    });
  });

  describe('#getKey', function() {
    it('should return the key or generate a new one ', function() {
      var n = createN();
      n.key = null;
      var k1 = n.getKey();
      k1.should.not.be.undefined;
      var k2 = n.getKey();
      k2.should.not.be.undefined;
      k1.should.be.equal(k2);
    });
  });

});
