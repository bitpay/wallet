
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
  this.tx       = opts.tx;
  this.seenBy   = opts.seenBy || {};
  this.signedBy = opts.signedBy || {};
};
module.exports = require('soop')(TxProposal);


function TxProposals(opts) {
  opts = opts || {};
  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;
  this.publicKeyRing = opts.publicKeyRing;
  this.txs = [];
}

TxProposals.fromObj = function(o) {
  var ret = new TxProposals({
    networkName: o.networkName,
  });
  o.txs.forEach(function(t) {
    var tx = new Transaction;
    tx.parse(t.txHex);
    ret.txs.push({
      seenBy: t.seenBy,
      signedBy: t.signedBy,
      tx: tx,
    });
  });
  return ret;
};

TxProposals.prototype.toObj = function() {
  var ret = [];
  this.txs.forEach(function(t) {
    ret.push({
      seenBy: t.seenBy,
      signedBy: t.signedBy,
      txHex: t.tx.serialize(),
    });
  });
  return { 
    txs: ret, 
    networkName: this.network.name,
  };
};

TxProposals.prototype.create = function(toAddress, amountSat, utxos, priv) {
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

  if (priv) {
    //console.log('*** SIGNING IDX:', pkr.addressIndex, pkr.changeAddressIndex);
    b.sign( priv.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
  }

  var tx = b.build();
  var me = {};
  if (priv)
    me[priv.id] = Date.now();

  this.txs.push(
    new TxProposal({
      signedBy: me,
      seenBy: me,
      tx: tx,
    })
  );
  return tx;
};

TxProposals.prototype.sign = function(index) {
};

module.exports = require('soop')(TxProposals);
