'use strict';

var BuilderMockV0 = require('./BuilderMockV0');;
var bitcore = require('bitcore');
var util = bitcore.util;
var Transaction = bitcore.Transaction;
var BuilderMockV0 = require('./BuilderMockV0');;
var TxProposal = require('./TxProposal');;
var Script = bitcore.Script;
var Key = bitcore.Key;
var buffertools = bitcore.buffertools;
var preconditions = require('preconditions').instance();


function TxProposals(opts) {
  opts = opts || {};
  this.walletId = opts.walletId;
  this.network = opts.networkName === 'livenet' ?
    bitcore.networks.livenet : bitcore.networks.testnet;
  this.txps = {};
}

// fromObj => from a trusted source
TxProposals.fromObj = function(o, forceOpts) {
  var ret = new TxProposals({
    networkName: o.networkName,
    walletId: o.walletId,
  });

  o.txps.forEach(function(o2) {
    var t = TxProposal.fromObj(o2, forceOpts);
    if (t.builder) {
      var id = t.getId();
      ret.txps[id] = t;
    }
  });
  return ret;
};

TxProposals.prototype.getNtxids = function() {
  return Object.keys(this.txps);
};

TxProposals.prototype.toObj = function() {
  var ret = [];
  for (var id in this.txps) {
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


TxProposals.prototype.merge = function(inTxp, allowedPubKeys) {
  var myTxps = this.txps;

  var ntxid = inTxp.getId();
  var ret = {};

  if (myTxps[ntxid]) {
    var v0 = myTxps[ntxid];
    var v1 = inTxp;
    ret = v0.merge(v1, allowedPubKeys);
  } 
  else {
    this.txps[ntxid] = inTxp;
    ret.new = 1;
  }
  return ret;
};

TxProposals.prototype.mergeFromObj = function(txProposalObj, allowedPubKeys, opts) {
  var inTxp = TxProposal.fromObj(txProposalObj, opts);
  var mergeInfo = this.merge(inTxp, allowedPubKeys);
  mergeInfo.inTxp = inTxp;
  return mergeInfo;
};


// Add a LOCALLY CREATED (trusted) tx proposal
TxProposals.prototype.add = function(txp) {
  txp.sync();
  var ntxid = txp.getId();
  this.txps[ntxid] = txp;
  return ntxid;
};

TxProposals.prototype.getTxProposal = function(ntxid, copayers) {
  var txp = this.txps[ntxid];
  var i = JSON.parse(JSON.stringify(txp));
  i.builder = txp.builder;
  i.ntxid = ntxid;
  i.peerActions = {};

  if (copayers) {
    for (var j = 0; j < copayers.length; j++) {
      var p = copayers[j];
      i.peerActions[p] = {};
    }
  }

  for (var p in txp.seenBy) {
    i.peerActions[p] = {
      seen: txp.seenBy[p]
    };
  }
  for (var p in txp.signedBy) {
    i.peerActions[p] = i.peerActions[p] || {};
    i.peerActions[p].sign = txp.signedBy[p];
  }
  var r = 0;
  for (var p in txp.rejectedBy) {
    i.peerActions[p] = i.peerActions[p] || {};
    i.peerActions[p].rejected = txp.rejectedBy[p];
    r++;
  }
  i.rejectCount = r;

  var c = txp.creator;
  i.peerActions[c] = i.peerActions[c] || {};
  i.peerActions[c].create = txp.createdTs;
  return i;
};

//returns the unspent txid-vout used in PENDING Txs
TxProposals.prototype.getUsedUnspent = function(maxRejectCount) {
  var ret = {};
  for (var i in this.txps) {
    var u = this.txps[i].builder.getSelectedUnspent();
    var p = this.getTxProposal(i);
    if (p.rejectCount > maxRejectCount || p.sentTxid)
      continue;

    for (var j in u) {
      ret[u[j].txid + ',' + u[j].vout] = 1;
    }
  }
  return ret;
};

module.exports = TxProposals;
