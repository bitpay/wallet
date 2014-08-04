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
      }).should.throw('no inputChainPaths');

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
    var validScriptSig = new bitcore.Script(FakeBuilder.VALID_SCRIPTSIG_BUF);

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
      var ret = TxProposal._verifySignatures(keyBuf, validScriptSig, new Buffer(32));
      ret.length.should.equal(0);
    });
    it('#_verifyScriptSig, two signatures', function() {
      // Data taken from bitcore's TransactionBuilder test
      var txp = dummyProposal;
      var tx = dummyProposal.builder.build();
      var ret = TxProposal._verifySignatures(pubkeys, validScriptSig, tx.hashForSignature());
      ret.should.deep.equal([0, 3]);
    });
    it('#_infoFromRedeemScript', function() {
      var info = TxProposal._infoFromRedeemScript(validScriptSig);
      var keys = info.keys;
      keys.length.should.equal(5);
      for (var i in keys) {
        keys[i].toString('hex').should.equal(pubkeys[i].toString('hex'));
      }
      Buffer.isBuffer(info.script.getBuffer()).should.equal(true);
    });
    it('#_updateSignedBy', function() {
      var txp = dummyProposal;
      txp._inputSignatures.should.deep.equal([
        ['03197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d', '03a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e3']
      ]);
    });
    describe('#_check', function() {
      var txp = dummyProposal;
      var backup = txp.builder.tx.ins;

      it('OK', function() {
        txp._check();
      });
      it('FAIL ins', function() {
        txp.builder.tx.ins = [];
        (function() {
          txp._check();
        }).should.throw('no ins');
        txp.builder.tx.ins = backup;
      });
      it('FAIL signhash SINGLE', function() {
        sinon.stub(txp.builder.tx, 'getHashType').returns(Transaction.SIGHASH_SINGLE);
        (function() {
          txp._check();
        }).should.throw('signatures');
        txp.builder.tx.getHashType.restore();
      });
      it('FAIL signhash NONE', function() {
        sinon.stub(txp.builder.tx, 'getHashType').returns(Transaction.SIGHASH_NONE);
        (function() {
          txp._check();
        }).should.throw('signatures');
        txp.builder.tx.getHashType.restore();
      });
      it('FAIL signhash ANYONECANPAY', function() {
        sinon.stub(txp.builder.tx, 'getHashType').returns(Transaction.SIGHASH_ANYONECANPAY);
        (function() {
          txp._check();
        }).should.throw('signatures');
        txp.builder.tx.getHashType.restore();
      });
      it('FAIL no signatures', function() {
        var backup = txp.builder.tx.ins[0].s;
        txp.builder.tx.ins[0].s = undefined;
        (function() {
          txp._check();
        }).should.throw('no signatures');
        txp.builder.tx.ins[0].s = backup;
      });
    });
    describe('#merge', function() {
      var txp = dummyProposal;
      var backup = txp.builder.tx.ins;
      it('with self', function() {
        var hasChanged = txp.merge(txp);
        hasChanged.should.equal(false);
      });

      it('with less signatures', function() {
        var backup = txp.builder.vanilla.scriptSig[0];
        txp.builder.merge = function() {
          // 3 signatures.
          this.vanilla.scriptSig = ['0048304502207d8e832bd576c93300e53ab6cbd68641961bec60690c358fd42d8e42b7d7d687022100a1daa89923efdb4c9b615d065058d9e1644f67000694a7d0806759afa7bef19b014cad532103197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d210380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127210392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed032103a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e32103e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e455ae'];
          this.tx.ins[0].s = new Buffer(this.vanilla.scriptSig[0], 'hex');
        };
        var hasChanged = txp.merge(txp);
        hasChanged.should.equal(true);

        txp.builder.vanilla.scriptSig = [backup];
        txp.builder.tx.ins[0].s = new Buffer(backup, 'hex');
      });


      it('with more signatures', function() {
        txp.builder.merge = function() {
          // 3 signatures.
          this.vanilla.scriptSig = ['00483045022100f75bd3eb92d8c9be9a94d848bbd1985fc0eaf4c47fb470a0b222881802a1f03802204eb239ae3082779b1ec4f2e69baa0362494071e707e1696c14ad23c8f2e184e20148304502201981482db0f369ce943293b6fec06a0347918663c766a79d4cbd0457801768d1022100aedf8d7c51d55a9ddbdcc0067ed6b648b77ce9660447bbcf4e2c209698efa0a30148304502203f0ddad47757f8705cb40e7c706590d2e2028a7027ffdb26dd208fd6155e0d28022100ccd206f9b969ab7f88ee4c5c6cee48c800a62dda024c5a8de7eb8612b833a0c0014cad532103197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d210380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127210392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed032103a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e32103e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e455ae'];
          this.tx.ins[0].s = new Buffer(this.vanilla.scriptSig[0], 'hex');
        };
        var hasChanged = txp.merge(txp);
        hasChanged.should.equal(true);
      });
    });
    describe('#setCopayers', function() {
      it("should fails if Tx has no creator", function() {
        var txp = dummyProposal;
        txp.signedBy = {
          'hugo': 1
        };
        delete txp['creator'];
        (function() {
          txp.setCopayers('juan', {
            pk1: 'pepe'
          })
        }).should.throw('no creator');
      });
      it("should fails if Tx is not signed by creator", function() {
        var txp = dummyProposal;
        txp.creator = 'creator';
        txp.signedBy = {
          'hugo': 1
        };
        txp._inputSignatures = [
          ['pkX']
        ];
        (function() {
          txp.setCopayers('juan', {
            pk1: 'pepe'
          })
        }).should.throw('creator');
      });


      it("should fails if Tx has unmapped signatures", function() {
        var txp = dummyProposal;
        txp.creator = 'creator';
        txp.signedBy = {
          creator: 1
        };
        txp._inputSignatures = [
          ['pk0', 'pkX']
        ];
        (function() {
          txp.setCopayers('juan', {
            pk1: 'pepe'
          })
        }).should.throw('unknown sig');
      });

      it("should be signed by sender", function() {
        var txp = dummyProposal;
        var ts = Date.now();
        txp._inputSignatures = [
          ['pk1', 'pk0']
        ];
        txp.signedBy = {
          'creator': Date.now()
        };
        (function() {
          txp.setCopayers('juan', {
            pk0: 'creator',
            pk1: 'pepe',
            pk2: 'john'
          })
        }).should.throw('senders sig');
      });


      it("should set signedBy (trivial case)", function() {
        var txp = dummyProposal;
        var ts = Date.now();
        txp._inputSignatures = [
          ['pk1', 'pk0']
        ];
        txp.signedBy = {
          'creator': Date.now()
        };
        txp.setCopayers('pepe', {
          pk0: 'creator',
          pk1: 'pepe',
          pk2: 'john'
        })
        Object.keys(txp.signedBy).length.should.equal(2);
        txp.signedBy['pepe'].should.gte(ts);
        txp.signedBy['creator'].should.gte(ts);
      });
      it("should assign creator", function() {
        var txp = dummyProposal;
        var ts = Date.now();
        txp._inputSignatures = [
          ['pk0']
        ];
        txp.signedBy = {};
        delete txp['creator'];
        delete txp['creatorTs'];
        txp.setCopayers('creator', {
          pk0: 'creator',
          pk1: 'pepe',
          pk2: 'john'
        })
        Object.keys(txp.signedBy).length.should.equal(1);
        txp.creator.should.equal('creator');
        txp.createdTs.should.gte(ts);
        txp.seenBy['creator'].should.equal(txp.createdTs);
      })
      it("New tx should have only 1 signature", function() {
        var txp = dummyProposal;
        var ts = Date.now();
        txp.signedBy = {};
        delete txp['creator'];
        delete txp['creatorTs'];
        txp._inputSignatures = [
          ['pk0', 'pk1']
        ];
        (function() {
          txp.setCopayers(
            'creator', {
            pk0: 'creator',
            pk1: 'pepe',
            pk2: 'john'
          }, {
            'creator2': 1
          }
          );
        }).should.throw('only 1');
      })

      it("if signed, should not change ts", function() {
        var txp = dummyProposal;
        var ts = Date.now();
        txp._inputSignatures = [
          ['pk0', 'pk1']
        ];
        txp.creator = 'creator';
        txp.signedBy = {
          'creator': 1
        };
        txp.setCopayers('pepe', {
          pk0: 'creator',
          pk1: 'pepe',
          pk2: 'john'
        })
        Object.keys(txp.signedBy).length.should.equal(2);
        txp.creator.should.equal('creator');
        txp.signedBy['creator'].should.equal(1);
        txp.signedBy['pepe'].should.gte(ts);
      })
    });

  });
});
