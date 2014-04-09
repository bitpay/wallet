
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var coinUtil    = bitcore.util;
var Transaction = bitcore.Transaction;
var Builder = bitcore.TransactionBuilder;
var buffertools = bitcore.buffertools;

var Storage     = imports.Storage || require('./Storage');
var storage     = Storage.default();

function TxProposal(opts) {
  this.tx = opts.tx;
  this.seenBy   = {};
  this.signedBy = {};
};
module.exports = require('soop')(TxProposal);


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
  this.txs.push(
    new TxProposal({
      signedBy: {
      },
      seenBy: {
      },
      tx: tx
    })
  );
  return tx;
};

TxProposals.prototype.sign = function(index) {
};

module.exports = require('soop')(TxProposals);
