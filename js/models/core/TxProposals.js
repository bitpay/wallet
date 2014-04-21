
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
  this.creator      = opts.creator;
  this.createdTs   = opts.createdTs;
  this.seenBy   = opts.seenBy || {};
  this.signedBy = opts.signedBy || {};
  this.builder  = opts.builder;
  this.sentTs = opts.sentTs || null;
  this.sentTxid = opts.sentTxid || null;
}

TxProposal.prototype.toObj = function() {
  var o = JSON.parse(JSON.stringify(this));
  delete o['builder'];
  o.builderObj = this.builder.toObj();
  return o;
};


TxProposal.prototype.setSent = function(sentTxid) {
  this.sentTxid = txid;
  this.sentTs = Date.now();;
};

TxProposal.fromObj = function(o) {
  var t = new TxProposal(o);
  var b = new Builder.fromObj(o.builderObj);
  t.builder = b;
  return t;
};

TxProposal.getSentTs = function() {
  return this.sentTs;
};

module.exports = require('soop')(TxProposal);


function TxProposals(opts) {
  opts = opts || {};
  this.walletId = opts.walletId;
  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;
  this.txps = {};
}

TxProposals.fromObj = function(o) {
  var ret = new TxProposals({
    networkName: o.networkName,
    walletId: o.walletId,
  });
  o.txps.forEach(function(o2) {
    var t = TxProposal.fromObj(o2);
    var id = t.builder.build().getNormalizedHash().toString('hex');
console.log('[TxProposals.js.65:id:]',id, o2); //TODO
    ret.txps[id] = t;
  });
  return ret;
};


TxProposals.prototype.toObj = function() {
  var ret = [];
  for(var id in this.txps){
    var t = this.txps[id];
    if (!t.sent)
      ret.push(t.toObj());
  }
  return { 
    txps: ret, 
    walletId: this.walletId,
    networkName: this.network.name,
  };
};


TxProposals.prototype._startMerge = function(myTxps, theirTxps) {
  var fromUs=0, fromTheirs=0, merged =0;
  var toMerge = {}, ready={};

  for(var hash in theirTxps){
    if (!myTxps[hash]) {
      ready[hash]=theirTxps[hash];           // only in theirs;
      fromTheirs++;
    }
    else {
      toMerge[hash]=theirTxps[hash];  // need Merging
      merged++;
    }
  }

  for(var hash in myTxps){
    if(!toMerge[hash]) {
      ready[hash]=myTxps[hash];   // only in myTxps;
      fromUs++;
    }
  }

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
  var hasChanged =0;

  Object.keys(toMerge).forEach(function(hash) {
    var v0 = myTxps[hash];
    var v1 = toMerge[hash];
console.log('[TxProposals.js.127:v0:]',v0, v1); //TODO

    Object.keys(v1.seenBy).forEach(function(k) {
      if (!v0.seenBy[k] || v0.seenBy[k] !== v1.seenBy[k]) {
        v0.seenBy[k] = v1.seenBy[k];
        hasChanged++;
      }
    });

    Object.keys(v1.signedBy).forEach(function(k) {
      if (!v0.signedBy[k]) {
        v0.signedBy[k] = v1.signedBy[k];
        hasChanged++;
      }
    });

    if (!v0.sentTxid && v1.sentTxid) {
      v0.sentTs   = v1.sentTs;
      v0.sentTxid = v1.sentTxid;
      hasChanged++;
    }

  });
console.log('[TxProposals.js.131:hasChanged:]',hasChanged); //TODO
  return hasChanged;
};


TxProposals.prototype._mergeBuilder = function(myTxps, theirTxps, mergeInfo) {
  var toMerge = mergeInfo.toMerge;
  var hasChanged=0;

  for(var hash in toMerge){
    var v0 = myTxps[hash].builder;
    var v1 = toMerge[hash].builder;

    // TODO: enhance this
    var before = JSON.stringify(v0.toObj());
    v0.merge(v1);
    var after = JSON.stringify(v0.toObj());
    if (after !== before) hasChanged ++;
  }
console.log('[TxProposals.js.149:hasChanged:]',hasChanged); //TODO
};

TxProposals.prototype.add = function(data) {
  var id = data.builder.build().getNormalizedHash().toString('hex');
console.log('[TxProposals.js.175:data: ADD]',data); //TODO
  this.txps[id] = new TxProposal(data);
};


TxProposals.prototype.setSent = function(ntxid) {
  //sent TxProposals are local an not broadcasted.
console.log('[TxProposals.js.147] SET SENT:', ntxid); //TODO
  this.txps[ntxid].setSent();
};


TxProposals.prototype.merge = function(t) {
  if (this.network.name !== t.network.name) 
    throw new Error('network mismatch in:', t);

  var res = [];
  var hasChanged = 0;

  var myTxps      = this.txps;
  var theirTxps   = t.txps;

  var mergeInfo   = this._startMerge(myTxps, theirTxps);
  hasChanged += this._mergeMetadata(myTxps, theirTxps, mergeInfo);
  hasChanged += this._mergeBuilder(myTxps, theirTxps, mergeInfo);

  Object.keys(mergeInfo.toMerge).forEach(function(hash) {
    mergeInfo.ready[hash] = myTxps[hash];
  });

  mergeInfo.stats.hasChanged = hasChanged;

  this.txps=mergeInfo.ready;
  return mergeInfo.stats;
};

module.exports = require('soop')(TxProposals);
