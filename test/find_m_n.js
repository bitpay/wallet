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


var N_LIMIT = 20;
var nn = 'livenet';

for (var n = 1; n <= N_LIMIT; n++) {
  var end = false;
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
      'txid': '82a974b72d3135152043989652e687e2966c651ba4822274926221017ea072d2',
      'vout': 1,
      'ts': 1400696213,
      'scriptPubKey': 'a914b2562c950498ff48ad3479ca1c2dfda2b0273e2287',
      'amount': 10.0,
      'confirmations': 2
    }];
    var ntxid = w.createTxSync(toAddress, amount, utxos);
    console.log('\t ntxid =' + ntxid);
    var txp = w.txProposals.txps[ntxid];
    var tx = txp.builder.build();
    var scriptSig = tx.ins[0].getScript();
    var size = scriptSig.serialize().length;
    console.log('\t scriptSig size: '+size);
    if (size > 500) {
      if (m === 1) {
        end = true;
      }
      break;
    }
  }
  if (end) break;
}
