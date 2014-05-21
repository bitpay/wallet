#!/usr/bin/env node

'use strict';

var async = require('async');
var bitcore = require('bitcore');
var PublicKeyRing = require('../js/models/core/PublicKeyRing');
var PrivateKey = require('../js/models/core/PrivateKey');

var FakeNetwork = require('./mocks/FakeNetwork');
var Insight = require('../js/models/blockchain/Insight');
var FakeStorage = require('./mocks/FakeStorage');

var WalletFactory = require('soop').load('../js/models/core/WalletFactory', {
  Network: FakeNetwork,
  Blockchain: Insight,
  Storage: FakeStorage,
});
var Key = bitcore.Key;


var N_LIMIT = 16;
var nn = 'livenet';

for (var n = 1; n < N_LIMIT; n++) {
  for (var m = 1; m <= n; m++) {
    // case m-of-n
    console.log('case ' + m + '-of-' + n);
    // create full pkr
    var publicKeyRing = new PublicKeyRing({
      networkName: nn,
      requiredCopayers: m,
      totalCopayers: n,
    });
    var privateKey = null;
    var pks = [];
    for (var i = 0; i < n; i++) {
      var pk = new PrivateKey({
        networkName: nn
      });
      if (i === 0) {
        privateKey = pk;
      } else {
        publicKeyRing.addCopayer(pk.getExtendedPublicKeyString(), 'dummy');
      }
      pks.push(pk);
    }

    var opts = {};
    opts.publicKeyRing = publicKeyRing;
    opts.privateKey = privateKey;
    opts.requiredCopayers = m;
    opts.totalCopayers = n;
    opts.spendUnconfirmed = true;
    opts.version = 'script'

    var w = new WalletFactory(opts).create(opts);
    var addr = w.generateAddress();
    console.log('\t receive addr=' + addr);


    var toAddress = 'msj42CCGruhRsFrGATiUuh25dtxYtnpbTx';
    var amount = '5000000';
    // create fake utxo
    var utxos = [{
      'address': addr,
      'txid': '659e4e6d9c840e57aee6ebe35f2511cdeb848d786938f0b6b4f1b00de09b29da',
      'vout': 1,
      'ts': 1400682132,
      'scriptPubKey': 'a914e4a6744eeed5571cff9e427cbb5dd5e1a2d1b2fa87',
      'amount': 10.000,
      'confirmations': 100
    }];
    var ntxid = w.createTxSync(toAddress, amount, utxos);
    console.log('\t ntxid =' + ntxid);
    var sign = function(pk, cb) {
      w.sign(ntxid, cb);
    }
    async.each(pks, sign, function(err) {
      if (err) {
        throw new Error(err);
      }
    });
    var txp = w.txProposals.txps[ntxid];
    var tx = txp.builder.build();
    console.log(tx.isComplete());
    var scriptSig = tx.ins[0].getScript();
    console.log(scriptSig.toHumanReadable());
    console.log(scriptSig.serialize().length);
  }
}
