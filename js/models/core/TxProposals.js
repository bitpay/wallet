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


TxProposals.prototype.merge = function(inObj, builderOpts) {
  var incomingTx = TxProposal.fromUntrustedObj(inObj, builderOpts);
  incomingTx._sync();

  var myTxps = this.txps;
  var ntxid = incomingTx.getId();
  var ret = {
    ntxid: ntxid
  };

  if (myTxps[ntxid]) {

    // Merge an existing txProposal
    ret.hasChanged = myTxps[ntxid].merge(incomingTx);


  } else {
    // Create a new one
    ret.new = ret.hasChanged =  1;
    this.txps[ntxid] = incomingTx;
  }

  ret.txp = this.txps[ntxid];
  return ret;
};

// Add a LOCALLY CREATED (trusted) tx proposal
TxProposals.prototype.add = function(txp) {
  txp._sync();
  var ntxid = txp.getId();
  this.txps[ntxid] = txp;
  return ntxid;
};


TxProposals.prototype.get = function(ntxid) {
  var ret = this.txps[ntxid];
  if (!ret)
    throw new Error('Unknown TXP: '+ntxid);

  return ret;
};

TxProposals.prototype.getTxProposal = function(ntxid, copayers) {
  var txp = this.get(ntxid);

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


TxProposals.prototype.reject = function(ntxid, copayerId) {
  var txp = this.get(ntxid);
  txp.setRejected(copayerId);
};

TxProposals.prototype.seen = function(ntxid, copayerId) {
  var txp = this.get(ntxid);
  txp.setSeen(copayerId);
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
