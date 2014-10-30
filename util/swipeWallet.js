#!/usr/bin/env node

'use strict';
var copay = require('../copay');
var program = require('commander');
var _ = require('lodash');
var config = require('../config');
var version = require('../version').version;
var sinon = require('sinon');
var bitcore = require('bitcore');
var readline = require('readline');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var args = process.argv;

var destAddr = args[2];
var DFLT_FEE = 0.0001 * bitcore.util.COIN;

var requiredCopayers = parseInt(args[3]);
var extPrivKeys = args.slice(4);
var totalCopayers = extPrivKeys.length;

var addr = new bitcore.Address(destAddr);
if (!addr.isValid()) {
  console.log('\tBad destination address'); //TODO
  process.exit(1);
}
var networkName = addr.network().name;
console.log('\tNetwork: %s\n\tDestination Address:%s\n\tRequired copayers: %d\n\tTotal copayers: %d\n\tKeys:', networkName, destAddr, requiredCopayers, totalCopayers, extPrivKeys); //TODO
console.log('\n ----------------------------');


function createWallet(networkName, extPrivKeys, index) {

  var opts = {};

  opts.networkName = networkName || 'testnet';
  opts.publicKeyRing = new copay.PublicKeyRing({
    networkName: networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });


  _.each(extPrivKeys, function(extPrivKey, i) {
    console.log('\tAdding key:', i);

    var privateKey = new copay.PrivateKey({
      networkName: networkName,
      extendedPrivateKeyString: extPrivKeys[i],
    });

    if (i === index)
      opts.privateKey = privateKey;

    opts.publicKeyRing.addCopayer(
      privateKey.deriveBIP45Branch().extendedPublicKeyString(),
      'public key ' + i
    );
  })
  console.log('\t### PublicKeyRing Initialized');

  opts.txProposals = new copay.TxProposals({
    networkName: networkName,
  });


  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  opts.network = {
    setHexNonce: sinon.stub(),
    setHexNonces: sinon.stub(),
    send: sinon.stub(),
  };
  // opts.networkOpts = {
  //   'livenet': config.network.livenet,
  //   'testnet': config.network.testnet,
  // };
  opts.blockchainOpts = {
    'livenet': config.network.livenet,
    'testnet': config.network.testnet,
  };
  opts.spendUnconfirmed = true;
  opts.version = version;
  // opts.reconnectDelay = opts.reconnectDelay || this.walletDefaults.reconnectDelay;

  return new copay.Wallet(opts);
}


console.log('## CREATING ALL WALLETS'); //TODO
var w = [];
_.each(extPrivKeys, function(extPrivKey, i) {
  w.push(createWallet(networkName, extPrivKeys, i));
});
console.log(' => %d Wallets created', w.length);

console.log('\n\n## Scanning for funds');

var firstWallet = w.pop();

firstWallet.updateIndexes(function() {
  console.log('Scan done.'); //TODO
  firstWallet.getBalance(function(err, balance, balanceByAddr) {
    console.log('\n\n\n\n### TOTAL BALANCE: %d SATOSHIS', balance); //TODO
    console.log('Balance per address:', balanceByAddr); //TODO

    // rl.question("Should we swipe the wallet? (`yes` to continue)", function(answer) {
    // });

    var amount = balance - DFLT_FEE;
    firstWallet.createTx(destAddr, amount, '', {}, function(err, ntxid) {
      console.log('\n\t### Tx Proposal Created... With copayer 0 signature.');

      var l = w.length;
      _.each(w, function(dummy,i){
        console.log('\t Signing with copayer', i + 1);
        w[i].txProposals=firstWallet.txProposals;
        w[i].sign(ntxid, function(err){
          console.log('\t Signed!');
          firstWallet.txProposals = firstWallet.txProposals;
          if (i == l - 1){
            console.log('\t ALL SIGNED');
            firstWallet.sendTx(ntxid,function(txid){
              console.log('\t #######  SENT  TXID:', txid);
              process.exit(1);
            });
          }
        })
      })
    });
  });
});
