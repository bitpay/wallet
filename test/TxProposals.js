'use strict';

var Transaction = bitcore.Transaction;
var WalletKey = bitcore.WalletKey;
var Key = bitcore.Key;
var bignum = bitcore.Bignum;
var Script = bitcore.Script;
var TransactionBuilder = bitcore.TransactionBuilder;
var util = bitcore.util;
var networks = bitcore.networks;

var TxProposal = copay.TxProposal;
var TxProposals = copay.TxProposals;
var moment = moment || require('moment');

var dummyProposal = new TxProposal({
  creator: 1,
  createdTs: 1,
  builder: {
    toObj: sinon.stub().returns({}),
  },
  inputChainPaths: ['m/1'],
});

var someKeys = ["03b39d61dc9a504b13ae480049c140dcffa23a6cc9c09d12d6d1f332fee5e18ca5", "022929f515c5cf967474322468c3bd945bb6f281225b2c884b465680ef3052c07e"];

describe('TxProposals', function() {
  describe('constructor', function() {
    it('should create an instance', function() {
      var txps = new TxProposals();
      should.exist(txps);
      txps.network.name.should.equal('testnet');
    });
  });
  describe('#fromObj', function() {
    it('should create an instance from an Object', function() {
      var txps = TxProposals.fromObj({
        networkName: 'livenet',
        walletId: '123a12',
        txps: [],
      });
      should.exist(txps);
      txps.network.name.should.equal('livenet');
    });
    it('should skip Objects with errors', function() {
      var txps = TxProposals.fromObj({
        networkName: 'livenet',
        walletId: '123a12',
        txps: [{
          a: 1
        }],
      });
      should.exist(txps);
      Object.keys(txps.txps).length.should.equal(0);
    });
  });
  describe('#length', function() {
    it('should return length', function() {
      var txps = new TxProposals();
      txps.txps = {
        a: 1,
        b: 2
      };
      txps.length().should.equal(2);
    });
  });
  describe('#getNtxidsSince', function() {
    it('should throw illegal argument', function() {
      var txps = new TxProposals();
      txps.txps = {
        a: 1,
        b: 2
      };
      (function() {
        txps.getNtxidsSince()
      }).should.throw('Illegal Argument');
    });
    it('should return keys since a date', function() {
      var today = moment().toDate();
      var today_plus_1 = moment().add(1, 'day').toDate();
      var today_plus_2 = moment().add(2, 'day').toDate();
      var today_plus_3 = moment().add(3, 'day').toDate();

      var txps = new TxProposals();
      txps.txps = [{
        id: 1,
        createdTs: today
      }, {
        id: 2,
        createdTs: today_plus_1
      }, {
        id: 3,
        createdTs: today_plus_2
      }];

      txps.getNtxidsSince(today).length.should.be.equal(3);
      txps.getNtxidsSince(today_plus_1).length.should.be.equal(2);
      txps.getNtxidsSince(today_plus_2).length.should.be.equal(1);
      txps.getNtxidsSince(today_plus_3).length.should.be.equal(0);

    });
  });
  describe('#getNtxids', function() {
    it('should return keys', function() {
      var txps = new TxProposals();
      txps.txps = {
        a: 1,
        b: 2
      };
      txps.getNtxids().should.deep.equal(['a', 'b']);
    });
  });
  describe('#deleteOne', function() {
    it('should delete specified ntxid', function() {
      var txps = new TxProposals();
      txps.txps = {
        a: 1,
        b: 2
      };
      txps.deleteOne('a');
      txps.getNtxids().should.deep.equal(['b']);
    });
    it('should fail on non-existent ntxid', function() {
      var txps = new TxProposals();
      txps.txps = {
        a: 1,
        b: 2
      };
      (function() {
        txps.deleteOne('c');
      }).should.throw('Unknown TXP: c');
    });
  });
  describe('#toObj', function() {
    it('should an object', function() {
      var txps = TxProposals.fromObj({
        networkName: 'livenet',
        walletId: '123a12',
        txps: [],
      });
      var o = txps.toObj();
      o.walletId.should.equal('123a12');
      o.networkName.should.equal('livenet');
    });
    it('should export txps', function() {
      var txps = TxProposals.fromObj({
        networkName: 'livenet',
        walletId: '123a12',
        txps: [],
      });
      txps.txps = {
        'hola': dummyProposal,
        'chau': dummyProposal,
      };
      var o = txps.toObj();
      o.txps.length.should.equal(2);
    });
    it('should filter sent txp', function() {
      var txps = TxProposals.fromObj({
        networkName: 'livenet',
        walletId: '123a12',
        txps: [],
      });
      var d = JSON.parse(JSON.stringify(dummyProposal));
      d.sent = 1;
      txps.txps = {
        'hola': dummyProposal,
        'chau': d,
      };
      var o = txps.toObj();
      o.txps.length.should.equal(1);
    });
  });
  describe.skip('#merge', function() {
    it('should merge', function() {
      var txps = new TxProposals();
      var d = dummyProposal;
      txps.merge(d.toObj(), {});
    });
  });
});
