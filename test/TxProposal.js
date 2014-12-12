'use strict';

var Transaction = bitcore.Transaction;
var WalletKey = bitcore.WalletKey;
var Key = bitcore.Key;
var bignum = bitcore.Bignum;
var Script = bitcore.Script;
var TransactionBuilder = bitcore.TransactionBuilder;
var util = bitcore.util;
var networks = bitcore.networks;
var Buffer = bitcore.Buffer;

var TxProposal = copay.TxProposal;


describe('TxProposal', function() {


  // These 2 signed  the scripts below
  var PUBKEYS = ['03197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d', '03a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e3'];


  // Signatures of the scripts below
  var SIG0 = '304502200708a381dde585ef7fdfaeaeb5da9b451d3e22b01eac8a5e3d03b959e24a7478022100c90e76e423523a54a9e9c43858337ebcef1a539a7fc685c2698dd8648fcf1b9101';
  var SIG1 = '3044022030a77c9613d6ee010717c1abc494668d877e3fa0ae4c520f65cc3b308754c98c02205219d387bcb291bd44805b9468439e4168b02a6a180cdbcc24d84d71d696c1ae01';

  /* decoded redeemscript
   *
    "asm" : "3 03197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d 0380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127 0392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed03 03a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e3 03e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e4 5 OP_CHECKMULTISIG",
   */ 

  // 1,2 signatures  3-5!
  var SCRIPTSIG = _.map([
    '0048304502207d8e832bd576c93300e53ab6cbd68641961bec60690c358fd42d8e42b7d7d687022100a1daa89923efdb4c9b615d065058d9e1644f67000694a7d0806759afa7bef19b014cad532103197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d210380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127210392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed032103a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e32103e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e455ae',
    '0048304502200708a381dde585ef7fdfaeaeb5da9b451d3e22b01eac8a5e3d03b959e24a7478022100c90e76e423523a54a9e9c43858337ebcef1a539a7fc685c2698dd8648fcf1b9101473044022030a77c9613d6ee010717c1abc494668d877e3fa0ae4c520f65cc3b308754c98c02205219d387bcb291bd44805b9468439e4168b02a6a180cdbcc24d84d71d696c1ae014cad532103197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d210380a29968851f93af55e581c43d9ef9294577a439a3ca9fc2bc47d1ca2b3e9127210392dccb2ed470a45984811d6402fdca613c175f8f3e4eb8e2306e8ccd7d0aed032103a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e32103e085eb6fa1f20b2722c16161144314070a2c316a9cae2489fd52ce5f63fff6e455ae'
  ], function(hex) {
    return new Buffer(hex, 'hex');
  });


  var someKeys = ["03b39d61dc9a504b13ae480049c140dcffa23a6cc9c09d12d6d1f332fee5e18ca5", "022929f515c5cf967474322468c3bd945bb6f281225b2c884b465680ef3052c07e"];


  function dummyBuilder(opts) {
    opts = opts || {};

    var index = opts.nsig ? opts.nsig  - 1 : 1;
    var script = SCRIPTSIG[index];

    var aIn = {
      s: script
    };

    var tx = {};
    tx.ins = opts.noins ? [] : [opts.nosigs ? {} : aIn];

    tx.serialize = sinon.stub().returns(new Buffer('1234', 'hex'));
    tx.getSize = sinon.stub().returns(1);
    tx.getHashType = sinon.stub().returns(opts.hashtype || 1);
    tx.getNormalizedHash = sinon.stub().returns('123456');
    tx.hashForSignature = sinon.stub().returns(
      new Buffer('31103626e162f1cbfab6b95b08c9f6e78aae128523261cb37f8dfd4783cb09a7', 'hex'));


    var builder = {};

    builder.opts = opts.opts || {};
    builder.build = sinon.stub().returns(tx)
    builder.toObj = sinon.stub().returns({
      iAmBuilderObj: true,
      version: 1,
      opts: builder.opts,
    });
    builder.isFullySigned = sinon.stub().returns(false);

    builder.vanilla = {
      scriptSig: [SCRIPTSIG[1]],
      outs: JSON.stringify([{
        address: '2NDJbzwzsmRgD2o5HHXPhuq5g6tkKTjYkd6',
        amountSatStr: '123',
      }]),
    };
    builder.inputsSigned =0;

    return builder;
  };

  function dummyProposal(opts) {
    opts = opts || {};

    return new TxProposal({
      creator: 'creator',
      createdTs: 1,
      builder: dummyBuilder(opts),
      inputChainPaths: ['m/1'],
    })
  };



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
        builder: dummyBuilder(),
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
      var b = new dummyBuilder();
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: b,
        inputChainPaths: 'm/1',
      });
      txp.getId().should.equal('123456');;
      sinon.assert.callCount(b.build().getNormalizedHash, 1);
    });
  });
  describe('#toObj', function() {
    it('should return an object and remove builder', function() {
      var b = new dummyBuilder();
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
    it('toObjTrim', function() {
      var b = new dummyBuilder();
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: b,
        inputChainPaths: 'm/1',
        comment: 'hola',
      });
      var o = txp.toObjTrim();
      should.exist(o);
      should.not.exist(o.creator);
      should.not.exist(o.builder);
      should.exist(o.comment);
      should.exist(o.builderObj);
    });

  });
  describe('#fromUntrustedObj', function() {
    it('should fail to create from wrong object', function() {
      var b = new dummyBuilder();
      (function() {
        var txp = TxProposal.fromUntrustedObj({
          creator: 1,
          createdTs: 1,
          builderObj: b.toObj(),
          inputChainPaths: ['m/1'],
        });
      }).should.throw('tx is not defined');
    });
    it('sets force opts', function() {

      // Create an incomming TX proposal, with certain options...
      var b = new dummyBuilder({
        opts: {
          juan: 1,
          pepe: 1,
          fee: 1000
        }
      });

      var o = {
        creator: 1,
        createdTs: 1,
        builderObj: b.toObj(),
        inputChainPaths: ['m/1'],
      };
      sinon.stub(TxProposal.prototype, '_check').returns(true);

      //Force other options
      var txp = TxProposal.fromUntrustedObj(o, {
        pepe: 100
      });

      o.builderObj.opts.should.deep.equal({
        juan: 1,
        pepe: 100,
        feeSat: undefined,
        fee: undefined
      });

      TxProposal.prototype._check.restore();
    });
  });


  describe('#fromObj', function() {

  });


  describe('#setSent', function() {
    it('should set txid and timestamp', function() {
      var now = Date.now();
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: new dummyBuilder(),
        inputChainPaths: ['m/1'],
      });
      txp.setSent('3a42');
      txp.sentTs.should.gte(now);
      txp.sentTxid.should.equal('3a42');
    });
  });

  describe('#getSent', function() {
    it('should get sent timestamp', function() {
      var now = Date.now();
      var txp = new TxProposal({
        creator: 1,
        createdTs: 1,
        builder: new dummyBuilder(),
        inputChainPaths: ['m/1'],
      });

      var sentTs = txp.getSent();
      should.not.exist(sentTs);

      txp.setSent('3a42');
      sentTs = txp.getSent();
      sentTs.should.gte(now);
    });
  });

  describe('Signature verification', function() {
    var validScriptSig1Sig = new bitcore.Script(SCRIPTSIG[0]);
    var validScriptSig = new bitcore.Script(SCRIPTSIG[1]);

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
    it('#formatKeys', function() {
      (function() {
        TxProposal.formatKeys(someKeys);
      }).should.throw('buffers');
      var res = TxProposal.formatKeys(keyBuf);
    });
    it('#_verifyScriptSig arg checks', function() {
      var txp = dummyProposal();
      (function() {
        txp.verifySignatures(
          keyBuf,
          new bitcore.Script(new Buffer('112233', 'hex')),
          new Buffer('1a', 'hex'));
      }).should.throw('script');
    });
    it('#_verifyScriptSig, no signatures', function() {
      var txp = dummyProposal();
      (function() {
        txp.verifySignatures(keyBuf, validScriptSig, new Buffer(32));
      }).should.throw('invalid');
    });
    it('#_verifyScriptSig, one signature', function() {
      // Data taken from bitcore's TransactionBuilder test
      var txp = dummyProposal();
      var tx = dummyProposal().builder.build();
      var ret = txp.verifySignatures(pubkeys, validScriptSig1Sig, tx.hashForSignature());
      ret.should.deep.equal(['03197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d']);
    });
    it('#_verifyScriptSig, two signatures', function() {
      // Data taken from bitcore's TransactionBuilder test
      var txp = dummyProposal();
      var tx = dummyProposal().builder.build();
      var ret = txp.verifySignatures(pubkeys, validScriptSig, tx.hashForSignature());
      ret.should.deep.equal(['03197599f6e209cefef07da2fddc6fe47715a70162c531ffff8e611cef23dfb70d', '03a94351fecc4328bb683bf93a1aa67378374904eac5980c7966723a51897c56e3']);
    });
    it('#infoFromRedeemScript', function() {
      var info = TxProposal.infoFromRedeemScript(validScriptSig);
      var keys = info.keys;
      keys.length.should.equal(5);
      for (var i in keys) {
        keys[i].toString('hex').should.equal(pubkeys[i].toString('hex'));
      }
      Buffer.isBuffer(info.script.getBuffer()).should.equal(true);
    });
    it('#getSignersPubKeys', function() {
      var txp = dummyProposal();
      var pubkeys = txp.getSignersPubKeys();
      pubkeys.should.deep.equal([PUBKEYS]);
    });



    describe('#getSignatures', function() {
      it('should get signatures', function() {
        var txp = dummyProposal();
        var sigs = txp.getSignatures();
        sigs.length.should.equal(1);
        sigs[0].length.should.equal(2);
        sigs[0][0].should.equal(SIG0);
        sigs[0][1].should.equal(SIG1);
      });
    });

    describe('#addSignature', function() {
      it('should add signatures maintaing pubkeys order', function() {
        var txp = dummyProposal({
          nsig:1 
        });
        txp.getSignersPubKeys()[0].length.should.equal(1);

        txp.addSignature('pepe', [SIG1]);
        txp.getSignersPubKeys()[0].length.should.equal(2);

        var keys = txp.getSignersPubKeys()[0];
        var keysSorted = _.clone(keys).sort();
        keysSorted.should.deep.equal(keys);

      });
      it('should add signatures to incomplete txs ', function() {
        var txp = dummyProposal({
          nsig:1 
        });
        txp.addSignature('pepe', [SIG1]);
        txp.builder.inputsSigned.should.be.equal(0);
      });

      it('should fail with invalid signatures', function() {
        var txp = dummyProposal({
          nsig:1 
        });
        txp.getSignersPubKeys()[0].length.should.equal(1);

        (function(){
          txp.addSignature('pepe', ['002030a77c9613d6ee010717c1abc494668d877e3fa0ae4c520f65cc3b308754c98c02205219d387bcb291bd44805b9468439e4168b02a6a180cdbcc24d84d71d696c1ae01']);
        }).should.throw('BADSIG');
      });

      it('should fail adding the same signature twice', function() {
        var txp = dummyProposal({
          nsig:1 
        });
        txp.getSignersPubKeys()[0].length.should.equal(1);

        txp.addSignature('pepe', [SIG1]);
        (function(){
          txp.addSignature('pepe', [SIG1]);
        }).should.throw('BADSIG');
      });
    });
    describe('#_check', function() {
      it('OK', function() {
        dummyProposal({})._check();
      });
      it('FAIL ins', function() {
        (function() {
          dummyProposal({
            noins: true,
          })._check();
        }).should.throw('no ins');
      });
      it('FAIL signhash SINGLE', function() {
        var txp = dummyProposal({
          hashtype: Transaction.SIGHASH_SINGLE
        });
        (function() {
          txp._check();
        }).should.throw('signatures');
      });
      it('FAIL signhash NONE', function() {
        var txp = dummyProposal({
          hashtype: Transaction.SIGHASH_NONE,
        });
        (function() {
          txp._check();
        }).should.throw('signatures');
      });
      it('FAIL signhash ANYONECANPAY', function() {
        var txp = dummyProposal({
          hashtype: Transaction.SIGHASH_ANYONECANPAY,
        });
        (function() {
          txp._check();
        }).should.throw('signatures');
      });
      it('FAIL no signatures', function() {
        var txp = dummyProposal({
          nosigs: true,
        });
        (function() {
          txp._check();
        }).should.throw('no signatures');
      });
    });

    describe('#_checkPayPro', function() {
      var txp, md;
      beforeEach(function() {
        txp = dummyProposal();
        txp.paymentProtocolURL = '123';
        md = {
          request_url: '123',
          pr: {
            pd: {
              expires: 123,
              memo: 'memo',

            },
          },
          total: '1230',
          outs: [{
            address: '2NDJbzwzsmRgD2o5HHXPhuq5g6tkKTjYkd6',
            amountSatStr: "123"
          }],
          expires: 92345678900,
        };
      });

      it('OK no merchant data', function() {
        txp._checkPayPro();
      });
      it('OK merchant data', function() {
        txp.addMerchantData(md);
      });
      it('NOK URL', function() {
        txp.paymentProtocolURL = '1234';
        (function() {
          txp.addMerchantData(md);
        }).should.throw('Mismatch');
      });
      it('NOK OUTS', function() {
        md.outs = [];
        (function() {
          txp.addMerchantData(md);
        }).should.throw('outputs');
      });
      it('NOK OUTS (case 2)', function() {
        md.outs = [{}, {}];
        (function() {
          txp.addMerchantData(md);
        }).should.throw('outputs');
      });
      it('NOK OUTS (case 3)', function() {
        md.outs = [{}, {}];
        (function() {
          txp.addMerchantData(md);
        }).should.throw('outputs');
      });
      it('NOK Amount', function() {
        md.total = undefined;
        (function() {
          txp.addMerchantData(md);
        }).should.throw('amount');
      });
      it('NOK Outs case 4', function() {
        md.outs[0].address = 'aaa';
        (function() {
          txp.addMerchantData(md);
        }).should.throw('address');
      });
      it('NOK Outs case 5', function() {
        md.outs[0].amountSatStr = '432';
        (function() {
          txp.addMerchantData(md);
        }).should.throw('amount');
      });

      it('NOK Expired', function() {
        md.expires = 1;
        (function() {
          txp.addMerchantData(md);
        }).should.throw('expired');
      });

      it('OK Expired but sent', function() {
        md.expires = 2;
        txp.sentTs = 1;
        txp.addMerchantData(md);
      });

    });

    describe.skip('#merge', function() {
      it('with self', function() {
        var txp = dummyProposal();
        var hasChanged = txp.merge(txp);
        hasChanged.should.equal(false);
      });

      it('with less signatures', function() {
        var txp = dummyProposal();
        var txp1Sig = dummyProposal({
          nsig:1 
        });
        var backup = txp.builder.vanilla.scriptSig[0];
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
        var txp = dummyProposal();
        txp.signedBy = {
          'hugo': 1
        };
        delete txp['creator'];
        (function() {
          txp.setCopayers({
            pk1: 'pepe'
          })
        }).should.throw('no creator');
      });
      it("should fails if Tx is not signed by creator", function() {
        var txp = dummyProposal();
        txp.creator = 'creator';
        txp.signedBy = {
          'hugo': 1
        };
        txp._inputSigners = [
          ['pkX']
        ];
        (function() {
          txp.setCopayers({
            pk1: 'pepe'
          })
        }).should.throw('creator');
      });


      it("should fails if Tx has unmapped signatures", function() {
        var txp = dummyProposal();
        txp.creator = 'creator';
        txp.signedBy = {
          creator: 1
        };
        txp._inputSigners = [
          ['pk0', 'pkX']
        ];
        (function() {
          txp.setCopayers({
            pk1: 'pepe'
          })
        }).should.throw('unknown sig');
      });

      // This was disabled. Unnecessary to check this.
      it.skip("should be signed by sender", function() {
        var txp = dummyProposal();
        var ts = Date.now();
        txp._inputSigners = [
          ['pk1', 'pk0']
        ];
        txp.signedBy = {
          'creator': Date.now()
        };
        (function() {
          txp.setCopayers({
            pk0: 'creator',
            pk1: 'pepe',
            pk2: 'john'
          })
        }).should.throw('senders sig');
      });


      it("should set signedBy (trivial case)", function() {
        var txp = dummyProposal();
        var ts = Date.now();

        sinon.stub(txp, 'getSignersPubKeys').returns(['pk1', 'pk0']);
        txp.signedBy = {
          'creator': Date.now()
        };
        txp.setCopayers({
          pk0: 'creator',
          pk1: 'pepe',
          pk2: 'john'
        })
        Object.keys(txp.signedBy).length.should.equal(2);
        txp.signedBy['pepe'].should.gte(ts);
        txp.signedBy['creator'].should.gte(ts);
      });
      it("should assign creator", function() {
        var txp = dummyProposal();
        var ts = Date.now();
        sinon.stub(txp, 'getSignersPubKeys').returns(['pk0']);
        txp.signedBy = {};
        delete txp['creator'];
        delete txp['creatorTs'];
        txp.setCopayers({
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
        var txp = dummyProposal();
        var ts = Date.now();
        txp.signedBy = {};
        delete txp['creator'];
        delete txp['creatorTs'];
        sinon.stub(txp, 'getSignersPubKeys').returns(['pk0', 'pk1']);
        (function() {
          txp.setCopayers({
            pk0: 'creator',
            pk1: 'pepe',
            pk2: 'john'
          }, {
            'creator2': 1
          });
        }).should.throw('only 1');
      })

      it("if signed, should not change ts", function() {
        var txp = dummyProposal();
        var ts = Date.now();
        sinon.stub(txp, 'getSignersPubKeys').returns(['pk0', 'pk1']);
        txp.creator = 'creator';
        txp.signedBy = {
          'creator': 1
        };
        txp.setCopayers({
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

  describe('micelaneous functions', function() {
    it('should report rejectCount', function() {
      var txp = dummyProposal();
      txp.rejectCount().should.equal(0);
      txp.setRejected(['juan'])
      txp.rejectCount().should.equal(1);
    });
    it('should report isPending 1', function() {
      var txp = dummyProposal();
      txp.rejectedBy = [];
      txp.sentTxid = 1;
      txp.isPending(3).should.equal(false);
    });
    it('should report isPending 2', function() {
      var txp = dummyProposal();
      txp.rejectedBy = [];
      txp.sentTxid = null;
      txp.isPending(3).should.equal(true);
    });
    it('should report isPending 3', function() {
      var txp = dummyProposal();
      txp.rejectedBy = [1, 2, 3, 4];
      txp.sentTxid = null;
      txp.isPending(3).should.equal(false);
    });
  });


});
