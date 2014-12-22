'use strict';

var _ = require('lodash');
var preconditions = require('preconditions').singleton();

var bitcore = require('bitcore');
var util = bitcore.util;
var Transaction = bitcore.Transaction;
var Script = bitcore.Script;
var Key = bitcore.Key;
var buffertools = bitcore.buffertools;

var log = require('../util/log');
var TxProposal = require('./TxProposal');;

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
    try {
      var t = TxProposal.fromObj(o2, forceOpts);
    } catch (e) {
      log.info('Ignoring corrupted TxProposal:', o2, e);
    }
    if (t && t.builder) {
      var id = t.getId();
      ret.txps[id] = t;
    }

  });
  return ret;
};

TxProposals.prototype.length = function() {
  return Object.keys(this.txps).length;
};


TxProposals.prototype.getNtxidsSince = function(sinceTs) {
  preconditions.checkArgument(sinceTs);
  var ret = [];

  for (var ii in this.txps) {
    var txp = this.txps[ii];
    if (txp.createdTs >= sinceTs)
      ret.push(ii);
  }
  return ret;
};



TxProposals.prototype.getNtxids = function() {
  return Object.keys(this.txps);
};

TxProposals.prototype.deleteOne = function(ntxid) {
  preconditions.checkState(this.txps[ntxid], 'Unknown TXP: ' + ntxid);
  delete this.txps[ntxid];
};

TxProposals.prototype.deleteAll = function() {
  this.txps = {};
};

TxProposals.prototype.deletePending = function(maxRejectCount) {
  for (var ntxid in this.txps) {
    if (this.txps[ntxid].isPending(maxRejectCount))
      delete this.txps[ntxid];
  };
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



// Add a LOCALLY CREATED (trusted) tx proposal
TxProposals.prototype.add = function(txp) {
  var ntxid = txp.getId();
  this.txps[ntxid] = txp;
  return ntxid;
};


TxProposals.prototype.exist = function(ntxid) {
  return this.txps[ntxid] ? true : false;
};


TxProposals.prototype.get = function(ntxid) {
  var ret = this.txps[ntxid];
  if (!ret)
    throw new Error('Unknown TXP: ' + ntxid);

  return ret;
};

//returns the unspent txid-vout used in PENDING Txs
TxProposals.prototype.getUsedUnspent = function(maxRejectCount) {
  var ret = {};
  var self = this;

  _.each(this.txps, function(txp) {
    if (!txp.isPending(maxRejectCount))
      return

    _.each(txp.builder.getSelectedUnspent(), function(u) {
      ret[u.txid + ',' + u.vout] = 1;
    });
  });
  return ret;
};

/**
 * purge
 *
 * @param deleteAll
 * @return {undefined}
 */
TxProposals.prototype.purge = function(deleteAll, maxRejectCount) {
  var m = _.size(this.txps);

  if (deleteAll) {
    this.deleteAll();
  } else {
    this.deletePending(maxRejectCount);
  }
  var n = _.size(this.txps);
  return m - n;
};

module.exports = TxProposals;
