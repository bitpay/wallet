'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var Transaction        = bitcore.Transaction;
var buffertools    = bitcore.buffertools;
var WalletKey    = bitcore.WalletKey;
var Key    = bitcore.Key;
var bignum         = bitcore.bignum;
var Script         = bitcore.Script;
var Builder     = bitcore.TransactionBuilder;
var util         = bitcore.util;
var networks         = bitcore.networks;
var copay          = copay || require('../copay');
var fakeStorage    = copay.FakeStorage;
var PrivateKey    = copay.PrivateKey || require('../js/models/PrivateKey');
var TxProposals    = copay.TxProposals || require('../js/models/TxProposal');
var PublicKeyRing  = is_browser ? copay.PublicKeyRing :
  require('soop').load('../js/models/core/PublicKeyRing', {Storage: fakeStorage});
var is_browser = (typeof process.versions === 'undefined') 

var config = {
  networkName:'livenet',
};

var unspentTest = [
    {
      "address": "dummy",
      "scriptPubKey": "dummy",
      "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
      "vout": 1,
      "amount": 10,
      "confirmations":7
    }
];

var createPKR = function (bip32s) {
  var w = new PublicKeyRing(config);
  should.exist(w);

  for(var i=0; i<5; i++) {
    if (bip32s) {
      var b=bip32s[i];
      w.addCopayer(b?b.getExtendedPublicKeyString():null);
    }
    else 
      w.addCopayer();
  }
   w.generateAddress(true);
   w.generateAddress(true);
   w.generateAddress(true);
   w.generateAddress(false);
   w.generateAddress(false);
   w.generateAddress(false);
   //3x3 indexes
  
  return w;
};

var vopts =  {
  verifyP2SH: true,
  dontVerifyStrictEnc: true
};


describe('TxProposals model', function() {


  it('verify TXs', function (done) {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
   var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv, priv2,  priv3]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};

    var w = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv,
      pkr
    ));
    var k = Object.keys(w.txps)[0];
    var b = w.txps[k].builder;
    var tx = b.build();
    tx.isComplete().should.equal(false);
    b.sign( priv2.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
    b.sign( priv3.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
    tx = b.build();
    tx.isComplete().should.equal(true);

    var s = new Script(new Buffer(unspentTest[0].scriptPubKey,'hex'));

    tx.verifyInput(0,s, {
      verifyP2SH: true,
      dontVerifyStrictEnc: true
    }, function(err, results){
         should.not.exist(err);
         results.should.equal(true);
      done();
    });
  });
 

  it('should create an instance', function () {
    var w = new TxProposals({
      networkName: config.networkName
    });
    should.exist(w);
    w.network.name.should.equal('livenet');
  });

  function createTx(toAddress, amountSatStr, utxos, opts, priv, pkr) {
    opts = opts || {};

    var amountSat = bitcore.bignum(amountSatStr);

    if(! pkr.isComplete() ) {
      throw new Error('publicKeyRing is not complete');
    }

    if (!opts.remainderOut) {
      opts.remainderOut ={ address: pkr.generateAddress(true).toString() };
    };

    var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{address: toAddress, amountSat: amountSat}])
    ;

    var signRet;  
    if (priv) {
      b.sign( priv.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
    }
    var me = {};
    if (priv) me[priv.id] = Date.now();

    return {
      signedBy: priv && b.signaturesAdded ? me : {},
      seenBy:   priv ? me : {},
      builder: b,
    };
  };


  it('#getUsedUnspend', function () {
    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
    });
    var start = new Date().getTime();
    var pkr=createPKR([priv]);
    var ts = Date.now();
    var isChange=0; 
    var index=0; 
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      {},
      priv,
      pkr
    ));
    w.getUsedUnspent().length.should.equal(1);
    w.getUsedUnspent()[0].should.equal(unspentTest[0].txid);
  });

  it('#merge with self', function () {
    var priv = new PrivateKey(config);
    var w = new TxProposals({
      networkName: config.networkName,
    });
    var start = new Date().getTime();
    var pkr=createPKR([priv]);
    var ts = Date.now();
    var isChange=0; 
    var index=0; 

    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      {},
      priv,
      pkr
    ));
    var k = Object.keys(w.txps)[0];
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);

    w.merge(w);
    Object.keys(w.txps).length.should.equal(1);

    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);
  });



  it('#merge, merge signatures case 1', function () {
    var priv2 = new PrivateKey(config);
    var priv = new PrivateKey(config);
    var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};


    var w = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv2,
      pkr
    ));

    var k = Object.keys(w.txps)[0];
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);

    Object.keys(w.txps[k].signedBy).length.should.equal(0);
    Object.keys(w.txps[k].seenBy).length.should.equal(1);


    var w2 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: w.publicKeyRing,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w2.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv,
      pkr
    ));

    var k = Object.keys(w.txps)[0];
    var tx = w2.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w2.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);

    w.merge(w2);
    Object.keys(w.txps).length.should.equal(1);

    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);
 
  });

