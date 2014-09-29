'use strict';

var Wallet = copay.Wallet;
var PrivateKey = copay.PrivateKey;
var Storage = copay.Storage;
var Network = requireMock('FakeNetwork');
var Blockchain = requireMock('FakeBlockchain');
var Builder = requireMock('FakeBuilder');
var TransactionBuilder = bitcore.TransactionBuilder;
var Transaction = bitcore.Transaction;
var Address = bitcore.Address;


function assertObjectEqual(a, b) {
  Wallet.PERSISTED_PROPERTIES.forEach(function(k) {
    if (a[k] && b[k]) {
      _.omit(a[k], 'name').should.be.deep.equal(b[k], k + ' differs');
    }
  })
}


var walletConfig = {
  requiredCopayers: 3,
  totalCopayers: 5,
  spendUnconfirmed: true,
  reconnectDelay: 100,
  networkName: 'testnet',
  storage: requireMock('FakeLocalStorage').storageParams,
};

var getNewEpk = function() {
  return new PrivateKey({
      networkName: walletConfig.networkName,
    })
    .deriveBIP45Branch()
    .extendedPublicKeyString();
}

var addCopayers = function(w) {
  for (var i = 0; i < 4; i++) {
    w.publicKeyRing.addCopayer(getNewEpk());
  }
};

