'use strict';

var chai = chai || require('chai');
var should = chai.should();
var bitcore = bitcore || require('bitcore');
var Transaction = bitcore.Transaction;
var buffertools = bitcore.buffertools;
var WalletKey = bitcore.WalletKey;
var Key = bitcore.Key;
var bignum = bitcore.Bignum;
var Script = bitcore.Script;
var TransactionBuilder = bitcore.TransactionBuilder;
var util = bitcore.util;
var networks = bitcore.networks;
var sinon = require('sinon');
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}

var FakeBuilder = require('./mocks/FakeBuilder');
var TxProposal = copay.TxProposal;
var TxProposals = copay.TxProposals;

var dummyProposal = new TxProposal({
  creator: 1,
  createdTs: 1,
  builder: new FakeBuilder(),
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
        networkName:'livenet',
        walletId: '123a12',
        txps: [],
      });
      should.exist(txps);
      txps.network.name.should.equal('livenet');
    });
    it('should fail create an instance from an Object with errors', function() {
      (function() {var txps = TxProposals.fromObj({
        networkName:'livenet',
        walletId: '123a12',
        txps: [ { a: 1 }],
      }) }).should.throw('Illegal');
    });
  });
  describe('#getNtxids', function() {
    it('should return keys', function() {
      var txps = new TxProposals();
      txps.txps = {a:1, b:2};
      txps.getNtxids().should.deep.equal(['a','b']);
    });
  });
  describe('#toObj', function() {
    it('should an object', function() {
      var txps = TxProposals.fromObj({
        networkName:'livenet',
        walletId: '123a12',
        txps: [],
      });
      var o = txps.toObj();
      o.walletId.should.equal('123a12');
      o.networkName.should.equal('livenet');
    });
    it('should export txps', function() {
      var txps = TxProposals.fromObj({
        networkName:'livenet',
        walletId: '123a12',
        txps: [],
      });
      txps.txps = {
        'hola' : dummyProposal,
        'chau' : dummyProposal,
      };
      var o = txps.toObj();
      o.txps.length.should.equal(2);
    });
    it('should filter sent txp', function() {
      var txps = TxProposals.fromObj({
        networkName:'livenet',
        walletId: '123a12',
        txps: [],
      });
      var d = JSON.parse(JSON.stringify(dummyProposal));
      d.sent=1;
      txps.txps = {
        'hola' : dummyProposal,
        'chau' : d,
      };
      var o = txps.toObj();
      o.txps.length.should.equal(1);
    });
  });
  describe.skip('#merge', function() {
    it('mergeFromObj', function() {
      var txps = new TxProposals();
      txps.mergeFromObj(dummyProposal.toObj());
    });
  });
});

