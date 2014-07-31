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

var dummyProposal = new TxProposal({
  creator: 1,
  createdTs: 1,
  builder: new FakeBuilder(),
  inputChainPaths: ['m/1'],
});

var someKeys = ["03b39d61dc9a504b13ae480049c140dcffa23a6cc9c09d12d6d1f332fee5e18ca5", "022929f515c5cf967474322468c3bd945bb6f281225b2c884b465680ef3052c07e"];

describe('TxProposal', function() {
  describe('new', function() {
    it('should fail to create an instance with wrong arguments', function() {

      (function() {
        var txp = new TxProposal();
      }).should.throw('Illegal Argument');

      (function() {
        var txp = new TxProposal({
          creator: 1
        });
      }).should.throw('Illegal Argument');

    });


    it('should create an instance', function() {
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: new FakeBuilder(),
        inputChainPaths: 'm/1',
      });
      should.exist(txp);

      txp.creator.should.equal(1);
      should.exist(txp.builder);
      txp.inputChainPaths.should.equal('m/1');
    });
  });
  describe('#getId', function() {
    it('should return id', function() {
      var b = new FakeBuilder();
      var spy = sinon.spy(b.tx, 'getNormalizedHash');
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: b,
        inputChainPaths: 'm/1',
      });
      txp.getId().should.equal('123456');;
      sinon.assert.callCount(spy, 1);
    });
  });
  describe('#toObj', function() {
    it('should return an object and remove builder', function() {
      var b = new FakeBuilder();
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: b,
        inputChainPaths: 'm/1',
      });
      var o = txp.toObj();
      should.exist(o);
      o.creator.should.equal(1);
      should.not.exist(o.builder);
      should.exist(o.builderObj);
    });
  });
  describe('#fromObj', function() {
    it.skip('should create from Object', function() {
      var b = new FakeBuilder();
      var txp = TxProposal.fromObj({
        creator: 1,
        createdTs: 1,
        builderObj: b.toObj(),
        inputChainPaths: ['m/1'],
      });
      should.exist(txp);
    });


    it('should fail to create from wrong object', function() {
      var b = new FakeBuilder();
      (function() {
        var txp = TxProposal.fromObj({
          creator: 1,
          createdTs: 1,
          builderObj: b.toObj(),
          inputChainPaths: ['m/1'],
        });
      }).should.throw('Invalid');
    });


  });

  describe('#setSent', function() {
    it('should set txid and timestamp', function() {
      var now = Date.now();
      var txp = dummyProposal;
      txp.setSent('3a42');
      txp.sentTs.should.gte(now);
      txp.sentTxid.should.equal('3a42');
    });
  });


  describe('Signature verification', function() {
    var validScriptSig = new bitcore.Script(new Buffer('00483045022100a35a5cbe37e39caa62bf1c347eae9c72be827c190b31494b184943b3012757a8022008a1ff72a34a5bf2fc955aa5b6f8a4c32cb0fab7e54c212a5f6f645bb95b8ef10149304602210092347916c3c3e6f1692bf9447b973779c28ce9985baaa3940b483af573f464b4022100ab91062796ab8acb32a0fa90e00627db5be77d9722400b3ecfd9c5f34a8092b1014cad532103197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d210380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127210392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed032103a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e32103e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e455ae', 'hex'));

    var pubkeys = [
      '03197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d',
      '0380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127',
      '0392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed03',
      '03a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e3',
      '03e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e4'
    ].map(function(hex) {
      return new Buffer(hex, 'hex');
    });
    var keyBuf = someKeys.map(function(hex) {
      return new Buffer(hex, 'hex');
    });
    it('#_formatKeys', function() {
      (function() {
        TxProposal._formatKeys(someKeys);
      }).should.throw('buffers');
      var res = TxProposal._formatKeys(keyBuf);
    });
    it('#_verifyScriptSig arg checks', function() {
      (function() {
        TxProposal._verifySignatures(
          keyBuf,
          new bitcore.Script(new Buffer('112233', 'hex')),
          new Buffer('1a', 'hex'));
      }).should.throw('script');
    });
    it('#_verifyScriptSig, no signatures', function() {
      var ret = TxProposal._verifySignatures( keyBuf, validScriptSig, new Buffer(32));
      ret.length.should.equal(0);
    });
    it('#_verifyScriptSig, two signatures', function() {
      // Data taken from bitcore's TransactionBuilder test
      var txp = dummyProposal;
      var ret = TxProposal._verifySignatures(pubkeys,validScriptSig, new Buffer('31103626e162f1cbfab6b95b08c9f6e78aae128523261cb37f8dfd4783cb09a7', 'hex'));
      ret.should.deep.equal([0, 3]);
    });
    it('#_keysFromRedeemScript', function() {
      var keys = TxProposal._keysFromRedeemScript(validScriptSig);
      keys.length.should.equal(5);
      for(var i in keys){
        keys[i].toString('hex').should.equal(pubkeys[i].toString('hex'));
      }
    });
  });
});
