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
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}
var fakeStorage = copay.FakeStorage;
var PrivateKey = copay.PrivateKey || require('../js/models/PrivateKey');
var TxProposals = copay.TxProposals || require('../js/models/TxProposal');
var is_browser = (typeof process == 'undefined' || typeof process.versions === 'undefined')
var PublicKeyRing = is_browser ? copay.PublicKeyRing :
  require('soop').load('../js/models/core/PublicKeyRing', {
    Storage: fakeStorage
  });

var config = {
  networkName: 'testnet',
};

var unspentTest = [{
  "address": "dummy",
  "scriptPubKey": "dummy",
  "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
  "vout": 1,
  "amount": 10,
  "confirmations": 7
}];

var createPKR = function(bip32s) {
  var w = new PublicKeyRing(config);
  should.exist(w);

  for (var i = 0; i < 5; i++) {
    if (bip32s && i < bip32s.length) {
      var b = bip32s[i];
      w.addCopayer(b.deriveBIP45Branch().extendedPublicKeyString());
    } else {
      w.addCopayer();
    }
  }

  var pubkey = bip32s[0].publicHex;

  w.generateAddress(false, pubkey);
  w.generateAddress(false, pubkey);
  w.generateAddress(false, pubkey);
  w.generateAddress(true, pubkey);
  w.generateAddress(true, pubkey);
  w.generateAddress(true, pubkey);

  return w;
};

var vopts = {
  verifyP2SH: true,
  dontVerifyStrictEnc: true
};


