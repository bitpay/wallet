'use strict';

var chai = chai || require('chai');
var should = chai.should();
var copay = copay || require('../copay');
var Wallet = require('../js/models/core/Wallet');
var Storage= require('./mocks/FakeStorage');
var Network= require('./mocks/FakeNetwork');
var Blockchain= copay.Insight;

var addCopayers = function (w) {
  for(var i=0; i<4; i++) {
    w.publicKeyRing.addCopayer();
  }
};

describe('Wallet model', function() {

  var config = {
    requiredCopayers: 3,
    totalCopayers: 5,
    spendUnconfirmed: 1,
    blockchain: {
      host: 'test.insight.is',
      port: 80
    },
    networkName: 'testnet',
  };

  it('should fail to create an instance', function () {
    (function(){new Wallet(config)}).should.throw();
  });

  var createW = function (netKey) {
    var c = JSON.parse(JSON.stringify(config));
    
    if (netKey) c.netKey = netKey;
    c.privateKey = new copay.PrivateKey({ networkName: c.networkName });

    c.publicKeyRing = new copay.PublicKeyRing({
      networkName: c.networkName,
      requiredCopayers: c.requiredCopayers,
      totalCopayers: c.totalCopayers,
    });
    c.publicKeyRing.addCopayer(c.privateKey.getExtendedPublicKeyString());

    c.txProposals = new copay.TxProposals({
      networkName: c.networkName,
    });
    c.storage     = new Storage(config.storage);
    c.network     = new Network(config.network);
    c.blockchain  = new Blockchain(config.blockchain);

    c.networkName = config.networkName;
    c.verbose     = config.verbose;
    c.version     = '0.0.1';

    return new Wallet(c);
  }

  it('should create an instance', function () {
    var w = createW();
    should.exist(w);
    w.publicKeyRing.walletId.should.equal(w.id);
    w.txProposals.walletId.should.equal(w.id);
    w.requiredCopayers.should.equal(3);
    should.exist(w.id);
    should.exist(w.publicKeyRing);
    should.exist(w.privateKey);
    should.exist(w.txProposals);
    should.exist(w.netKey);
    var b = new Buffer(w.netKey,'base64');
    b.toString('hex').length.should.equal(16);
  });

  it('should provide some basic features', function () {
    var opts = {};
    var w = createW();
    addCopayers(w);
    w.publicKeyRing.generateAddress(false);
    w.publicKeyRing.isComplete().should.equal(true);
  });

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

  var createW2 = function (privateKeys) {
    var netKey = 'T0FbU2JLby0=';
    var w = createW(netKey);
    should.exist(w);

    var pkr =  w.publicKeyRing;

    for(var i=0; i<4; i++) {
      if (privateKeys) {
        var k=privateKeys[i];
        pkr.addCopayer(k?k.getExtendedPublicKeyString():null);
      }
      else 
        pkr.addCopayer();
    }
    pkr.generateAddress(true);
    pkr.generateAddress(true);
    pkr.generateAddress(true);
    pkr.generateAddress(false);
    pkr.generateAddress(false);
    pkr.generateAddress(false);
    //3x3 indexes

    return w;
  };

  it('#create, 1 sign', function () {

    var w = createW2();

    unspentTest[0].address        = w.publicKeyRing.getAddress(1, true).toString();
    unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(1, true);

    w.createTxSync(
      '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
      '123456789', 
      unspentTest
    );

    var t = w.txProposals;
    var k = Object.keys(t.txps)[0];
    var tx = t.txps[k].builder.build();
    should.exist(tx);
    tx.isComplete().should.equal(false);
    Object.keys(t.txps[k].signedBy).length.should.equal(1);
    Object.keys(t.txps[k].seenBy).length.should.equal(1);
  });

  it('#addressIsOwn', function () {
    var w = createW2();
    var l = w.getAddressesStr();
    for (var i=0; i<l.length; i++)
      w.addressIsOwn(l[i]).should.equal(true);

    w.addressIsOwn(l[0], {excludeMain:true}).should.equal(false);

    w.addressIsOwn('mmHqhvTVbxgJTnePa7cfweSRjBCy9bQQXJ').should.equal(false);
    w.addressIsOwn('mgtUfP9sTJ6vPLoBxZLPEccGpcjNVryaCX').should.equal(false);
  });

  it('#create. Signing with derivate keys', function () {

    var w = createW2();

    var ts = Date.now();
    for (var isChange=0; isChange<2; isChange++) {
      for (var index=0; index<3; index++) {
        unspentTest[0].address        = w.publicKeyRing.getAddress(index, isChange).toString();
        unspentTest[0].scriptPubKey   = w.publicKeyRing.getScriptPubKeyHex(index, isChange);
        w.createTxSync(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
          '123456789', 
          unspentTest
        );
        var t = w.txProposals;
        var k = Object.keys(t.txps)[0];
        var tx = t.txps[k].builder.build();
        should.exist(tx);
        tx.isComplete().should.equal(false);
        tx.countInputMissingSignatures(0).should.equal(2);

        ( t.txps[k].signedBy[w.privateKey.getId()] - ts > 0).should.equal(true);
        ( t.txps[k].seenBy[w.privateKey.getId()] - ts > 0).should.equal(true);
      }
    }
  });

  it('#fromObj #toObj round trip', function () {

    var w = createW2();

    var o = w.toObj();
    o = JSON.parse(JSON.stringify(o));

    var w2 = Wallet.fromObj(o,
       new Storage(config.storage),
       new Network(config.network),
       new Blockchain(config.blockchain));
    should.exist(w2);
    w2.publicKeyRing.requiredCopayers.should.equal(w.publicKeyRing.requiredCopayers);
    should.exist(w2.publicKeyRing.getCopayerId);
    should.exist(w2.txProposals.toObj);
    should.exist(w2.privateKey.toObj);
  });

  it('#getSecret decodeSecret', function () {
    var w = createW2();
    var id = w.getMyCopayerId();
    var nk = w.netKey;

    var sb= w.getSecret();
    should.exist(sb);
    var s = Wallet.decodeSecret(sb);
    s.pubKey.should.equal(id);
    s.netKey.should.equal(nk);

  });
  it('decodeSecret check', function () {
    (function(){Wallet.decodeSecret('4fp61K187CsYmjoRQC5iAdC5eGmbCRsAAXfwEwetSQgHvZs27eWKaLaNHRoKM');}).should.not.throw();
    (function(){Wallet.decodeSecret('4fp61K187CsYmjoRQC5iAdC5eGmbCRsAAXfwEwetSQgHvZs27eWKaLaNHRoK');}).should.throw();
    (function(){Wallet.decodeSecret('12345');}).should.throw();
  });
});
