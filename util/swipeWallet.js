#!/usr/bin/env node

'use strict';

console.log('Swipe wallet is outdated, and it does not work with Copay 0.10.x');
process.exit(1);

var _ = require('lodash');
var program = require('commander');
var config = require('../config');
var version = require('../version').version;
var sinon = require('sinon');
var bitcore = require('bitcore');
var readline = require('readline');
var async = require('async');

var copay = require('../copay');
function list(val) {
  return val.split(',');
}

program
  .version('0.0.1')
  .usage('-d n2kMqQ8Si9GndzQ6FrJxcwHMKacK2rCEpK -n 2 -k tprv8ZgxMBicQKsPem5BuuDT6xY9etUC2RohpUoyzoa1MEkkZyAHhszaHPZTmgDheN31hSP1r6bRwpj2JC66r1CPpftwaRrhz')
  .option('-d, --destination <n>', 'Destination Address')
  .option('-n, --required <n>', 'Required number of signatures', parseInt)
  .option('-k, --keys <items>', 'master private keys, separated by , ', list)
  .option('-a, --amount <n>', 'Optional, amount to transfer, in Satoshis. If not provided, will wipe all funds', parseInt)
  .option('-f, --fee [n]', 'Optional, fee in BTC (default 0.0001 BTC), only if amount is not provided', parseFloat)
  .parse(process.argv);


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
var args = process.argv;

var requiredCopayers = program.required;
var extPrivKeys = program.keys;
var destAddr = program.destination;
var amount = program.amount;

if (amount && program.fee) {
  console.log('If amount if given, fee will be automatically calculated');
  process.exit(1);
}

if (!requiredCopayers || !extPrivKeys || !extPrivKeys.length || !destAddr) {
  program.outputHelp();
  process.exit(1);
}

// Fee to asign to the tx. Please put a bigger number if you get 'unsufficient unspent'
var fee = program.fee || 0.0001;


var totalCopayers = extPrivKeys.length;
var addr = new bitcore.Address(destAddr);
if (!addr.isValid()) {
  console.log('\tBad destination address'); //TODO
  process.exit(1);

}



var networkName = addr.network().name;
console.log('\tNetwork: %s\n\tDestination Address:%s\n\tRequired copayers: %d\n\tTotal copayers: %d\n\tFee: %d\n\tKeys:',
  networkName, destAddr, requiredCopayers,
  totalCopayers, fee, extPrivKeys); //TODO
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
      throw ('Could not find any coins in the generated wallet');
    }


    if (amount && amount >= balance)
      throw ('Not enought balance fund to fullfill ' + amount + ' satoshis');

    rl.question("\n\tShould I swipe the wallet (destination address is:" + destAddr + " Amount: " + (amount || balance) + " satoshis)?\n\t(`yes` to continue)\n\t", function(answer) {
      if (answer !== 'yes')
        process.exit(1);

      amount = amount || balance - fee * bitcore.util.COIN;

      firstWallet.spend({ toAddress: destAddr, amountSat: amount }, function(err, ntxid) {
        if (err || !ntxid) {
          if (err && err.toString().match('BIG')) {
            throw new Error('Could not create tx' + err);
          } else {
            throw new Error('Could not create tx' + err + '. Try a bigger fee (--fee).');
          }
        }

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

            try {
              w[i].sign(ntxid);
            } catch (e) {
              return cb('Could not sign');
            }

            console.log('\t Signed!');
            firstWallet.txProposals = firstWallet.txProposals;
            i++;
            return cb(null);
          },
          function(err) {
            if (err)
              throw new Error(err);

            var p = firstWallet.txProposals.get(ntxid);
            if (p.builder.isFullySigned()) {
              console.log('\t FULLY SIGNED. BROADCASTING NOW....');
              var tx = p.builder.build();
              var txHex = tx.serialize().toString('hex');
              //console.log('\t RAW TX: ', txHex);
              firstWallet.broadcastToBitcoinNetwork(ntxid, function(txid) {
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