var _dumpChunks = function (scriptSig, label) {
   console.log('## DUMP: ' + label + ' ##');
   for(var i=0; i<scriptSig.chunks.length; i++) {
     console.log('\tCHUNK ', i, scriptSig.chunks[i]); 
   }
};


  it('#merge, merge signatures case 2', function () {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
   var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv, priv2]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};

    var w = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);

    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv3,
      pkr
    ));

    var k = Object.keys(w.txps)[0];
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);

    Object.keys(w.txps[k].signedBy).length.should.equal(0);
    Object.keys(w.txps[k].seenBy).length.should.equal(1);


    var w2 = new TxProposals({
      networkName: config.networkName,
    });

    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w2.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv,
      pkr
    ));
    var k = Object.keys(w2.txps)[0];
    tx = w2.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w2.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);

    w.merge(w2);
    Object.keys(w.txps).length.should.equal(1);

    tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);


    var w3 = new TxProposals({
      networkName: config.networkName,
      publicKeyRing: pkr,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w3.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv2,
      pkr
    ));
    tx = w3.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);

    (w3.txps[k].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w3.txps[k].seenBy[priv2.id] - ts > 0).should.equal(true);

    w.merge(w3);
    Object.keys(w.txps).length.should.equal(1);

    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv2.id] - ts > 0).should.equal(true);

    tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);
  });


  it('#merge, merge signatures case 3', function () {

    var priv = new PrivateKey(config);
    var priv2 = new PrivateKey(config);
    var priv3 = new PrivateKey(config);
   var ts = Date.now();
    var isChange=0; 
    var index=0; 
    var pkr = createPKR([priv, priv2,  priv3]);
    var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};

    var w = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv,
      pkr
    ));
    var k = Object.keys(w.txps)[0];
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);


    var w2 = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w2.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv2,
      pkr
    ));
    var tx = w2.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w2.txps[k].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w2.txps[k].seenBy[priv2.id] - ts > 0).should.equal(true);


    var w3 = new TxProposals({
      networkName: config.networkName,
    });
    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w3.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      opts,
      priv3,
      pkr
    ));
    var tx = w3.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w3.txps[k].signedBy[priv3.id] - ts > 0).should.equal(true);
    (w3.txps[k].seenBy[priv3.id] - ts > 0).should.equal(true);

    w.merge(w2);
    Object.keys(w.txps).length.should.equal(1);
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(1);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].signedBy[priv2.id] - ts > 0).should.equal(true);


    w.merge(w3);
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(true);
    tx.countInputMissingSignatures(0).should.equal(0);
    Object.keys(w.txps).length.should.equal(1);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv3.id] - ts > 0).should.equal(true);
    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].signedBy[priv2.id] - ts > 0).should.equal(true);
    (w.txps[k].signedBy[priv3.id] - ts > 0).should.equal(true);
  });



  it('#toObj #fromObj roundtrip', function () {

    var priv = new PrivateKey(config);
    var pkr = createPKR([priv]);
    var w = new TxProposals({
      walletId: 'qwerty',
      networkName: config.networkName,
    });
    var ts = Date.now();
    var isChange=0; 
    var index=0; 

    unspentTest[0].address        = pkr.getAddress(index, isChange).toString();
    unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(index, isChange);
    w.add(createTx(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest,
      {},
      priv,
      pkr
    ));
    var k = Object.keys(w.txps)[0];
    var tx = w.txps[k].builder.build();
    tx.isComplete().should.equal(false);
    tx.countInputMissingSignatures(0).should.equal(2);
    (w.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);

    var o = w.toObj();
    should.exist(o);
    o.txps.length.should.equal(1);
    should.exist(o.txps[0]);
    should.exist(o.txps[0].signedBy);
    should.exist(o.txps[0].seenBy);
    should.exist(o.txps[0].builderObj);
    should.exist(o.txps[0].builderObj.valueInSat);
    should.exist(o.txps[0].signedBy[priv.id]);

    var o2 = JSON.parse(JSON.stringify(o));
    var w2 = TxProposals.fromObj(o2);
    w2.walletId.should.equal(w.walletId);
    var tx2 = w2.txps[k].builder.build();
    tx2.isComplete().should.equal(false);
    tx2.countInputMissingSignatures(0).should.equal(2);
    (w2.txps[k].signedBy[priv.id] - ts > 0).should.equal(true);
    (w2.txps[k].seenBy[priv.id] - ts > 0).should.equal(true);
    should.exist(w2.txps[k].builder);
    should.exist(w2.txps[k].builder.valueInSat);
 
    w2.merge(w);
    Object.keys(w2.txps).length.should.equal(1);
  });


});
