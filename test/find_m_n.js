#!/usr/bin/env node

'use strict';

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
    console.log('case '+m+'-of-'+n);
    // create full pkr
    var publicKeyRing = new PublicKeyRing({
      networkName: nn,
      requiredCopayers: m,
      totalCopayers: n,
    });
    var privateKey = null;
    for (var i = 0; i < n; i++) {
      var pk = new PrivateKey({
        networkName: nn
      });
      if (i === 0) {
        privateKey = pk;
      } else {
        publicKeyRing.addCopayer(pk.getExtendedPublicKeyString(), 'dummy');
      }
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
    console.log('\t receive addr='+addr);


    var toAddress = 'msj42CCGruhRsFrGATiUuh25dtxYtnpbTx';
    var amount = '5000000';



  }
}
