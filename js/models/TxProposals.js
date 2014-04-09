
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var coinUtil    = bitcore.util;
var Transaction = bitcore.Transaction;
var Builder = bitcore.TransactionBuilder;
var buffertools = bitcore.buffertools;

var Storage     = imports.Storage || require('./Storage');
var storage     = Storage.default();

/*
 * This follow Electrum convetion, as described in
 * https://bitcointalk.org/index.php?topic=274182.0
 *
 * We should probably adopt the next standard once it's ready, as discussed in:
 * http://sourceforge.net/p/bitcoin/mailman/message/32148600/
 *
 */

var PUBLIC_BRANCH = 'm/0/';
var CHANGE_BRANCH = 'm/1/';

function TxProposals(opts) {
  opts = opts || {};

  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.publicKeyRing = opts.publicKeyRing;
  this.requiredCopayers = opts.requiredCopayers || 3;
  this.txs = [];
  this.dirty = 1;
}


TxProposals.prototype.list = function() {
  var ret = [];

  this.txs.forEach(function(tx) {
  });
};

TxProposals.prototype.create = function(toAddress, amountSat, utxos, onePrivKey) {
  var pkr = this.publicKeyRing; 

  if (! pkr.isComplete() ) {
    throw new Error('publicKeyRing is not complete');
  }

  var opts = {
    remainderOut: { address: pkr.generateAddress(true) }
  };

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{address: toAddress, amountSat: amountSat}])
    ;

  if (onePrivKey) {
    b.sign([onePrivKey]);
  }

  var tx = b.build();
  var txHex = tx.serialize();
  this.txs.push(txHex);    
  return txHex;
};

TxProposals.prototype.sign = function(index) {
};

module.exports = require('soop')(TxProposals);
