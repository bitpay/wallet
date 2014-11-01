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
var async = require('async');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var args = process.argv;

var destAddr = args[2];
var DFLT_FEE = 0.0001 * bitcore.util.COIN;

if (!args[4]) {
  console.log('\n\tusage: swipeWallet.js <destionation address> <required signature number> <master private key 0> [<master private key 1> ...]');
  console.log('\t e.g.: ./swipeWallet.js mxBVchwitGLXBHtT4Vah7DdP8J9M23ftE6  2 tprv8ZgxMBicQKsPejj9Xpky8M7NFv7szxqszBR2VvZTEkBTCCXZLtJfQwRxhUycNCu4sqyZepx8AfT1vuJr949np1gxYbZaJK3R9qekYPCZiJz tprv8ZgxMBicQKsPdWe14mn5SPY4zjG7fJnrmhkVZgTHQfYp91Kf1Lxof38KBQJiis4xv2zvZ2pVHgLn4GFRDUd8kR2HkMxDqLDNWTmnKqp95mZ tprv8ZgxMBicQKsPdzoFwT72Lwhr6n48ZyPahTAhPNaoAP4srVA1mcfPon7GWQaiwfAWesWACHm3aCBLYNGNPVKSU3E9vr1cLiBoMkayZiARywe');
  process.exit(1);
}

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

if (requiredCopayers > totalCopayers)
  throw new Error('No enought private keys given');


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

    if (!balance) {
      console.log('Could not find any balance from the generated wallet'); //TODO
      process.exit(1);
    }

    rl.question("\n\tShould I swipe the wallet (destination address" + destAddr + ")?\n\t(`yes` to continue)\n\t", function(answer) {
      if (answer !== 'yes')
        process.exit(1);

      var amount = balance - DFLT_FEE;
      firstWallet.createTx(destAddr, amount, '', {}, function(err, ntxid) {
        console.log('\n\t### Tx Proposal Created...\n\tWith copayer 0 signature.'); 
        if (requiredCopayers === 1) {
          firstWallet.sendTx(ntxid, function(txid) {
            console.log('\t #######  SENT  TXID:', txid);
            process.exit(1);
          });
        }

        var signers = w.slice(0, requiredCopayers - 1);

        console.log('Will add %d more signatures:', signers.length);

        var i = 0;
        async.eachSeries(signers, function(dummy, cb) {
            console.log('\t Signing with copayer', i + 1);
            w[i].txProposals = firstWallet.txProposals;
            w[i].sign(ntxid, function(signed) {
              if (!signed) return cb('Could not sign');

              console.log('\t Signed!');
              firstWallet.txProposals = firstWallet.txProposals;
              i++;
              return cb(null);
            })
          },
          function(err) {
            if (err)
              throw new Error(err);

            var p = firstWallet.txProposals.getTxProposal(ntxid);
            if (p.builder.isFullySigned()) {
              console.log('\t FULLY SIGNED. BROADCASTING NOW....');
              firstWallet.sendTx(ntxid, function(txid) {
                console.log('\t #######  SENT  TXID:', txid);
                process.exit(1);
              });
            } else {
              throw new Error('Error: could not fully sign the TX');
            }
          }
        )
      });
    });
  });
});