describe('TxProposals model', function() {

  var isChange = false;
  var index = 0;

  it('verify TXs', function(done) {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
    var pub = priv.publicHex;

    var ts = Date.now();
    var pkr = createPKR([priv, priv2, priv3]);
    var opts = {
      remainderOut: {
        address: pkr.generateAddress(true, pub).toString()
      }
    };

    var w = new TxProposals({
      networkName: config.networkName,
    });

    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv,
      pkr
    ));
    var ntxid = Object.keys(w.txps)[0];
    var b = w.txps[ntxid].builder;
    var tx = b.build();
    tx.isComplete().should.equal(false);

    var ringIndex = pkr.getIndex(pub);
    b.sign(priv2.getAll(ringIndex.getReceiveIndex(), ringIndex.getChangeIndex(), ringIndex.cosigner));
    b.sign(priv3.getAll(ringIndex.getReceiveIndex(), ringIndex.getChangeIndex(), ringIndex.cosigner));
    tx = b.build();
    tx.isComplete().should.equal(true);

    var s = new Script(new bitcore.Buffer(unspentTest[0].scriptPubKey, 'hex'));

    tx.verifyInput(0, s, {
      verifyP2SH: true,
      dontVerifyStrictEnc: true
    }, function(err, results) {
      should.not.exist(err);
      results.should.equal(true);
      done();
    });
  });


  it('should create an instance', function() {
    var w = new TxProposals({
      networkName: config.networkName
    });
    should.exist(w);
    w.network.name.should.equal(config.networkName);
  });

  var createTx = function(toAddress, amountSatStr, utxos, opts, priv, pkr) {
    opts = opts || {};

    var pub = priv.publicHex;

    if (!pkr.isComplete()) {
      throw new Error('publicKeyRing is not complete');
    }

    if (!opts.remainderOut) {
      opts.remainderOut = {
        address: pkr.generateAddress(true, pub).toString()
      };
    };

    var b = new TransactionBuilder(opts)
      .setUnspent(utxos)
      .setOutputs([{
        address: toAddress,
        amountSatStr: amountSatStr,
      }]);
    var selectedUtxos = b.getSelectedUnspent();
    var inputChainPaths = selectedUtxos.map(function(utxo) {
      return pkr.pathForAddress(utxo.address);
    });

    var selectedUtxos = b.getSelectedUnspent();
    var inputChainPaths = selectedUtxos.map(function(utxo) {
      return pkr.pathForAddress(utxo.address);
    });
    b.setHashToScriptMap(pkr.getRedeemScriptMap(inputChainPaths));

    var signRet;
    if (priv) {
      var pkeys = priv.getForPaths(inputChainPaths);
      b.sign(pkeys);
    }
    var me = {};
    if (priv) me[priv.getId()] = Date.now();

    var tx = b.build();

    return {
      inputChainPaths: inputChainPaths,
      creator: priv.getId(),
      createdTs: new Date(),
      signedBy: priv && tx.countInputSignatures(0) ? me : {},
      seenBy: priv ? me : {},
      builder: b,
    };
  };


  it('#getUsedUnspend', function() {
    var priv = new PrivateKey(config);
    var pub = priv.publicHex;

    var w = new TxProposals({
      networkName: config.networkName,
    });
    var start = new Date().getTime();
    var pkr = createPKR([priv]);
    var ts = Date.now();
    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest, {},
      priv,
      pkr
    ));
    var uu = w.getUsedUnspent();
    var uuk = Object.keys(uu);
    uuk.length.should.equal(1);
    uuk[0].split(',')[0].should.equal(unspentTest[0].txid);
  });

  it('#merge with self', function() {
    var priv = new PrivateKey(config);
    var pub = priv.publicHex;

    var w = new TxProposals({
      networkName: config.networkName,
    });
    var start = new Date().getTime();
    var pkr = createPKR([priv]);
    var ts = Date.now();

    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest, {},
      priv,
      pkr
    ));
    var ntxid = Object.keys(w.txps)[0];
    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    var x = priv.getId();
    (w.txps[ntxid].signedBy[priv.getId()] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);

    var info = w.merge(w.txps[ntxid], pkr.getCopayerId(0));
    info.events.length.should.equal(0);

    Object.keys(w.txps).length.should.equal(1);

    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);
  });



  it('#merge, merge signatures case 1', function() {
    var priv2 = new PrivateKey(config);
    var priv = new PrivateKey(config);
    var pub = priv.publicHex;

    var ts = Date.now();
    var pkr = createPKR([priv]);
    var opts = {
      remainderOut: {
        address: pkr.generateAddress(true, pub).toString()
      }
    };


    var w = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv2,
      pkr
    ));

    var ntxid = Object.keys(w.txps)[0];
    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputSignatures(0).should.equal(0);
    tx.countInputMissingSignatures(0).should.equal(1);

    Object.keys(w.txps[ntxid].signedBy).length.should.equal(0);
    Object.keys(w.txps[ntxid].seenBy).length.should.equal(1);


    var w2 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: w.publicKeyRing,
    });
    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w2.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv,
      pkr
    ));

    var ntxid = Object.keys(w.txps)[0];
    var tx = w2.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);


    (w2.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true, 'asdsd');
    (w2.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);

    var info = w.merge(w2.txps[ntxid], pkr.getCopayerId(0));
    info.events.length.should.equal(2);
    info.events[0].type.should.equal('seen');
    info.events[1].type.should.equal('signed');

    Object.keys(w.txps).length.should.equal(1);

    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);

  });

  var _dumpChunks = function(scriptSig, label) {
    console.log('## DUMP: ' + label + ' ##');
    for (var i = 0; i < scriptSig.chunks.length; i++) {
      console.log('\tCHUNK ', i, scriptSig.chunks[i]);
    }
  };


  it('#merge, merge signatures case 2', function() {

    var o1 = {
      extendedPrivateKeyString: 'tprv8ZgxMBicQKsPdSF1avR6mXyDj5Uv1XY2UyUHSDpAXQ5TvPN7prGeDppjy4562rBB9gMMAhRfFdJrNDpQ4t69kkqHNEEen3PX1zBJqSehJDH',
      networkName: 'testnet',
      privateKeyCache: {}
    };
    var o2 = {
      extendedPrivateKeyString: 'tprv8ZgxMBicQKsPdVeB5RzuxS9JQcACueZYgUaM5eWzaEBkHjW5Pg6Mqez1APSqoUP1jUdbT8WVG7ZJYTXvUL7XtPzFYBXjmdKuwSor1dcNQ8j',
      networkName: 'testnet',
      privateKeyCache: {}
    };
    var o3 = {
      extendedPrivateKeyString: 'tprv8ZgxMBicQKsPeHWNrPVZtQVgcCtXBr5TACNbDQ56rwqNJce9MEc64US6DJKxpWsrebEomxxWZFDtkvkZGkzA43uLvdF4XHiWqoNaL6Dq2Gd',
      networkName: 'testnet',
      privateKeyCache: {}
    };


    var priv = PrivateKey.fromObj(o1);
    var priv2 = PrivateKey.fromObj(o2);
    var priv3 = PrivateKey.fromObj(o3);
    var pub = priv.publicHex;

    var ts = Date.now();
    var pkr = createPKR([priv, priv2]);
    var opts = {
      remainderOut: {
        address: '2MxK2m7cPtEwjZBB8Ksq7ppjkgJyFPJGemr'
      }
    };
    var addressToSign = pkr.generateAddress(false, pub);
    unspentTest[0].address = addressToSign.toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    var tx, txb;

    var w = new TxProposals({
      networkName: config.networkName,
    });

    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv3,
      pkr
    ));

    var ntxid = Object.keys(w.txps)[0];
    txb = w.txps[ntxid].builder;
    tx = txb.build();

    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);

    Object.keys(w.txps[ntxid].signedBy).length.should.equal(0);
    Object.keys(w.txps[ntxid].seenBy).length.should.equal(1);

    var w2 = new TxProposals({
      networkName: config.networkName,
    });



    w2.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv,
      pkr
    ));
    var ntxid = Object.keys(w2.txps)[0];
    txb = w2.txps[ntxid].builder;
    tx = txb.build();

    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w2.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);

    var info = w.merge(w2.txps[ntxid], pkr.getCopayerId(0));
    info.events.length.should.equal(2);
    info.events[0].type.should.equal('seen');
    info.events[1].type.should.equal('signed');

    tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);


    var w3 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    w3.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv2,
      pkr
    ));
    tx = w3.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w3.txps[ntxid].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w3.txps[ntxid].seenBy[priv2.id] - ts > 0).should.equal(true);

    var info = w.merge(w3.txps[ntxid], pkr.getCopayerId(1));

    Object.keys(w.txps).length.should.equal(1);

    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv2.id] - ts > 0).should.equal(true);

    tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);
  });


  it('#merge, merge signatures case 3', function() {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
    var pub = priv.publicHex;


    var ts = Date.now();
    var pkr = createPKR([priv, priv2, priv3]);
    var opts = {
      remainderOut: {
        address: pkr.generateAddress(true, pub).toString()
      }
    };

    var w = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv,
      pkr
    ));
    var ntxid = Object.keys(w.txps)[0];
    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);


    var w2 = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w2.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv2,
      pkr
    ));
    var tx = w2.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w2.txps[ntxid].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w2.txps[ntxid].seenBy[priv2.id] - ts > 0).should.equal(true);

    var w3 = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w3.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest,
      opts,
      priv3,
      pkr
    ));
    var tx = w3.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w3.txps[ntxid].signedBy[priv3.id] - ts > 0).should.equal(true);
    (w3.txps[ntxid].seenBy[priv3.id] - ts > 0).should.equal(true);

    var info = w.merge(w2.txps[ntxid], pkr.getCopayerId(1));

    Object.keys(w.txps).length.should.equal(1);
    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].signedBy[priv2.id] - ts > 0).should.equal(true);


    var info = w.merge(w3.txps[ntxid], pkr.getCopayerId(2));

    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(true);
    tx.countInputMissingSignatures(0).should.equal(0);
    Object.keys(w.txps).length.should.equal(1);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv3.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].signedBy[priv3.id] - ts > 0).should.equal(true);
  });



  it('#toObj #fromObj roundtrip', function() {

    var priv = new PrivateKey(config);
    var pub = priv.publicHex;

    var pkr = createPKR([priv]);
    var w = new TxProposals({
      walletId: 'qwerty',
      networkName: config.networkName,
    });
    var ts = Date.now();

    unspentTest[0].address = pkr.getAddress(index, isChange, pub).toString();
    unspentTest[0].scriptPubKey = pkr.getScriptPubKeyHex(index, isChange, pub);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt',
      '123456789',
      unspentTest, {},
      priv,
      pkr
    ));
    var ntxid = Object.keys(w.txps)[0];
    var tx = w.txps[ntxid].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);

    var o = w.toObj();
    should.exist(o);
    o.txps.length.should.equal(1);

    should.exist(o.txps[0]);
    should.exist(o.txps[0].signedBy);
    should.exist(o.txps[0].seenBy);
    should.exist(o.txps[0].builderObj);
    should.exist(o.txps[0].signedBy[priv.id]);

    var o2 = JSON.parse(JSON.stringify(o));
    var w2 = TxProposals.fromObj(o2);
    w2.walletId.should.equal(w.walletId);

    var tx2 = w2.txps[ntxid].builder.build();
    tx2.isComplete().should.equal(false);
    tx2.countInputMissingSignatures(0).should.equal(2);
    (w2.txps[ntxid].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[ntxid].seenBy[priv.id] - ts > 0).should.equal(true);
    should.exist(w2.txps[ntxid].builder);
    should.exist(w2.txps[ntxid].builder.valueInSat);

    w2.merge(w.txps[ntxid], pkr.getCopayerId(0));
    Object.keys(w2.txps).length.should.equal(1);
  });

  describe('TxProposals model', function() {
    var createMockTxp = function(raw) {
      var tx = new Transaction();
      tx.parse(new Buffer(raw, 'hex'));
      var txb = new TransactionBuilder();
      var txp = new TxProposals.TxProposal({
        builder: txb
      });
      txb.build = function() {
        return tx;
      };
      return txp;
    };

    it('should validate for no signatures yet in tx', function() {
      // taken from https://gist.github.com/gavinandresen/3966071
      var raw = '010000000189632848f99722915727c5c75da8db2dbf194342a0429828f66ff88fab2af7d60000000000ffffffff0140420f000000000017a914f815b036d9bbbce5e9f2a00abd1bf3dc91e955108700000000';
      var txp = createMockTxp(raw);
      txp.isValid().should.equal(true);
    });
    it('should validate for no signatures yet in copay generated tx', function() {
      // taken from copay incomplete tx proposal
      var raw = '0100000001e205297fd05e4504d72761dc7a16e5cc9f4ab89877f28aee97c1cc66b3f07d690100000000ffffffff01706f9800000000001976a91473707e88f79c9c616b44bc766a25efcb9f49346688ac00000000';
      var txp = createMockTxp(raw);
      txp.isValid().should.equal(true);
    });
    it('should validate for a SIGHASH_NONE tx in builder', function() {
      var raw = '010000000145c3bf51ced6cefaea8c6578a645316270dbf8600f46969d31136e1e06829598000000007000483045022100877c715e0f3bd6377086c96d4757b2c983682a1934d9e3f894941f4f1e18d4710220272ed81758d7a391ee4c15a29246f3fe75efbddeaf1118e4c0d3bb14f57cdba601255121022f58491a833933a9bea80d8e820e66bee91bd8c71bfa972fe70482360b48129951aeffffffff01706f9800000000001976a91408328947f0caf8728729d740cbecdfe3c2327db588ac00000000';
      var txp = createMockTxp(raw);
      txp.isValid().should.equal(true);
    });
    it('should not validate for a non SIGHASH_NONE tx in builder with 1 input', function() {
      var raw = '0100000001eaf08f93f895127fbf000128ac74f6e8c7f003854e5ee1f02a5fd820cb689beb00000000fdfe00004730440220778f3174393e9ee6b0bfa876b4150db6f12a4da9715044ead5e345c2781ceee002203aab31f1e1d3dcf77ca780d9af798139719891917c9a09123dba54483ef462bc02493046022100dd93b64b30580029605dbba09d7fa34194d9ff38fda0c4fa187c52bf7f79ae98022100dd7b056762087b9aa8ccfde328d7067fa1753b78c0ee25577122569ff9de1d57024c695221039f847c24f09d7299c10bba4e41b24dc78e47bbb05fd7c1d209c994899d6881062103d363476e634fc5cdc11e9330c05a141c1e0c7f8b616817bdb83e7579bbf870942103fb2072953ceab87c6da450ac661685a881ddb661002d2ec1d60bfd33e3ec807d53aeffffffff01d06bf5050000000017a914db682f579cf6ca483880460fcf4ab63e223dc07e8700000000';
      var txp = createMockTxp(raw);
      txp.isValid().should.equal(false);
    });
    it('should not validate for a non SIGHASH_NONE tx in builder with 1 input', function() {
      var raw = '0100000002d903852d223b3100fcc01e0b02d73a76a0787cdff7d000e9cba0e931917f407501000000fdfe0000493046022100b232e994fdca7fd61fcf8ffe4a7f746ff8f8baf2667ac80841de0250f521c402022100862c0783ca7eafcbd2786b9444ed6e83ae941dcc2248bea4db12b7815d15de050247304402200189fe0cde9d1dd192553f4dddb6764df3eb643f9f71be8aa015f41f2d4fd11f02205513b8ca985c3b5b936f814c7eba92e2e2985c83927ca06c41081d264c0be7a7024c695221026fa1a3ed0c820c1053c8ba101f3c96f85c55624a902a82cf6b2896ed5f9b3d1521035a3383c13dd346a5784adfe3ec3026ab31d519fdfae2740497b10bdfb994e6442103c7477a6668d5bc250fe727e358d951b9e05f1d7c02059bf59ecbb335f1eeec7953aeffffffffd903852d223b3100fcc01e0b02d73a76a0787cdff7d000e9cba0e931917f407500000000fdfd0000483045022100bdb9d14569af66d84af63416d77296ace24a96f1720d30e74bc6e316a4b3727502206ed54d532467393488889d72edbb667d075de491a89e8e496fee8791b943fa37024730440220379c30c884a21a949d8ec32d6934ffa9faf86add4d839de0f5fbd2b90f8ef1e802204048df2ec0035ce5e4bf01e9d70fd93a45a41ce2630100d692cd908cdaa61fc0024c69522102203938ef947327edce2cf2997c55b433be3d3ffcf3284c10d6fcdf4b01c6221f21033b60c3363a226ce9b850af655c6e1470d9a0936d7f56ea4a07ab84005f91cd1b210385755bc813fe7f92577b93bf689bf0d9b2118e6bbb7fee5d3d16976f4f7271af53aeffffffff01c02d9a3b0000000017a914db682f579cf6ca483880460fcf4ab63e223dc07e8700000000';
      var txp = createMockTxp(raw);
      txp.isValid().should.equal(false);
    });
  });
});
