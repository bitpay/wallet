'use strict';

var FakeSocket = requireMock('FakeBlockchainSocket');

var Buffer = bitcore.Buffer;
var Insight = copay.Insight;

var ADDRESSES = [
  '2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM',
  '2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb', // 41btc
  '2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x', // 50btc
  '2NBEAi14f3xhwmGs9omEgKUwsW84BkzLp7S',
  '2N3RhiBW4ssXJnEbPjBCYThJHhEHQWAapf6',
  '2Mvn2Duvw8cdHs5AB8ZLXfoef1a71UrDr4W',
  '2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY',
  '2N9EdxU3co5XKTyj3yhFBeU3qw3EM1rrgzE'
];

var UNSPENT = [{
  address: "2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb",
  txid: "d5597c6cf7f72507af63a4d5a2f9f84edb45fb42452cc8c514435b7a93158915",
  vout: 0,
  ts: 1397050347,
  scriptPubKey: "a914e54f125244a0bf91f9c5d861dc28343ccf19883d87",
  amount: 41,
  confirmations: 7007
}, {
  address: "2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x",
  txid: "90d0e1f993fc41596e7b0a7a3be8ef65d606164e13ce538bd3f48136b60eff5a",
  vout: 0,
  ts: 1397070106,
  scriptPubKey: "a914af1a2d1a9c0fa172ed70bc1c50ea6b66994e9abf87",
  amount: 50,
  confirmations: 6728
}];

var FAKE_OPTS = {
  url: 'http://something.com:123',
}

