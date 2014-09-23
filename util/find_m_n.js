#!/usr/bin/env node

'use strict';

var async = require('async');
var bitcore = require('bitcore');
var chai = require('chai');
var should = chai.should();
var PublicKeyRing = require('../js/models/PublicKeyRing');
var PrivateKey = require('../js/models/PrivateKey');

var FakeNetwork = require('../test/mocks/FakeNetwork');
var Insight = require('../js/models/blockchain/Insight');
var FakeStorage = require('../test/mocks/FakeStorage');

var WalletFactory = require('soop').load('../js/models/WalletFactory', {
  Network: FakeNetwork,
  Blockchain: Insight,
  Storage: FakeStorage,
});
var Key = bitcore.Key;


var N_LIMIT = 50;
var ITERS = 5;
var nn = 'livenet';

var maxs = {};
var valid = {};

for (var n = 1; n <= N_LIMIT; n++) {
  var end = false;
  for (var m = 1; m <= n; m++) {
    // case m-of-n
    console.log('case ' + m + '-of-' + n);
    var pair = [m, n];
    for (var iter = 0; iter <= ITERS * n; iter++) {
      // create full pkr
      var publicKeyRing = new PublicKeyRing({
        networkName: nn,
        requiredCopayers: m,
        totalCopayers: n,
      });
      var privateKey = null;
      var others_pks = [];
      for (var i = 0; i < n; i++) {
        var pk = new PrivateKey({
          networkName: nn
        });
        if (i === 0) {
          privateKey = pk;
        } else {
          publicKeyRing.addCopayer(pk.getExtendedPublicKeyString(), 'dummy');
          others_pks.push(pk);
        }
      }

      others_pks.length.should.equal(n - 1);

      var opts = {};
      opts.publicKeyRing = publicKeyRing;
      opts.privateKey = privateKey;
      opts.requiredCopayers = m;
      opts.totalCopayers = n;
      opts.spendUnconfirmed = true;
      opts.version = 'script'

      var w = new WalletFactory(opts).create(opts);
      var addr = w.generateAddress();

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
      var ntxid = w.createTxSync(toAddress, amount, null, utxos);
      var txp = w.txProposals.txps[ntxid];

      var signTx = function(pk, cb) {
        var pkr = publicKeyRing;
        var keys = pk.getAll(pkr.addressIndex, pkr.changeAddressIndex);

        var b = txp.builder;
        var before = b.signaturesAdded;
        b.sign(keys);

        return cb();
      }

      async.eachSeries(others_pks, signTx, function(err) {
        if (err) {
          throw err;
        } else {
          var tx = txp.builder.build();
          var scriptSig = tx.ins[0].getScript();
          var size = scriptSig.serialize().length;

          maxs[pair] = Math.max(maxs[pair] || 0, size)
        }
      });

    }
    var size = maxs[pair];
    console.log('\tmax size: ' + size);
    var m_valid = false;
    if (size < 500) {
      m_valid = true;
      valid[[m, n]] = size;
    }
    if (!m_valid) break;
  }
  if (!m_valid && m === 1) break;
}


console.log(valid);
