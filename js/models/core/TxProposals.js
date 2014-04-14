
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var util        = bitcore.util;
var Transaction = bitcore.Transaction;
var Builder     = bitcore.TransactionBuilder;
var Script      = bitcore.Script;
var buffertools = bitcore.buffertools;

var Storage     = imports.Storage || require('../storage/Base');
var storage     = Storage.default();

function TxProposal(opts) {
  this.seenBy   = opts.seenBy || {};
  this.signedBy = opts.signedBy || {};
  this.builder  = opts.builder;
};
module.exports = require('soop')(TxProposal);


function TxProposals(opts) {
  opts = opts || {};
  this.walletId = opts.walletId;
  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;
  this.publicKeyRing = opts.publicKeyRing;
  this.txps = [];
}

TxProposals.fromObj = function(o) {
  var ret = new TxProposals({
    networkName: o.networkName,
    walletId: o.walletId,
  });
  o.txps.forEach(function(t) {
    ret.txps.push({
      seenBy: t.seenBy,
      signedBy: t.signedBy,
      builder: new Builder.fromObj(t.builderObj),
    });
  });
  return ret;
};


TxProposals.prototype.toObj = function() {
  var ret = [];
  this.txps.forEach(function(t) {
    ret.push({
      seenBy: t.seenBy,
      signedBy: t.signedBy,
      builderObj: t.builder.toObj(),
    });
  });
  return { 
    txps: ret, 
    walletId: this.walletId,
    networkName: this.network.name,
  };
};


TxProposals.prototype._getNormHash = function(txps) {
  var ret = {};
  txps.forEach(function(txp) {
    var hash = txp.builder.build().getNormalizedHash().toString('hex');
    ret[hash]=txp;
  });
  return ret;
};

TxProposals.prototype._startMerge = function(myTxps, theirTxps) {
  var fromUs=0, fromTheirs=0, merged =0;
  var toMerge = {}, ready=[];

  Object.keys(theirTxps).forEach(function(hash) {
    if (!myTxps[hash]) {
      ready.push(theirTxps[hash]);           // only in theirs;
      fromTheirs++;
    }
    else {
      toMerge[hash]=theirTxps[hash];  // need Merging
      merged++;
    }
  });

  Object.keys(myTxps).forEach(function(hash) {
    if(!toMerge[hash]) {
      ready.push(myTxps[hash]);   // only in myTxps;
      fromUs++;
    }
  });

  return {
    stats: {
      fromUs: fromUs,
      fromTheirs: fromTheirs,
      merged: merged,
    },
    ready: ready,
    toMerge: toMerge,
  };
};

TxProposals.prototype._mergeMetadata = function(myTxps, theirTxps, mergeInfo) {

  var toMerge = mergeInfo.toMerge;

  Object.keys(toMerge).forEach(function(hash) {
    var v0 = myTxps[hash];
    var v1 = toMerge[hash];

    Object.keys(v1.seenBy).forEach(function(k) {
      v0.seenBy[k] = v1.seenBy[k];
    });

    Object.keys(v1.signedBy).forEach(function(k) {
      v0.signedBy[k] = v1.signedBy[k];
    });
  });
};


TxProposals.prototype._mergeBuilder = function(myTxps, theirTxps, mergeInfo) {
  var self = this;
  var toMerge = mergeInfo.toMerge;

  Object.keys(toMerge).forEach(function(hash) {
    var v0 = myTxps[hash].builder;
    var v1 = toMerge[hash].builder;

    v0.merge(v1);
  });
};

TxProposals.prototype.merge = function(t) {
  if (this.network.name !== t.network.name) 
    throw new Error('network mismatch in:', t);

  var res = [];

  var myTxps      = this._getNormHash(this.txps);
  var theirTxps   = this._getNormHash(t.txps);

  var mergeInfo   = this._startMerge(myTxps, theirTxps);
  this._mergeMetadata(myTxps, theirTxps, mergeInfo);
  this._mergeBuilder(myTxps, theirTxps, mergeInfo);

  Object.keys(mergeInfo.toMerge).forEach(function(hash) {
    mergeInfo.ready.push(myTxps[hash]);
  });

  this.txps=mergeInfo.ready;
  return mergeInfo.stats;
};

TxProposals.prototype.create = function(toAddress, amountSatStr, utxos, priv, opts) {
  var pkr = this.publicKeyRing; 
  opts = opts || {};

  var amountSat = bitcore.bignum(amountSatStr);

  if (! pkr.isComplete() ) {
    throw new Error('publicKeyRing is not complete');
  }

  var opts = {
    remainderOut: opts.remainderOut || { address: pkr.generateAddress(true).toString() }
  };

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{address: toAddress, amountSat: amountSat}])
    ;

  var signRet;  
  if (priv) {
    b.sign( priv.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
  }
  var me = {};
  if (priv) me[priv.id] = Date.now();

  this.txps.push(
    new TxProposal({
      signedBy: priv && b.signaturesAdded ? me : {},
      seenBy:   priv ? me : {},
      builder: b,
    })
  );
  return 1;
};

TxProposals.prototype.sign = function(index) {
};

module.exports = require('soop')(TxProposals);