describe('Insight model', function() {

  before(function() {
    sinon.stub(Insight.prototype, "_getSocketIO", function() {
      return new FakeSocket();
    });
  });

  after(function() {
    Insight.prototype._getSocketIO.restore();
  });

  it('should create an instance', function() {
    var blockchain = new Insight(FAKE_OPTS);
    should.exist(blockchain);
    blockchain.url.should.be.equal('http://something.com:123');
  });

  it('should subscribe to inventory', function(done) {
    var blockchain = new Insight(FAKE_OPTS);
    var socket = blockchain.getSocket();
    var emitSpy = sinon.spy(socket, 'emit');
    blockchain.on('connect', function() {
      emitSpy.calledWith('subscribe', 'inv');
      done();
    });
  });

  it('should be able to destroy the instance', function(done) {
    var blockchain = new Insight(FAKE_OPTS);
    blockchain.status.should.be.equal('disconnected');
    var socket = blockchain.getSocket();
    blockchain.on('connect', function() {
      blockchain.subscribe('mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
      Object.keys(blockchain.getSubscriptions()).length.should.equal(1);
      blockchain.destroy();
      Object.keys(blockchain.getSubscriptions()).length.should.equal(0);
      blockchain.status.should.be.equal('destroyed');
      done();
    });
  });

  it('should subscribe to an address', function() {
    var blockchain = new Insight(FAKE_OPTS);
    var socket = blockchain.getSocket();
    var emitSpy = sinon.spy(socket, 'emit');

    blockchain.subscribe('mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
    Object.keys(blockchain.getSubscriptions()).length.should.equal(1);
    emitSpy.calledWith('subscribe', 'mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
  });

  it('should subscribe to an address once', function() {
    var blockchain = new Insight(FAKE_OPTS);

    blockchain.subscribe('mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
    blockchain.subscribe('mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
    Object.keys(blockchain.getSubscriptions()).length.should.equal(1);
  });

  it('should subscribe to a list of addresses', function() {
    var blockchain = new Insight(FAKE_OPTS);
    var socket = blockchain.getSocket();
    var emitSpy = sinon.spy(socket, 'emit');

    blockchain.subscribe([
      'mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM',
      '2NBBHBjB5sd7HFqKtout1L7d6dPhwJgP2j8'
    ]);
    Object.keys(blockchain.getSubscriptions()).length.should.equal(2);
    emitSpy.calledWith('subscribe', 'mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
    emitSpy.calledWith('subscribe', '2NBBHBjB5sd7HFqKtout1L7d6dPhwJgP2j8');
  });

  it('should resubscribe to all addresses', function() {
    var blockchain = new Insight(FAKE_OPTS);
    blockchain.subscribe('mg7UbtKgMvWAixTNMbC8soyUnwFk1qxEuM');
    blockchain.subscribe('2NBBHBjB5sd7HFqKtout1L7d6dPhwJgP2j8');
    Object.keys(blockchain.getSubscriptions()).length.should.equal(2);

    blockchain.reSubscribe();
    Object.keys(blockchain.getSubscriptions()).length.should.equal(2);
  });

  it('should broadcast a raw transaction', function(done) {
    var blockchain = new Insight(FAKE_OPTS);
    var rawtx = '01000000010c2a03ed71ee18148e8c99c5ff66d5ffb75e5def46cdea2acc6f30103f33bfb5010000006a47304402207f960aeefdfad270dd77d1acca7af17d3a2e47e2059034ff5d6305cf63635e1d02202f061ee196cc4459cdecae6559beac696a9ecde9a17520849f319fa2a627e64f012103870465f9b4efb90b5d186a7a5eacd7081e601020dacd68d942e5918a56ed0bfcffffffff02a086010000000000ad532102a9495c64323cd8c3354dbf0b3400d830ee680da493acbccc3c2c356d1b20fabf21028233cf8bc6112ae2c36468bd447732c5586b52e1ba3284a2319cadfac6367f99210279fd856e5ed13ab6807e85ed7c0cd6f80613be042240fd731c43f5aba3dcae9821021380858a67a4f99eda52ce2d72c300911f9d3eb9d7a45102a2133f14f7b2dc14210215739b613ce42106a11ce433342c13c610bf68a1bc934f607ad7aeb4178e04cf55ae2044d200000000001976a9146917322f0010aaf7ec136a34b476dfc5eb7a331288ac00000000';

    sinon.stub(blockchain, "requestPost", function(url, data, cb) {
      url.should.be.equal('/api/tx/send');
      var res = {
        statusCode: 200
      };
      var body = {
        txid: 1234
      };
      setTimeout(function() {
        cb(null, res, body);
      }, 0);
    });

    blockchain.broadcast(rawtx, function(err, id) {
      id.should.be.equal(1234);
      done();
    });
  });

  describe('getTransaction', function() {
    it('should get a transaction by id', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var txid = '123321';
      var tx = {
        txid: txid,
        more: 'something'
      };

      sinon.stub(blockchain, "request", function(url, cb) {
        url.should.be.equal('/api/tx/' + txid);
        var res = {
          statusCode: 200
        };
        var body = JSON.stringify(tx);
        setTimeout(function() {
          cb(null, res, body);
        }, 0);
      });

      blockchain.getTransaction(txid, function(err, t) {
        chai.expect(err).to.be.null;
        t.should.be.an('object');
        t.txid.should.be.equal(tx.txid);
        t.more.should.be.equal(tx.more);
        done();
      });
    });

    it('should handle a 404 error code', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var txid = '123321';

      sinon.stub(blockchain, "request", function(url, cb) {
        url.should.be.equal('/api/tx/' + txid);
        var res = {
          statusCode: 404
        };
        var body = '';
        setTimeout(function() {
          cb(null, res, body);
        }, 0);
      });

      blockchain.getTransaction(txid, function(err, t) {
        chai.expect(t).to.be.undefined;
        chai.expect(err).not.be.null;
        done();
      });
    });

    it('should handle a null response', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var txid = '123321';

      sinon.stub(blockchain, "request", function(url, cb) {
        url.should.be.equal('/api/tx/' + txid);
        var res = {
          statusCode: 200
        };
        var body = null;
        setTimeout(function() {
          cb(null, res, body);
        }, 0);
      });

      blockchain.getTransaction(txid, function(err, t) {
        chai.expect(t).to.be.undefined;
        chai.expect(err).not.be.null;
        done();
      });
    });

    it('should handle an empty response', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var txid = '123321';

      sinon.stub(blockchain, "request", function(url, cb) {
        url.should.be.equal('/api/tx/' + txid);
        var res = {
          statusCode: 200
        };
        var body = null;
        setTimeout(function() {
          cb(null, res, body);
        }, 0);
      });

      blockchain.getTransaction(txid, function(err, t) {
        chai.expect(t).to.be.undefined;
        chai.expect(err).not.be.null;
        done();
      });
    });
  });

  it('should get a set of transaction by addresses', function(done) {
    var blockchain = new Insight(FAKE_OPTS);

    sinon.stub(blockchain, "requestPost", function(url, data, cb) {
      url.should.be.equal('/api/addrs/txs?from=0');
      data.addrs.should.be.equal('2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM,2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb');
      setTimeout(function() {
        var res = {
          statusCode: 200
        };
        var body = {
          totalItems: 3,
          items: [1, 2, 3]
        };
        cb(null, res, body);
      }, 0);
    });

    var addresses = ['2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM', '2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb'];
    blockchain.getTransactions(addresses, 0, null, function(err, res) {
      chai.expect(err).to.be.null;
      res.items.length.should.be.equal(3);
      done();
    });
  });

  it('should get a list of unspent output', function(done) {
    var blockchain = new Insight(FAKE_OPTS);

    sinon.stub(blockchain, "requestPost", function(url, data, cb) {
      url.should.be.equal('/api/addrs/utxo');
      data.addrs.should.be.equal('2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM,2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb,2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x');
      setTimeout(function() {
        var res = {
          statusCode: 200
        };
        var body = UNSPENT;
        cb(null, res, body);
      }, 0);
    });

    blockchain.getUnspent(ADDRESSES.slice(0, 3), function(err, unspent) {
      chai.expect(err).to.be.null;
      unspent.length.should.be.equal(2);
      unspent[0].address.should.be.equal('2NE9hTCffeugo5gQtfB4owq98gyTeWC56yb');
      unspent[1].address.should.be.equal('2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x');
      done();
    });
  });

  describe('getActivity', function() {
    it('should get activity for an innactive address', function(done) {
      var blockchain = new Insight(FAKE_OPTS);

      sinon.stub(blockchain, "getTransactions", function(addresses, from, to, cb) {
        cb(null, []);
      });

      blockchain.getActivity(ADDRESSES, function(err, actives) {
        chai.expect(err).to.be.null;
        actives.length.should.equal(ADDRESSES.length);
        actives.filter(function(i) {
          return i
        }).length.should.equal(0);
        done();
      });
    });

    it('should get activity for active addresses', function(done) {
      var blockchain = new Insight(FAKE_OPTS);

      sinon.stub(blockchain, "getTransactions", function(addresses, from, to, cb) {
        cb(null, [{
          vin: [{
            addr: '2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM'
          }],
          vout: []
        }, {
          vin: [{
            addr: '2NATQJnaQe2CUKLyhL1zdNkttJM1dUH9HaM'
          }],
          vout: []
        }, {
          vin: [{
            addr: '2N9D5bcCQ2bPWUDByQ6Qb5bMgMtgsk1rw3x'
          }],
          vout: []
        }, {
          vin: [],
          vout: [{
            scriptPubKey: {
              addresses: ['2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY']
            }
          }]
        }]);
      });

      blockchain.getActivity(ADDRESSES, function(err, actives) {
        chai.expect(err).to.be.null;
        actives.length.should.equal(ADDRESSES.length);
        actives.filter(function(i) {
          return i
        }).length.should.equal(3);
        done();
      });
    });
  });

  describe('Events', function() {
    it('should emit event on a new block', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var socket = blockchain.getSocket();
      blockchain.on('connect', function() {
        var socket = blockchain.getSocket();
        socket.emit('block', '12312312');
      });

      blockchain.on('block', function(blockid) {
        blockid.should.be.equal('12312312');
        done();
      });
    });

    it('should emit event on a transaction for subscribed addresses', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var socket = blockchain.getSocket();
      blockchain.subscribe('2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY');
      blockchain.on('connect', function() {
        var socket = blockchain.getSocket();
        socket.emit('2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY', '1123');
      });

      blockchain.on('tx', function(ev) {
        ev.address.should.be.equal('2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY');
        ev.txid.should.be.equal('1123');
        done();
      });
    });

    it('should\'t emit event on a transaction for non subscribed addresses', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var socket = blockchain.getSocket();
      blockchain.on('connect', function() {
        var socket = blockchain.getSocket();
        socket.emit('2NFjCBFZSsxiwWAD7CKQ3hzWFtf9DcqTucY', '1123');
        setTimeout(function() {
          done();
        }, 20);
      });

      blockchain.on('tx', function(ev) {
        throw Error('should not call this event!');
      });
    });

    it('should emit event on connection', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var socket = blockchain.getSocket();
      blockchain.on('connect', function() {
        done();
      });
    });

    it('should emit event on disconnection', function(done) {
      var blockchain = new Insight(FAKE_OPTS);
      var socket = blockchain.getSocket();
      blockchain.on('connect', function() {
        var socket = blockchain.getSocket();
        socket.emit('connect_error');
      });
      blockchain.on('disconnect', function() {
        done();
      });
    });
  });
  describe('setCompleteUrl', function() {
    it('should check setCompleteUrl', function() {
      var url;
      expect(Insight.setCompleteUrl(url)).to.be.undefined;
      url = '';
      Insight.setCompleteUrl(url).should.be.equal(url);
      url = 'http://mydomain.com';
      Insight.setCompleteUrl(url).should.be.equal('http://mydomain.com:80');
      url = 'https://mydomain.com';
      Insight.setCompleteUrl(url).should.be.equal('https://mydomain.com:443');
    });
  });

});