describe('Wallet model', function() {

  it('should fail to create an instance', function() {
    (function() {
      new Wallet(walletConfig)
    }).should.
    throw();
  });
  it('should getNetworkName', function() {
    var w = cachedCreateW();
    w.getNetworkName().should.equal('testnet');
  });


  var createW = function(N, conf) {

    var c = JSON.parse(JSON.stringify(conf || walletConfig));
    if (!N) N = c.totalCopayers;

    var mainPrivateKey = new copay.PrivateKey({
      networkName: walletConfig.networkName
    });
    var mainCopayerEPK = mainPrivateKey.deriveBIP45Branch().extendedPublicKeyString();
    c.privateKey = mainPrivateKey;

    c.publicKeyRing = new copay.PublicKeyRing({
      networkName: c.networkName,
      requiredCopayers: Math.min(N, c.requiredCopayers),
      totalCopayers: N,
    });
    c.publicKeyRing.addCopayer(mainCopayerEPK);

    c.txProposals = new copay.TxProposals({
      networkName: c.networkName,
    });

    var storage = new Storage(walletConfig.storage);
    storage.setPassphrase('xxx');
    var network = new Network(walletConfig.network);
    var blockchain = new Blockchain(walletConfig.blockchain);
    c.storage = storage;
    c.network = network;
    c.blockchain = blockchain;

    c.addressBook = {
      '2NFR2kzH9NUdp8vsXTB4wWQtTtzhpKxsyoJ': {
        label: 'John',
        copayerId: '026a55261b7c898fff760ebe14fd22a71892295f3b49e0ca66727bc0a0d7f94d03',
        createdTs: 1403102115,
        hidden: false
      },
      '2MtP8WyiwG7ZdVWM96CVsk2M1N8zyfiVQsY': {
        label: 'Jennifer',
        copayerId: '032991f836543a492bd6d0bb112552bfc7c5f3b7d5388fcbcbf2fbb893b44770d7',
        createdTs: 1403103115,
        hidden: false
      }
    };

    c.networkName = walletConfig.networkName;
    c.version = '0.0.1';


    return new Wallet(c);
  }

  var cachedW = null;
  var cachedWobj = null;
  var cachedCreateW = function() {
    if (!cachedW) {
      cachedW = createW();
      cachedWobj = cachedW.toObj();
      cachedWobj.opts.reconnectDelay = 100;
    }
    var w = Wallet.fromObj(cachedWobj, cachedW.storage, cachedW.network, cachedW.blockchain);
    return w;
  };

  it('should create an instance', function() {
    var w = cachedCreateW();
    should.exist(w);
    w.publicKeyRing.walletId.should.equal(w.id);
    w.txProposals.walletId.should.equal(w.id);
    w.requiredCopayers.should.equal(3);
    should.exist(w.id);
    should.exist(w.publicKeyRing);
    should.exist(w.privateKey);
    should.exist(w.txProposals);
    should.exist(w.addressBook);
  });

  it('should provide some basic features', function(done) {
    var opts = {};
    var w = cachedCreateW();
    addCopayers(w);
    w.publicKeyRing.generateAddress(false, w.publicKey);
    w.publicKeyRing.isComplete().should.equal(true);
    w.generateAddress(true).isValid().should.equal(true);
    w.generateAddress(true, function(addr) {
      addr.isValid().should.equal(true);
      done();
    });
  });

  var unspentTest = [{
    "address": "dummy",
    "scriptPubKey": "dummy",
    "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
    "vout": 1,
    "amount": 10,
    "confirmations": 7
  }];

  var createW2 = function(privateKeys, N, conf) {
    if (!N) N = 3;
    var w = createW(N, conf);
    should.exist(w);

    var pkr = w.publicKeyRing;

    for (var i = 0; i < N - 1; i++) {
      if (privateKeys) {
        var k = privateKeys[i];
        pkr.addCopayer(k ? k.deriveBIP45Branch().extendedPublicKeyString() : getNewEpk());
      } else {
        pkr.addCopayer(getNewEpk());
      }
    }

    return w;
  };

  var cachedW2 = null;
  var cachedW2obj = null;
  var cachedCreateW2 = function() {
    if (!cachedW2) {
      cachedW2 = createW2();
      cachedW2obj = cachedW2.toObj();
      cachedW2obj.opts.reconnectDelay = 100;
    }
    var w = Wallet.fromObj(cachedW2obj, cachedW2.storage, cachedW2.network, cachedW2.blockchain);
    return w;
  };

  it('#create, fail for network', function() {

    var w = cachedCreateW2();

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true);

    var f = function() {
      var ntxid = w.createTxSync(
        '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
        '123456789',
        null,
        unspentTest
      );
    };
    f.should.throw(Error);
  });


  it('#create, check builder opts', function() {
    var w = cachedCreateW2();
    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);
    var ntxid = w.createTxSync(
      'mgGJEugdPnvhmRuFdbdQcFfoFLc1XXeB79',
      '123456789',
      null,
      unspentTest
    );
    var t = w.txProposals;
    var opts = JSON.parse(t.txps[ntxid].builder.vanilla.opts);
    opts.signhash.should.equal(1);
    (opts.lockTime === null).should.be.true;
    should.not.exist(opts.fee);
    should.not.exist(opts.feeSat);
  });

  it('#create, 1 sign', function() {
    var w = cachedCreateW2();

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);

    var ntxid = w.createTxSync(
      'mgGJEugdPnvhmRuFdbdQcFfoFLc1XXeB79',
      '123456789',
      null,
      unspentTest
    );

    var t = w.txProposals;
    var txp = t.txps[ntxid];
    Object.keys(txp._inputSigners).length.should.equal(1);
    var tx = txp.builder.build();
    should.exist(tx);
    chai.expect(txp.comment).to.be.null;
    tx.isComplete().should.equal(false);
    Object.keys(txp.seenBy).length.should.equal(1);
  });

  it('#create with comment', function() {

    var w = cachedCreateW2();
    var comment = 'This is a comment';

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);

    var ntxid = w.createTxSync(
      'mgGJEugdPnvhmRuFdbdQcFfoFLc1XXeB79',
      '123456789',
      comment,
      unspentTest
    );

    var t = w.txProposals;
    var txp = t.txps[ntxid];
    var tx = txp.builder.build();
    should.exist(tx);
    txp.comment.should.equal(comment);
  });

  it('#create throw exception on long comment', function() {

    var w = cachedCreateW2();
    var comment = 'Lorem ipsum dolor sit amet, suas euismod vis te, velit deleniti vix an. Pri ex suscipit similique, inermis per';

    unspentTest[0].address = w.publicKeyRing.getAddress(1, true, w.publicKey).toString();
    unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(1, true, w.publicKey);

    var badCreate = function() {
      w.createTxSync(
        'mgGJEugdPnvhmRuFdbdQcFfoFLc1XXeB79',
        '123456789',
        comment,
        unspentTest
      );
    }

    chai.expect(badCreate).to.throw(Error);
  });

  it('#addressIsOwn', function() {
    var w = cachedCreateW2();
    var l = w.getAddressesStr();
    for (var i = 0; i < l.length; i++)
      w.addressIsOwn(l[i]).should.equal(true);

    w.addressIsOwn(l[0], {
      excludeMain: true
    }).should.equal(false);

    w.addressIsOwn('mmHqhvTVbxgJTnePa7cfweSRjBCy9bQQXJ').should.equal(false);
    w.addressIsOwn('mgtUfP9sTJ6vPLoBxZLPEccGpcjNVryaCX').should.equal(false);
  });

  it('#create. Signing with derivate keys', function() {

    var w = cachedCreateW2();

    var ts = Date.now();
    for (var isChange = false; !isChange; isChange = true) {
      for (var index = 0; index < 3; index++) {
        unspentTest[0].address = w.publicKeyRing.getAddress(index, isChange, w.publicKey).toString();
        unspentTest[0].scriptPubKey = w.publicKeyRing.getScriptPubKeyHex(index, isChange, w.publicKey);
        w.createTxSync(
          'mgGJEugdPnvhmRuFdbdQcFfoFLc1XXeB79',
          '123456789',
          null,
          unspentTest
        );
        var t = w.txProposals;
        var k = Object.keys(t.txps)[0];
        var tx = t.txps[k].builder.build();
        should.exist(tx);
        tx.isComplete().should.equal(false);
        tx.countInputMissingSignatures(0).should.equal(2);

        (t.txps[k].signedBy[w.privateKey.getId()] - ts > 0).should.equal(true);
        (t.txps[k].seenBy[w.privateKey.getId()] - ts > 0).should.equal(true);
      }
    }
  });

  it('#fromObj #toObj round trip', function() {

    var w = cachedCreateW2();

    var o = w.toObj();
    o = JSON.parse(JSON.stringify(o));

    // non stored options
    o.opts.reconnectDelay = 100;

    var s = new Storage(walletConfig.storage);
    s.setPassphrase('xxx');
    var w2 = Wallet.fromObj(o,
      s,
      new Network(walletConfig.network),
      new Blockchain(walletConfig.blockchain));
    should.exist(w2);
    w2.publicKeyRing.requiredCopayers.should.equal(w.publicKeyRing.requiredCopayers);
    should.exist(w2.publicKeyRing.getCopayerId);
    should.exist(w2.txProposals.toObj);
    should.exist(w2.privateKey.toObj);
  });

  it('#getSecret decodeSecret', function() {
    var w = cachedCreateW2();
    var id = w.getMyCopayerId();
    var secretNumber = w.getSecretNumber();

    var sb = w.getSecret();
    should.exist(sb);

    var s = Wallet.decodeSecret(sb);
    s.pubKey.should.equal(id);
    s.secretNumber.should.equal(secretNumber);
    s.networkName.should.equal(w.getNetworkName());
  });

  it('#getSecret decodeSecret livenet', function() {
    var w = cachedCreateW2();
    var stub = sinon.stub(w, 'getNetworkName');
    stub.returns('livenet');
    var sb = w.getSecret();
    should.exist(sb);
    var s = Wallet.decodeSecret(sb);
    s.networkName.should.equal('livenet');
    stub.restore();
  });


  it('decodeSecret check', function() {
    (function() {
      Wallet.decodeSecret('4fp61K187CsYmjoRQC5iAdC5eGmbCRsAAXfwEwetSQgHvZs27eWKaLaNHRoKM');
    }).should.not.
    throw();

    (function() {
      Wallet.decodeSecret('4fp61K187CsYmjoRQC5iAdC5eGmbCRsAAXfwEwetSQgHvZs27eWKaLaNHRoK');
    }).should.
    throw();

    (function() {
      Wallet.decodeSecret('12345');
    }).should.
    throw();
  });


  it('#maxRejectCount', function() {
    var w = cachedCreateW();
    w.maxRejectCount().should.equal(2);
  });

  describe('#getMaxRequiredCopayers', function() {
    it('should return ', function() {
      var validPairs = {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 4,
        6: 3,
        7: 3,
        8: 2,
        9: 2,
        10: 2,
        11: 1,
        12: 1,
      };
      _.each(validPairs, function(maxReq, total) {
        Wallet.getMaxRequiredCopayers(total).should.equal(maxReq);
      })
    });
  });

  describe('#_onData', function() {
    var w = cachedCreateW();
    var sender = '025c046aaf505a6d23203edd343132e9d4d21818b962d1e9a9c98573cc2031bfc9';
    var ts = 1410810974778246;
    it('should fail on message unknown', function() {
      var data = {
        type: "xxx",
        walletId: w.id
      };

      (function() {
        w._onData(sender, data, ts);
      }).should.
      throw('unknown message type received: xxx from: 025c046aaf505a6d23203edd343132e9d4d21818b962d1e9a9c98573cc2031bfc9');

    });

    it('should call sendWalletReady', function() {
      var data = {
        type: "walletId",
        walletId: w.id
      };

      var spy = sinon.spy(w, 'sendWalletReady');
      w._onData(sender, data, ts);
      sinon.assert.callCount(spy, 1);
    });

  });


  describe('#purgeTxProposals', function() {
    it('should delete all', function() {
      var w = cachedCreateW();
      var spy1 = sinon.spy(w.txProposals, 'deleteAll');
      var spy2 = sinon.spy(w.txProposals, 'deletePending');
      w.purgeTxProposals(1);
      spy1.callCount.should.equal(1);
      spy2.callCount.should.equal(0);
      spy1.restore();
      spy2.restore();
    });
    it('should delete pending', function() {
      var w = cachedCreateW();
      var spy1 = sinon.spy(w.txProposals, 'deleteAll');
      var spy2 = sinon.spy(w.txProposals, 'deletePending');
      w.purgeTxProposals();
      spy1.callCount.should.equal(0);
      spy2.callCount.should.equal(1);
      spy1.restore();
      spy2.restore();
    });
    it('should count deletions', function() {
      var w = cachedCreateW();
      var s = sinon.stub(w.txProposals, 'length').returns(10);
      var n = w.purgeTxProposals();
      n.should.equal(0);
      s.restore();
    });
  });


  //this test fails randomly
  it.skip('call reconnect after interval', function(done) {
    this.timeout(10000);
    var w = cachedCreateW2();
    var spy = sinon.spy(w, 'scheduleConnect');
    var callCount = 3;
    w.netStart();
    setTimeout(function() {
      sinon.assert.callCount(spy, callCount);
      done();
    }, w.reconnectDelay * callCount * (callCount + 1) / 2);
  });

  it('#isSingleUser', function() {
    var w = createW();
    w.isShared().should.equal(true);

    w.totalCopayers = 1;
    w.isShared().should.equal(false);
  });



  it('#isReady', function() {
    var w = createW();
    w.publicKeyRing.isComplete().should.equal(false);
    w.isReady().should.equal(false);

    var w2 = createW2();
    w2.publicKeyRing.isComplete().should.equal(true);
    w2.isReady().should.equal(false);

    w2.publicKeyRing.copayersBackup = ["a", "b", "c"];
    w2.publicKeyRing.isFullyBackup().should.equal(true);
    w2.isReady().should.equal(true);
  });

  it('handle network indexes correctly', function() {
    var w = createW();
    var aiObj = {
      indexes: [{
        copayerIndex: 0,
        changeIndex: 3,
        receiveIndex: 2
      }]
    };
    w._onIndexes('senderID', aiObj, true);
    w.publicKeyRing.getHDParams(0).getReceiveIndex(2);
    w.publicKeyRing.getHDParams(0).getChangeIndex(3);
  });

  it('handle network pubKeyRings correctly', function() {
    var w = createW();
    w.getNetworkName().should.equal('testnet');
    var cepk = [
      w.publicKeyRing.toObj().copayersExtPubKeys[0],
      'tpubDEqHs8LoCB1MDfXs1y2WaLJqPkKsgt8mDoQUFsQ4aKHvho5oFJkF7UrZnfFXKMhA1MuVPwq8a5VhFHvCquYcCVHeCrW4ZCWoDDE9K95e8rP',
      'tpubDEqHs8LoCB1MGGKRyouphPdFNNuay5PBzCuJkgDSiWeAST8m7y4nwPZ7M27mUNWLLPDp6n8kp4P57sd8xHXNnZvap8PxWrUMvXzkxFNgCh7',
    ];
    var pkrObj = {
      walletId: w.id,
      networkName: w.networkName,
      requiredCopayers: w.requiredCopayers,
      totalCopayers: w.totalCopayers,
      indexes: [{
        copayerIndex: 0,
        changeIndex: 2,
        receiveIndex: 3
      }],
      copayersExtPubKeys: cepk,
      nicknameFor: {},
    };
    w._onPublicKeyRing('senderID', {
      publicKeyRing: pkrObj
    }, true);
    w.publicKeyRing.getHDParams(0).getReceiveIndex(2);
    w.publicKeyRing.getHDParams(0).getChangeIndex(3);
    for (var i = 0; i < w.requiredCopayers; i++) {
      w.publicKeyRing.toObj().copayersExtPubKeys[i].should.equal(cepk[i]);
    }
  });

  it('handle network txProposals correctly', function() {
    var w = createW();
    var txp = {
      'txProposal': {
        inputChainPaths: ['m/1'],
        builderObj: {
          version: 1,
          outs: [{
            address: '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
            amountSatStr: '123456789'
          }],
          utxos: [{
            address: '2N6fdPg2QL7V36XKe7a8wkkA5HCy7fNYmZF',
            scriptPubKey: 'a91493372782bab70f4eefdefefea8ece0df44f9596887',
            txid: '2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1',
            vout: 1,
            amount: 10,
            confirmations: 7
          }],
          opts: {
            remainderOut: {
              address: '2N7BLvdrxJ4YzDtb3hfgt6CMY5rrw5kNT1H'
            }
          },
          scriptSig: ['00493046022100b8249a4fc326c4c33882e9d5468a1c6faa01e8c6cef0a24970122e804abdd860022100dbf6ee3b07d3aad8f73997e62ad20654a08aa63a7609792d02f3d5d088e69ad9014cad5321027445ab3a935dce7aee1dadb0d103ed6147a0f83deb80474a04538b2c5bc4d5092102ab32ba51402a139873aeb919c738f5a945f3956f8f8c6ba296677bd29e85d7e821036f119b72e09f76c11ebe2cf754d64eac2cb42c9e623455d54aaa89d70c11f9c82103bcbd3f8ab2c849ea9eae434733cee8b75120d26233def56011b3682ca12081d72103f37f81dc534163b9f73ecf36b91e6c3fb8ae370c24618f91bb1d972e86ceeee255ae'],
          hashToScriptMap: {
            '2N6fdPg2QL7V36XKe7a8wkkA5HCy7fNYmZF': '5321027445ab3a935dce7aee1dadb0d103ed6147a0f83deb80474a04538b2c5bc4d5092102ab32ba51402a139873aeb919c738f5a945f3956f8f8c6ba296677bd29e85d7e821036f119b72e09f76c11ebe2cf754d64eac2cb42c9e623455d54aaa89d70c11f9c82103bcbd3f8ab2c849ea9eae434733cee8b75120d26233def56011b3682ca12081d72103f37f81dc534163b9f73ecf36b91e6c3fb8ae370c24618f91bb1d972e86ceeee255ae'
          }
        }
      }
    };

    var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys').returns({
      '027445ab3a935dce7aee1dadb0d103ed6147a0f83deb80474a04538b2c5bc4d509': 'pepe'
    });
    w._onTxProposal('senderID', txp, true);
    Object.keys(w.txProposals.txps).length.should.equal(1);
    w.getTxProposals().length.should.equal(1);
    //stub.restore();
  });

  var newId = '00bacacafe';
  it('handle new connections', function(done) {
    var w = createW();
    w.on('connect', function(id) {
      id.should.equal(newId);
      done();
    });
    w._onConnect(newId);
  });

  it('should register new copayers correctly', function() {
    var w = createW();
    var r = w.getRegisteredCopayerIds();
    r.length.should.equal(1);
    w.publicKeyRing.addCopayer(getNewEpk());

    r = w.getRegisteredCopayerIds();
    r.length.should.equal(2);
    r[0].should.not.equal(r[1]);
  });

  it('should register new peers correctly', function() {
    var w = createW();
    var r = w.getRegisteredPeerIds();
    r.length.should.equal(1);
    w.publicKeyRing.addCopayer(getNewEpk());
    r = w.getRegisteredPeerIds();
    r.length.should.equal(2);
    r[0].should.not.equal(r[1]);
  });

  it('#getBalance should call #getUnspent', function(done) {
    var w = cachedCreateW2();
    var spy = sinon.spy(w.blockchain, 'getUnspent');
    w.generateAddress();
    w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
      sinon.assert.callCount(spy, 1);
      done();
    });
  });
  it('#getBalance should return values in satoshis', function(done) {
    var w = cachedCreateW2();
    w.generateAddress();
    w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
      balance.should.equal(2500010000);
      safeBalance.should.equal(2500010000);
      balanceByAddr.mji7zocy8QzYywQakwWf99w9bCT6orY1C1.should.equal(2500010000);
      Object.keys(balanceByAddr).length.should.equal(1);
      done();
    });
  });

  it('#getUnspent should honor spendUnconfirmed = false', function(done) {
    var conf = JSON.parse(JSON.stringify(walletConfig));
    conf.spendUnconfirmed = false;
    var w = createW2(null, null, conf);
    w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
      balance.should.equal(2500010000);
      safeBalance.should.equal(0);
      balanceByAddr.mji7zocy8QzYywQakwWf99w9bCT6orY1C1.should.equal(2500010000);
      done();
    });
  });

  it('#getUnspent and spendUnconfirmed should count transactions with 1 confirmations', function(done) {
    var conf = JSON.parse(JSON.stringify(walletConfig));
    conf.spendUnconfirmed = false;
    var w = cachedCreateW2(null, null, conf);
    w.blockchain.getUnspent = w.blockchain.getUnspent2;
    w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
      balance.should.equal(2500010000);
      safeBalance.should.equal(2500010000);
      balanceByAddr.mji7zocy8QzYywQakwWf99w9bCT6orY1C1.should.equal(2500010000);
      done();
    });
  });

  var roundErrorChecks = [{
      unspent: [1.0001],
      balance: 100010000
    }, {
      unspent: [1.0002, 1.0003, 1.0004],
      balance: 300090000
    }, {
      unspent: [0.000002, 1.000003, 2.000004],
      balance: 300000900
    }, {
      unspent: [0.0001, 0.0003],
      balance: 40000
    }, {
      unspent: [0.0001, 0.0003, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0002],
      balance: 110000
    },

  ];
  var roundWallet = cachedCreateW2();

  roundErrorChecks.forEach(function(c) {
    it('#getBalance should handle rounding errors: ' + c.unspent[0], function(done) {
      var w = roundWallet;
      //w.generateAddress();
      w.blockchain.fixUnspent(c.unspent.map(function(u) {
        return {
          amount: u
        }
      }));
      w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
        balance.should.equal(c.balance);
        done();
      });
    });
  });


  it('should get balance', function(done) {
    var w = createW2();
    var spy = sinon.spy(w.blockchain, 'getUnspent');
    w.blockchain.fixUnspent([]);
    w.getBalance(function(err, balance, balanceByAddr, safeBalance) {
      sinon.assert.callCount(spy, 1);
      balance.should.equal(0);
      done();
    });
  });


  // tx handling

  var createUTXO = function(w) {
    var utxo = [{
      'txid': '0be0fb4579911be829e3077202e1ab47fcc12cf3ab8f8487ccceae768e1f95fa',
      'vout': 0,
      'ts': 1402323949,
      'amount': 25.0001,
      'confirmations': 10,
      'confirmationsFromCache': false
    }];
    var addr = w.generateAddress().toString();
    utxo[0].address = addr;
    utxo[0].scriptPubKey = (new bitcore.Address(addr)).getScriptPubKey().serialize().toString('hex');
    return utxo;
  };
  var toAddress = 'mjfAe7YrzFujFf8ub5aUrCaN5GfSABdqjh';
  var amountSatStr = '10000';

  it('should create transaction', function(done) {
    var w = cachedCreateW2();
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      ntxid.length.should.equal(64);
      done();
    });
  });

  it('should create & sign transaction from received funds', function(done) {
    var k2 = new PrivateKey({
      networkName: walletConfig.networkName
    });

    var w = createW2([k2]);
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      w.on('txProposalsUpdated', function() {
        w.getTxProposals()[0].signedByUs.should.equal(true);
        w.getTxProposals()[0].rejectedByUs.should.equal(false);
        done();
      });
      w.privateKey = k2;
      w.sign(ntxid, function(success) {
        success.should.equal(true);
      });
    });
  });
  it('should fail to reject a signed transaction', function() {
    var w = cachedCreateW2();
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      (function() {
        w.reject(ntxid);
      }).should.throw('reject a signed');
    });
  });

  it('should create & reject transaction', function(done) {
    var w = cachedCreateW2();
    var oldK = w.privateKey;
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      var s = sinon.stub(w, 'getMyCopayerId').returns('213');
      Object.keys(w.txProposals.get(ntxid).rejectedBy).length.should.equal(0);
      w.reject(ntxid);
      Object.keys(w.txProposals.get(ntxid).rejectedBy).length.should.equal(1);
      w.txProposals.get(ntxid).rejectedBy['213'].should.gt(1);
      s.restore();
      done();
    });
  });
  it('should create & sign & send a transaction', function(done) {
    var w = createW2(null, 1);
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      w.sendTx(ntxid, function(txid) {
        txid.length.should.equal(64);
        done();
      });
    });
  });
  it('should fail to send incomplete transaction', function(done) {
    var w = createW2(null, 1);
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      var txp = w.txProposals.get(ntxid);
      // Assign fake builder
      txp.builder = new Builder();
      sinon.stub(txp.builder, 'build').returns({
        isComplete: function() {
          return false;
        }
      });
      (function() {
        w.sendTx(ntxid);
      }).should.throw('Tx is not complete. Can not broadcast');
      done();
    });
  });
  it('should check if transaction already sent when failing to send', function(done) {
    var w = createW2(null, 1);
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      sinon.stub(w.blockchain, 'broadcast').yields({
        statusCode: 303
      });
      var spyCheckSentTx = sinon.spy(w, '_checkSentTx');
      w.sendTx(ntxid, function() {});
      chai.expect(spyCheckSentTx.calledOnce).to.be.true;
      done();
    });
  });
  it('should send TxProposal', function(done) {
    var w = cachedCreateW2();
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      w.sendTxProposal.bind(w).should.throw('Illegal Argument.');
      (function() {
        w.sendTxProposal(ntxid);
      }).should.not.throw();
      done();
    });
  });

  it('should send all TxProposal', function(done) {
    var w = cachedCreateW2();
    var utxo = createUTXO(w);
    w.blockchain.fixUnspent(utxo);
    w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
      w.sendAllTxProposals.bind(w).should.not.throw();
      (function() {
        w.sendAllTxProposals();
      }).should.not.throw();
      done();
    });
  });

  describe('#createTx', function() {
    it('should fail if insight server is down', function(done) {
      var w = cachedCreateW2();
      var utxo = createUTXO(w);
      w.blockchain.fixUnspent(utxo);
      sinon.stub(w, 'getUnspent').yields('error', null);
      w.createTx(toAddress, amountSatStr, null, function(err, ntxid) {
        chai.expect(err.message).to.equal('Could not get list of UTXOs');
        done();
      });
    });
  });

  describe('removeTxWithSpentInputs', function() {
    var w;
    var utxos;
    beforeEach(function() {
      w = cachedCreateW2();
      w.txProposals.deleteOne = sinon.spy();
      utxos = [{
        txid: 'txid0',
        vout: 'vout1',
      }, {
        txid: 'txid0',
        vout: 'vout2',
      }];
    });
    it('should remove pending TxProposal with spent inputs', function(done) {
      var txp = {
        ntxid: 'txid1',
        isPending: true,
        builder: {
          utxos: [utxos[0]],
        }
      };
      w.getTxProposals = sinon.stub().returns([txp]);
      w.blockchain.getUnspent = sinon.stub().yields(null, utxos);
      w.removeTxWithSpentInputs(function() {
        w.txProposals.deleteOne.called.should.be.false;
        w.blockchain.getUnspent = sinon.stub().yields(null, []);
        w.removeTxWithSpentInputs(function() {
          w.txProposals.deleteOne.calledWith('txid1').should.be.true;
          done();
        });
      });
    });

    it('should remove pending TxProposal with at least 1 spent input', function(done) {
      var txp = {
        ntxid: 'txid1',
        isPending: true,
        builder: {
          utxos: utxos,
        }
      };
      w.getTxProposals = sinon.stub().returns([txp]);
      w.blockchain.getUnspent = sinon.stub().yields(null, utxos);
      w.removeTxWithSpentInputs(function() {
        w.txProposals.deleteOne.called.should.be.false;
        w.blockchain.getUnspent = sinon.stub().yields(null, [utxos[0]]);
        w.removeTxWithSpentInputs(function() {
          w.txProposals.deleteOne.calledWith('txid1').should.be.true;
          done();
        });
      });
    });

    it('should not remove complete TxProposal', function(done) {
      var txp = {
        ntxid: 'txid1',
        isPending: false,
        builder: {
          utxos: [utxos[0]],
        }
      };
      w.getTxProposals = sinon.stub().returns([txp]);
      w.blockchain.getUnspent = sinon.stub().yields(null, utxos);
      w.removeTxWithSpentInputs(function() {
        w.txProposals.deleteOne.called.should.be.false;
        w.blockchain.getUnspent = sinon.stub().yields(null, []);
        w.removeTxWithSpentInputs(function() {
          w.txProposals.deleteOne.called.should.be.false;
          done();
        });
      });
    });
  });

  describe('#subscribeToAddresses', function() {
    it('should subscribe successfully', function() {
      var w = cachedCreateW2();
      var addr1 = w.getAddresses()[0].toString();
      var addr2 = w.generateAddress().toString();
      var addr3 = w.generateAddress(true).toString();
      chai.expect(w.getAddresses().length).to.equal(3);

      w.blockchain.subscribe = sinon.spy();
      w.subscribeToAddresses();
      w.blockchain.subscribe.calledOnce.should.equal(true);
      var arg = w.blockchain.subscribe.getCall(0).args[0];
      chai.expect(_.difference(arg, [addr1, addr2, addr3]).length).to.equal(0);
    });
  });

  describe('#send', function() {
    it('should call this.network.send', function() {
      var w = cachedCreateW2();
      var save = w.network.send;
      w.network.send = sinon.spy();
      w.send();
      w.network.send.calledOnce.should.equal(true);
      w.network.send = save;
    });
  });

  describe('#indexDiscovery', function() {
    var ADDRESSES_CHANGE, ADDRESSES_RECEIVE, w;

    before(function() {
      w = cachedCreateW2();
      ADDRESSES_CHANGE = w.deriveAddresses(0, 20, true, 0);
      ADDRESSES_RECEIVE = w.deriveAddresses(0, 20, false, 0);
    });

    var mockFakeActivity = function(f) {
      w.blockchain.getActivity = function(addresses, cb) {
        var activity = new Array(addresses.length);
        for (var i = 0; i < addresses.length; i++) {
          var a1 = ADDRESSES_CHANGE.indexOf(addresses[i]);
          var a2 = ADDRESSES_RECEIVE.indexOf(addresses[i]);
          activity[i] = f(Math.max(a1, a2));
        }
        cb(null, activity);
      }
    }

    it('#indexDiscovery should work without found activities', function(done) {
      mockFakeActivity(function(index) {
        return false;
      });
      w.indexDiscovery(0, false, 0, 5, function(e, lastActive) {
        lastActive.should.equal(-1);
        done();
      });
    });

    it('#indexDiscovery should continue scanning', function(done) {
      mockFakeActivity(function(index) {
        return index <= 7;
      });
      w.indexDiscovery(0, false, 0, 5, function(e, lastActive) {
        lastActive.should.equal(7);
        done();
      });
    });

    it('#indexDiscovery should not found beyond the scannWindow', function(done) {
      mockFakeActivity(function(index) {
        return index <= 10 || index == 17;
      });
      w.indexDiscovery(0, false, 0, 5, function(e, lastActive) {
        lastActive.should.equal(10);
        done();
      });
    });

    it('#indexDiscovery should look for activity along the scannWindow', function(done) {
      mockFakeActivity(function(index) {
        return index <= 14 && index % 2 == 0;
      });
      w.indexDiscovery(0, false, 0, 5, function(e, lastActive) {
        lastActive.should.equal(14);
        done();
      });
    });

    it('#updateIndexes should update correctly', function(done) {
      mockFakeActivity(function(index) {
        return index <= 14 && index % 2 == 0;
      });

      var updateIndex = sinon.stub(w, 'updateIndex', function(i, cb) {
        cb();
      });

      w.updateIndexes(function(err) {
        // check updated all indexes
        var cosignersChecked = []
        updateIndex.args.forEach(function(i) {
          cosignersChecked.indexOf(i[0].copayerIndex).should.equal(-1);
          cosignersChecked.push(i[0].copayerIndex);
        });

        sinon.assert.callCount(updateIndex, 4);
        sinon.assert.calledWith(updateIndex, w.publicKeyRing.indexes[0]);
        sinon.assert.calledWith(updateIndex, w.publicKeyRing.indexes[1]);
        sinon.assert.calledWith(updateIndex, w.publicKeyRing.indexes[2]);
        w.updateIndex.restore();
        done();
      });
    });

    it('#updateIndex should update correctly', function(done) {
      mockFakeActivity(function(index) {
        return index <= 14 && index % 2 == 0;
      });


      var indexDiscovery = sinon.stub(w, 'indexDiscovery', function(a, b, c, d, cb) {
        cb(null, 8);
      });
      var index = {
        changeIndex: 1,
        receiveIndex: 2,
        copayerIndex: 2,
      }
      w.updateIndex(index, function(err) {
        index.receiveIndex.should.equal(9);
        index.changeIndex.should.equal(9);
        indexDiscovery.callCount.should.equal(2);
        sinon.assert.calledWith(indexDiscovery, 1, true, 2, 20);
        sinon.assert.calledWith(indexDiscovery, 2, false, 2, 20);
        w.indexDiscovery.restore();
        done();
      });
    });


    it('#updateIndexes should store wallet', function(done) {
      mockFakeActivity(function(index) {
        return index <= 14 && index % 2 == 0;
      });
      var indexDiscovery = sinon.stub(w, 'indexDiscovery', function(a, b, c, d, cb) {
        cb(null, 8);
      });
      var spyStore = sinon.spy(w, 'store');
      w.updateIndexes(function(err) {
        sinon.assert.callCount(spyStore, 1);
        done();
      });
    });

  });

  it('#deriveAddresses', function(done) {
    var w = cachedCreateW2();
    var addresses1 = w.deriveAddresses(0, 5, false, 0);
    var addresses2 = w.deriveAddresses(4, 5, false, 0);

    addresses1.length.should.equal(5);
    addresses2.length.should.equal(5);

    addresses1[4].should.equal(addresses2[0]);
    done();
  });

  describe('#AddressBook', function() {
    var contacts = [{
      label: 'Charles',
      address: '2N8pJWpXCAxmNLHKVEhz3TtTcYCtHd43xWU ',
    }, {
      label: 'Linda',
      address: '2N4Zq92goYGrf5J4F4SZZq7jnPYbCiyRYT2 ',
    }];

    it('should create new entry for address book', function() {
      var w = createW();
      contacts.forEach(function(c) {
        w.setAddressBook(c.address, c.label);
      });
      Object.keys(w.addressBook).length.should.equal(4);
    });

    it('should fail if create a duplicate address', function() {
      var w = createW();
      w.setAddressBook(contacts[0].address, contacts[0].label);
      (function() {
        w.setAddressBook(contacts[0].address, contacts[0].label);
      }).should.
      throw();
    });

    it('should show/hide everywhere', function() {
      var w = createW();
      var key = '2NFR2kzH9NUdp8vsXTB4wWQtTtzhpKxsyoJ';
      w.toggleAddressBookEntry(key);
      w.addressBook[key].hidden.should.equal(true);
      w.toggleAddressBookEntry(key);
      w.addressBook[key].hidden.should.equal(false);
      (function() {
        w.toggleAddressBookEntry();
      }).should.throw();
    });

    it('handle network addressBook correctly', function() {
      var w = createW();

      var data = {
        type: "addressbook",
        addressBook: {
          "3Ae1ieAYNXznm7NkowoFTu5MkzgrTfDz8Z": {
            copayerId: "03baa45498fee1045fa8f91a2913f638dc3979b455498924d3cf1a11303c679cdb",
            createdTs: 1404769393509,
            hidden: false,
            label: "adsf",
            signature: "3046022100d4cdefef66ab8cea26031d5df03a38fc9ec9b09b0fb31d3a26b6e204918e9e78022100ecdbbd889ec99ea1bfd471253487af07a7fa7c0ac6012ca56e10e66f335e4586"
          }
        },
        walletId: "11d23e638ed84c06",
        isBroadcast: 1
      };

      var senderId = "03baa45498fee1045fa8f91a2913f638dc3979b455498924d3cf1a11303c679cdb";

      Object.keys(w.addressBook).length.should.equal(2);
      w._onAddressBook(senderId, data, true);
      Object.keys(w.addressBook).length.should.equal(3);
    });

    it('should return signed object', function() {
      var w = createW();
      var payload = {
        address: 'msj42CCGruhRsFrGATiUuh25dtxYtnpbTx',
        label: 'Faucet',
        copayerId: '026a55261b7c898fff760ebe14fd22a71892295f3b49e0ca66727bc0a0d7f94d03',
        createdTs: 1403102115
      };
      should.exist(w.signJson(payload));
    });

    it('should verify signed object', function() {
      var w = createW();

      var payload = {
        address: "3Ae1ieAYNXznm7NkowoFTu5MkzgrTfDz8Z",
        label: "adsf",
        copayerId: "03baa45498fee1045fa8f91a2913f638dc3979b455498924d3cf1a11303c679cdb",
        createdTs: 1404769393509
      }

      var signature = "3046022100d4cdefef66ab8cea26031d5df03a38fc9ec9b09b0fb31d3a26b6e204918e9e78022100ecdbbd889ec99ea1bfd471253487af07a7fa7c0ac6012ca56e10e66f335e4586";

      var pubKey = "03baa45498fee1045fa8f91a2913f638dc3979b455498924d3cf1a11303c679cdb";

      w.verifySignedJson(pubKey, payload, signature).should.equal(true);
      payload.label = 'Another';
      w.verifySignedJson(pubKey, payload, signature).should.equal(false);
    });

    it('should verify signed addressbook entry', function() {
      var w = createW();
      var key = "3Ae1ieAYNXznm7NkowoFTu5MkzgrTfDz8Z";
      var pubKey = "03baa45498fee1045fa8f91a2913f638dc3979b455498924d3cf1a11303c679cdb";
      w.addressBook[key] = {
        copayerId: pubKey,
        createdTs: 1404769393509,
        hidden: false,
        label: "adsf",
        signature: "3046022100d4cdefef66ab8cea26031d5df03a38fc9ec9b09b0fb31d3a26b6e204918e9e78022100ecdbbd889ec99ea1bfd471253487af07a7fa7c0ac6012ca56e10e66f335e4586"
      };

      w.verifyAddressbookEntry(w.addressBook[key], pubKey, key).should.equal(true);
      w.addressBook[key].label = 'Another';
      w.verifyAddressbookEntry(w.addressBook[key], pubKey, key).should.equal(false);
      (function() {
        w.verifyAddressbookEntry();
      }).should.throw();
    });

  });

  it('#getNetworkName', function() {
    var w = createW();
    w.getNetworkName().should.equal('testnet');
  });

  describe('#getMyCopayerId', function() {
    it('should call getCopayerId', function() {
      var w = cachedCreateW2();
      w.getCopayerId = sinon.spy();
      w.getMyCopayerId();
      w.getCopayerId.calledOnce.should.equal(true);
    });
  });

  describe('#getMyCopayerIdPriv', function() {
    it('should call privateKey.getIdPriv', function() {
      var w = cachedCreateW2();
      w.privateKey.getIdPriv = sinon.spy();
      w.getMyCopayerIdPriv();
      w.privateKey.getIdPriv.calledOnce.should.equal(true);
    });
  });

  describe('#getMyCopayerNickname', function() {
    it('should call publicKeyRing.nicknameForCopayer', function() {
      var w = cachedCreateW2();
      w.publicKeyRing.nicknameForCopayer = sinon.spy();
      w.getMyCopayerNickname();
      w.publicKeyRing.nicknameForCopayer.calledOnce.should.equal(true);
    });
  });

  describe('#netStart', function() {
    it('should call Network.start', function() {
      var w = cachedCreateW2();
      w.network.start = sinon.spy();
      w.netStart();
      w.network.start.calledOnce.should.equal(true);
    });

    it('should call Network.start with a private key', function() {
      var w = cachedCreateW2();
      w.network.start = sinon.spy();
      w.netStart();
      w.network.start.getCall(0).args[0].privkey.length.should.equal(64);
    });

  });

  describe('_getKeymap', function() {
    var w = cachedCreateW();

    it('should set keymap', function() {
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return {
          '123': 'juan'
        };
      });
      var txp = {
        _inputSigners: [
          ['123']
        ],
        inputChainPaths: ['/m/1'],
      };
      var map = w._getKeyMap(txp);
      Object.keys(map).length.should.equal(1);
      map['123'].should.equal('juan');
      stub.restore();
    });

    it('should throw if unmatched sigs', function() {
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return {};
      });
      var txp = {
        _inputSigners: [
          ['234']
        ],
        inputChainPaths: ['/m/1'],
      };
      (function() {
        w._getKeyMap(txp);
      }).should.throw('does not match known copayers');
      stub.restore();
    });

    it('should throw if unmatched sigs (case 2)', function() {
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return {};
      });
      var txp = {
        _inputSigners: [
          ['234', '321'],
          ['234', '322']
        ],
        inputChainPaths: ['/m/1'],
      };
      (function() {
        w._getKeyMap(txp);
      }).should.throw('does not match known copayers');
      stub.restore();
    });

    it('should set keymap with multiple signatures', function() {
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return {
          '123': 'juan',
          '234': 'pepe',
        };
      });
      var txp = {
        _inputSigners: [
          ['234', '123']
        ],
        inputChainPaths: ['/m/1'],
      };
      var map = w._getKeyMap(txp);
      Object.keys(map).length.should.equal(2);
      map['123'].should.equal('juan');
      map['234'].should.equal('pepe');
      stub.restore();
    });

    it('should throw if one inputs has missing sigs', function() {
      var call = 0;
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return call++ ? {
          '555': 'pepe',
        } : {
          '123': 'juan',
          '234': 'pepe',
        };
      });
      var txp = {
        _inputSigners: [
          ['234', '123'],
          ['555']
        ],
        inputChainPaths: ['/m/1'],
      };
      (function() {
        w._getKeyMap(txp);
      }).should.throw('different sig');
      stub.restore();
    });


    it('should throw if one inputs has different sigs', function() {
      var call = 0;
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return call++ ? {
          '555': 'pepe',
          '666': 'pedro',
        } : {
          '123': 'juan',
          '234': 'pepe',
        };
      });
      var txp = {
        _inputSigners: [
          ['234', '123'],
          ['555', '666']
        ],
        inputChainPaths: ['/m/1'],
      };
      (function() {
        w._getKeyMap(txp);
      }).should.throw('different sig');
      stub.restore();
    });


    it('should not throw if 2 inputs has different pubs, same copayers', function() {
      var call = 0;
      var stub = sinon.stub(w.publicKeyRing, 'copayersForPubkeys', function() {
        return call++ ? {
          '555': 'pepe',
          '666': 'pedro',
        } : {
          '123': 'pedro',
          '234': 'pepe',
        };
      });
      var txp = {
        _inputSigners: [
          ['234', '123'],
          ['555', '666']
        ],
        inputChainPaths: ['/m/1'],
      };
      var gk = w._getKeyMap(txp);
      gk.should.deep.equal({
        '123': 'pedro',
        '234': 'pepe',
        '555': 'pepe',
        '666': 'pedro'
      });
      stub.restore();
    });
  });



  describe('_onTxProposal', function() {
    var w;
    beforeEach(function() {
      w = cachedCreateW();
      w._getKeyMap = sinon.stub();
      w.sendSeen = sinon.spy();
      w.sendTxProposal = sinon.spy();
    });

    it('should handle corrupt tx', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      w.txProposals.merge = sinon.stub().throws(new Error('test error'));

      var spy = sinon.spy();
      w.on('txProposalEvent', spy);
      w.on('txProposalEvent', function(e) {
        e.type.should.equal('corrupt');
        done();
      });

      w._onTxProposal('senderID', data);
      spy.called.should.be.true;
    });

    it('should handle new', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      var txp = {
        getSeen: sinon.stub().returns(false),
        setSeen: sinon.spy(),
        setCopayers: sinon.spy(),
        builder: {
          build: sinon.stub().returns({
            isComplete: sinon.stub().returns(false),
          }),
        },
      };

      w.txProposals.merge = sinon.stub().returns({
        ntxid: 1,
        txp: txp,
        new: true,
        hasChanged: true,
      });

      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      w.on('txProposalEvent', spy1);
      w.on('txProposalsUpdated', spy2);
      w.on('txProposalEvent', function(e) {
        e.type.should.equal('new');
        done();
      });

      w._onTxProposal('senderID', data);
      spy1.called.should.be.true;
      spy2.called.should.be.true;
      txp.setSeen.calledOnce.should.be.true;
      w.sendSeen.calledOnce.should.be.true;
      w.sendTxProposal.calledOnce.should.be.true;
    });

    it('should handle signed', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      var txp = {
        getSeen: sinon.stub().returns(true),
        setSeen: sinon.spy(),
        setCopayers: sinon.stub().returns(['new copayer']),
        builder: {
          build: sinon.stub().returns({
            isComplete: sinon.stub().returns(false),
          }),
        },
      };

      w.txProposals.merge = sinon.stub().returns({
        ntxid: 1,
        txp: txp,
        new: false,
        hasChanged: true,
      });

      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      w.on('txProposalEvent', spy1);
      w.on('txProposalsUpdated', spy2);
      w.on('txProposalEvent', function(e) {
        e.type.should.equal('signed');
        done();
      });

      w._onTxProposal('senderID', data);
      spy1.called.should.be.true;
      spy2.called.should.be.true;
      txp.setSeen.calledOnce.should.be.false;
      w.sendSeen.calledOnce.should.be.false;
      w.sendTxProposal.calledOnce.should.be.true;
    });

    it('should mark as broadcast when complete', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      var txp = {
        getSeen: sinon.stub().returns(true),
        setCopayers: sinon.stub().returns(['new copayer']),
        getSent: sinon.stub().returns(false),
        setSent: sinon.spy(),
        builder: {
          build: sinon.stub().returns({
            isComplete: sinon.stub().returns(true),
          }),
        },
      };

      w.txProposals.merge = sinon.stub().returns({
        ntxid: 1,
        txp: txp,
        new: false,
        hasChanged: true,
      });
      w._checkSentTx = sinon.stub().yields(true);

      w._onTxProposal('senderID', data);
      txp.setSent.calledOnce.should.be.true;
      w.sendTxProposal.called.should.be.false;
      done();
    });

    it('should only mark as broadcast if found in the blockchain', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      var txp = {
        getSeen: sinon.stub().returns(true),
        setCopayers: sinon.stub().returns(['new copayer']),
        getSent: sinon.stub().returns(false),
        setSent: sinon.spy(),
        builder: {
          build: sinon.stub().returns({
            isComplete: sinon.stub().returns(true),
          }),
        },
      };

      w.txProposals.merge = sinon.stub().returns({
        ntxid: 1,
        txp: txp,
        new: false,
        hasChanged: true,
      });
      w._checkSentTx = sinon.stub().yields(false);

      w._onTxProposal('senderID', data);
      txp.setSent.called.should.be.false;
      txp.setSent.calledWith(1).should.be.false;
      w.sendTxProposal.called.should.be.false;
      done();
    });

    it('should not overwrite sent info', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      var txp = {
        getSeen: sinon.stub().returns(true),
        setCopayers: sinon.stub().returns(['new copayer']),
        getSent: sinon.stub().returns(true),
        setSent: sinon.spy(),
        builder: {
          build: sinon.stub().returns({
            isComplete: sinon.stub().returns(true),
          }),
        },
      };

      w.txProposals.merge = sinon.stub().returns({
        ntxid: 1,
        txp: txp,
        new: false,
        hasChanged: false,
      });
      w._checkSentTx = sinon.stub().yields(true);

      w._onTxProposal('senderID', data);
      txp.setSent.called.should.be.false;
      w.sendTxProposal.called.should.be.false;
      done();
    });

    it('should resend when not complete only if changed', function(done) {
      var data = {
        txProposal: {
          dummy: 1,
        },
      };
      var txp = {
        getSeen: sinon.stub().returns(true),
        setCopayers: sinon.stub().returns(['new copayer']),
        builder: {
          build: sinon.stub().returns({
            isComplete: sinon.stub().returns(false),
          }),
        },
      };

      w.txProposals.merge = sinon.stub().returns({
        ntxid: 1,
        txp: txp,
        new: false,
        hasChanged: false,
      });

      w._onTxProposal('senderID', data);
      w.sendTxProposal.called.should.be.false;
      done();
    });
  });


  describe('_onReject', function() {
    it('should fails if unknown tx', function() {
      var w = cachedCreateW();
      (function() {
        w._onReject(1, {
          ntxid: 1
        }, 1);
      }).should.throw('Unknown TXP');
    });
    it('should fail to reject a signed tx', function() {
      var w = cachedCreateW();
      w.txProposals.txps['qwerty'] = {
        signedBy: {
          john: 1
        }
      };
      (function() {
        w._onReject('john', {
          ntxid: 'qwerty'
        }, 1);
      }).should.throw('already signed');
    });
    it('should reject a tx', function() {
      var w = cachedCreateW();

      function txp() {
        this.ok = 0;
        this.signedBy = {};
      };
      txp.prototype.setRejected = function() {
        this.ok = 1;
      };
      txp.prototype.toObj = function() {};

      var spy1 = sinon.spy(w, 'store');
      var spy2 = sinon.spy(w, 'emit');
      w.txProposals.txps['qwerty'] = new txp();
      w.txProposals.txps['qwerty'].ok.should.equal(0);
      w._onReject('john', {
        ntxid: 'qwerty'
      }, 1);
      w.txProposals.txps['qwerty'].ok.should.equal(1);
      spy1.calledOnce.should.equal(true);
      spy2.callCount.should.equal(2);
      spy2.firstCall.args.should.deep.equal(['txProposalsUpdated']);
      spy2.secondCall.args.should.deep.equal(['txProposalEvent', {
        type: 'rejected',
        cId: 'john',
        txId: 'qwerty',
      }]);
    });
  });


  describe('_onSeen', function() {
    it('should fails if unknown tx', function() {
      var w = cachedCreateW();
      (function() {
        w._onReject(1, {
          ntxid: 1
        }, 1);
      }).should.throw('Unknown TXP');
    });
    it('should set seen a tx', function() {
      var w = cachedCreateW();

      function txp() {
        this.ok = 0;
        this.signedBy = {};
      };
      txp.prototype.setSeen = function() {
        this.ok = 1;
      };
      txp.prototype.toObj = function() {};

      var spy1 = sinon.spy(w, 'store');
      var spy2 = sinon.spy(w, 'emit');
      w.txProposals.txps['qwerty'] = new txp();
      w.txProposals.txps['qwerty'].ok.should.equal(0);
      w._onSeen('john', {
        ntxid: 'qwerty'
      }, 1);
      w.txProposals.txps['qwerty'].ok.should.equal(1);
      spy1.calledOnce.should.equal(true);
      spy2.callCount.should.equal(2);
      spy2.firstCall.args.should.deep.equal(['txProposalsUpdated']);
      spy2.secondCall.args.should.deep.equal(['txProposalEvent', {
        type: 'seen',
        cId: 'john',
        txId: 'qwerty',
      }]);
    });
  });

  it('getNetwork', function() {
    var w = cachedCreateW();
    var n = w.getNetwork();
    n.maxPeers.should.equal(5);
    should.exist(n.networkNonce);
  });


  describe('#obtainNetworkName', function() {
    it('should return the networkname', function() {
      Wallet.obtainNetworkName({
        networkName: 'testnet',
      }).should.equal('testnet');
      Wallet.obtainNetworkName({
        opts: {
          networkName: 'testnet'
        }
      }).should.equal('testnet');
      Wallet.obtainNetworkName({
        publicKeyRing: {
          networkName: 'testnet'
        }
      }).should.equal('testnet');
      Wallet.obtainNetworkName({
        privateKey: {
          networkName: 'testnet'
        }
      }).should.equal('testnet');
    });
  });



  it('should emit notification when tx received', function(done) {
    var w = cachedCreateW2();
    w.blockchain.removeAllListeners = sinon.stub();
    var spy = sinon.spy(w, 'emit');

    w.generateAddress(false, function(addr1) {
      w.generateAddress(true, function(addr2) {
        w.blockchain.on = sinon.stub().withArgs('tx').yields({
          address: addr1.toString(),
        });
        w._setBlockchainListeners();
        spy.calledWith('tx', addr1.toString(), false).should.be.true;

        w.blockchain.on = sinon.stub().withArgs('tx').yields({
          address: addr2.toString(),
        });
        w._setBlockchainListeners();
        spy.calledWith('tx', addr2.toString(), true).should.be.true;
        done();
      });
    });
  });

  describe('#fromObj / #toObj', function() {
    var storage = new Storage(walletConfig.storage);
    var network = new Network(walletConfig.network);
    var blockchain = new Blockchain(walletConfig.blockchain);

    it('Import backup using old copayerIndex', function() {
      var w = Wallet.fromObj(JSON.parse(o), storage, network, blockchain);

      should.exist(w);
      w.id.should.equal("dbfe10c3fae71cea");
      should.exist(w.publicKeyRing.getCopayerId);
      should.exist(w.txProposals.toObj());
      should.exist(w.privateKey.toObj());
      assertObjectEqual(w.toObj(), JSON.parse(o));
    });

    it('#fromObj, skipping fields', function() {
      var w = Wallet.fromObj(JSON.parse(o), storage, network, blockchain, ['publicKeyRing']);

      should.exist(w);
      w.id.should.equal("dbfe10c3fae71cea");
      should.exist(w.publicKeyRing.getCopayerId);
      should.exist(w.txProposals.toObj());
      should.exist(w.privateKey.toObj());
      (function() {
        assertObjectEqual(w.toObj(), JSON.parse(o))
      }).should.throw();
    });

    it('support old index schema: #fromObj #toObj round trip', function() {
      var o = '{"opts":{"id":"dbfe10c3fae71cea","spendUnconfirmed":1,"requiredCopayers":3,"totalCopayers":5,"version":"0.0.5"},"networkNonce":"0000000000000001","networkNonces":[],"publicKeyRing":{"walletId":"dbfe10c3fae71cea","networkName":"testnet","requiredCopayers":3,"totalCopayers":5,"indexes":{"changeIndex":0,"receiveIndex":0},"copayersBackup":[],"copayersExtPubKeys":["tpubD6NzVbkrYhZ4YGK8ZhZ8WVeBXNAAoTYjjpw9twCPiNGrGQYFktP3iVQkKmZNiFnUcAFMJRxJVJF6Nq9MDv2kiRceExJaHFbxUCGUiRhmy97","tpubD6NzVbkrYhZ4YKGDJkzWdQsQV3AcFemaQKiwNhV4RL8FHnBFvinidGdQtP8RKj3h34E65RkdtxjrggZYqsEwJ8RhhN2zz9VrjLnrnwbXYNc","tpubD6NzVbkrYhZ4YkDiewjb32Pp3Sz9WK2jpp37KnL7RCrHAyPpnLfgdfRnTdpn6DTWmPS7niywfgWiT42aJb1J6CjWVNmkgsMCxuw7j9DaGKB","tpubD6NzVbkrYhZ4XEtUAz4UUTWbprewbLTaMhR8NUvSJUEAh4Sidxr6rRPFdqqVRR73btKf13wUjds2i8vVCNo8sbKrAnyoTr3o5Y6QSbboQjk","tpubD6NzVbkrYhZ4Yj9AAt6xUVuGPVd8jXCrEE6V2wp7U3PFh8jYYvVad31b4VUXEYXzSnkco4fktu8r4icBsB2t3pCR3WnhVLedY2hxGcPFLKD"],"nicknameFor":{}},"txProposals":{"txps":[],"walletId":"dbfe10c3fae71cea","networkName":"testnet"},"privateKey":{"extendedPrivateKeyString":"tprv8ZgxMBicQKsPeoHLg3tY75z4xLeEe8MqAXLNcRA6J6UTRvHV8VZTXznt9eoTmSk1fwSrwZtMhY3XkNsceJ14h6sCXHSWinRqMSSbY8tfhHi","networkName":"testnet"},"addressBook":{}}';
      var o2 = '{"opts":{"id":"dbfe10c3fae71cea","spendUnconfirmed":1,"requiredCopayers":3,"totalCopayers":5,"version":"0.0.5","networkName":"testnet"},"networkNonce":"0000000000000001","networkNonces":[],"publicKeyRing":{"walletId":"dbfe10c3fae71cea","networkName":"testnet","requiredCopayers":3,"totalCopayers":5,"indexes":[{"copayerIndex":2147483647,"changeIndex":0,"receiveIndex":0},{"copayerIndex":0,"changeIndex":0,"receiveIndex":0},{"copayerIndex":1,"changeIndex":0,"receiveIndex":0},{"copayerIndex":2,"changeIndex":0,"receiveIndex":0},{"copayerIndex":3,"changeIndex":0,"receiveIndex":0},{"copayerIndex":4,"changeIndex":0,"receiveIndex":0}],"copayersBackup":[],"copayersExtPubKeys":["tpubD6NzVbkrYhZ4YGK8ZhZ8WVeBXNAAoTYjjpw9twCPiNGrGQYFktP3iVQkKmZNiFnUcAFMJRxJVJF6Nq9MDv2kiRceExJaHFbxUCGUiRhmy97","tpubD6NzVbkrYhZ4YKGDJkzWdQsQV3AcFemaQKiwNhV4RL8FHnBFvinidGdQtP8RKj3h34E65RkdtxjrggZYqsEwJ8RhhN2zz9VrjLnrnwbXYNc","tpubD6NzVbkrYhZ4YkDiewjb32Pp3Sz9WK2jpp37KnL7RCrHAyPpnLfgdfRnTdpn6DTWmPS7niywfgWiT42aJb1J6CjWVNmkgsMCxuw7j9DaGKB","tpubD6NzVbkrYhZ4XEtUAz4UUTWbprewbLTaMhR8NUvSJUEAh4Sidxr6rRPFdqqVRR73btKf13wUjds2i8vVCNo8sbKrAnyoTr3o5Y6QSbboQjk","tpubD6NzVbkrYhZ4Yj9AAt6xUVuGPVd8jXCrEE6V2wp7U3PFh8jYYvVad31b4VUXEYXzSnkco4fktu8r4icBsB2t3pCR3WnhVLedY2hxGcPFLKD"],"nicknameFor":{}},"txProposals":{"txps":[],"walletId":"dbfe10c3fae71cea","networkName":"testnet"},"privateKey":{"extendedPrivateKeyString":"tprv8ZgxMBicQKsPeoHLg3tY75z4xLeEe8MqAXLNcRA6J6UTRvHV8VZTXznt9eoTmSk1fwSrwZtMhY3XkNsceJ14h6sCXHSWinRqMSSbY8tfhHi","networkName":"testnet"},"addressBook":{}}';

      var w = Wallet.fromObj(JSON.parse(o), storage, network, blockchain);

      should.exist(w);
      w.id.should.equal("dbfe10c3fae71cea");
      should.exist(w.publicKeyRing.getCopayerId);
      should.exist(w.txProposals.toObj);
      should.exist(w.privateKey.toObj);

      assertObjectEqual(w.toObj(), JSON.parse(o2));
    });
  });

  describe('#read', function() {

    var s = function() {};

    var storage = new s();
    var network = new Network(walletConfig.network);
    var blockchain = new Blockchain(walletConfig.blockchain);


    it('should fail to read an unexisting wallet', function(done) {
      s.getFirst = sinon.stub().yields(null);

      Wallet.read('123', s, network, blockchain,[],  function(err, w) {
        err.toString().should.contain('WNOTFOUND');
        done();
      });
    });

    it('should not read a corrupted wallet', function(done) {

      s.getFirst = sinon.stub().yields(null, '{hola:1}');

      Wallet.read('123', s, network, blockchain,[],  function(err, w) {
        err.toString().should.contain('WERROR');
        done();
      });
    });

    it('should read a wallet', function(done) {
      s.getFirst = sinon.stub().yields(null, JSON.parse(o));
      Wallet.read('123', s, network, blockchain,[],  function(err, w) {
        should.not.exist(err);
        done();
      });
    });
  });


  // DATA
  var o = '{"opts":{"id":"dbfe10c3fae71cea", "spendUnconfirmed":1,"requiredCopayers":3,"totalCopayers":5,"version":"0.0.5","networkName":"testnet"},"networkNonce":"0000000000000001","networkNonces":[],"publicKeyRing":{"walletId":"dbfe10c3fae71cea","networkName":"testnet","requiredCopayers":3,"totalCopayers":5,"indexes":[{"copayerIndex":2,"changeIndex":0,"receiveIndex":0}],"copayersBackup":[],"copayersExtPubKeys":["tpubD6NzVbkrYhZ4YGK8ZhZ8WVeBXNAAoTYjjpw9twCPiNGrGQYFktP3iVQkKmZNiFnUcAFMJRxJVJF6Nq9MDv2kiRceExJaHFbxUCGUiRhmy97","tpubD6NzVbkrYhZ4YKGDJkzWdQsQV3AcFemaQKiwNhV4RL8FHnBFvinidGdQtP8RKj3h34E65RkdtxjrggZYqsEwJ8RhhN2zz9VrjLnrnwbXYNc","tpubD6NzVbkrYhZ4YkDiewjb32Pp3Sz9WK2jpp37KnL7RCrHAyPpnLfgdfRnTdpn6DTWmPS7niywfgWiT42aJb1J6CjWVNmkgsMCxuw7j9DaGKB","tpubD6NzVbkrYhZ4XEtUAz4UUTWbprewbLTaMhR8NUvSJUEAh4Sidxr6rRPFdqqVRR73btKf13wUjds2i8vVCNo8sbKrAnyoTr3o5Y6QSbboQjk","tpubD6NzVbkrYhZ4Yj9AAt6xUVuGPVd8jXCrEE6V2wp7U3PFh8jYYvVad31b4VUXEYXzSnkco4fktu8r4icBsB2t3pCR3WnhVLedY2hxGcPFLKD"],"nicknameFor":{}},"txProposals":{"txps":[],"walletId":"dbfe10c3fae71cea","networkName":"testnet"},"privateKey":{"extendedPrivateKeyString":"tprv8ZgxMBicQKsPeoHLg3tY75z4xLeEe8MqAXLNcRA6J6UTRvHV8VZTXznt9eoTmSk1fwSrwZtMhY3XkNsceJ14h6sCXHSWinRqMSSbY8tfhHi","networkName":"testnet"},"addressBook":{},"settings":{"unitName":"BTC","unitToSatoshi":100000000,"unitDecimals":8,"alternativeName":"Argentine Peso","alternativeIsoCode":"ARS"}}';

});
