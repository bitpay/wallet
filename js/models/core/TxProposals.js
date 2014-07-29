'use strict';


var imports = require('soop').imports();
var bitcore = require('bitcore');
var util = bitcore.util;
var Transaction = bitcore.Transaction;
var BuilderMockV0 = require('./BuilderMockV0');;
var TransactionBuilder = bitcore.TransactionBuilder;
var Script = bitcore.Script;
var Key = bitcore.Key;
var buffertools = bitcore.buffertools;
var preconditions = require('preconditions').instance();
var COPAY_EPOCH = 1400000000000;



function TxProposal(opts) {
  this.creator = opts.creator;
  this.createdTs = opts.createdTs;
  this.seenBy = opts.seenBy || {};
  this.signedBy = opts.signedBy || {};
  this.rejectedBy = opts.rejectedBy || {};
  this.builder = opts.builder;
  this.sentTs = opts.sentTs || null;
  this.sentTxid = opts.sentTxid || null;
  this.inputChainPaths = opts.inputChainPaths || [];
  this.comment = opts.comment || null;
}

TxProposal.prototype.getID = function() {
  return this.builder.build().getNormalizedHash().toString('hex');
};

TxProposal.prototype.toObj = function() {
  var o = JSON.parse(JSON.stringify(this));
  delete o['builder'];
  o.builderObj = this.builder.toObj();
  return o;
};


TxProposal.prototype.setSent = function(sentTxid) {
  this.sentTxid = sentTxid;
  this.sentTs = Date.now();
};

TxProposal.fromObj = function(o, forceOpts) {
  var t = new TxProposal(o);

  try {
    // force opts is requested.
    for (var k in forceOpts) {
      o.builderObj.opts[k] = forceOpts[k];
    }
    t.builder = TransactionBuilder.fromObj(o.builderObj);

  } catch (e) {
    if (!o.version) {
      t.builder = new BuilderMockV0(o.builderObj);
      t.readonly = 1;
    };
  }

  return t;
};


TxProposal.prototype.isValid = function() {
  if (this.builder.signhash && this.builder.signhash !== Transaction.SIGHASH_ALL) {
    return false;
  }
  var tx = this.builder.build();
  for (var i = 0; i < tx.ins.length; i++) {
    var hashType = tx.getHashType(i);
    if (hashType && hashType !== Transaction.SIGHASH_ALL) {
      return false;
    }
  }

  // Check that has valid signatures
  var tx = this.builder.build();

  for (var i = 0; i < tx.ins.length; i++) {

    var txSigHash = this.tx.hashForSignature(
      this.builder.inputMap[i].scriptPubKey, i, Transaction.SIGHASH_ALL);


    return false;
  }



  return true;
};

TxProposal.getSentTs = function() {
  return this.sentTs;
};

TxProposal.prototype.merge = function(incoming, author) {
  var ret = {};
  ret.events = this.mergeMetadata(incoming, author);
  ret.hasChanged = this.mergeBuilder(other);
  return ret;
};

TxProposal.prototype.mergeBuilder = function(other) {
  var b0 = this.builder;
  var b1 = other.builder;

  var before = JSON.stringify(b0.toObj());
  b0.merge(b1);
  var after = JSON.stringify(b0.toObj());
  return after !== before;
};


TxProposal.prototype._verifyTimestamp = function(ts, limits) {
  if (ts < limits.min || ts > limits.max)
    throw new Error('Invalid metadata at transaction proposal: skiping');
  return true;
};

TxProposal.prototype._isSignedBy = function(incoming,author) {
  var status = false;;

  var builder = incoming.builder.clone();
  var sHex = builder.vanilla.scriptSig[0];
  if (!sHex) return ret;

  var sBuf = new Buffer(sHex,'hex');
  var s = new Script(new Buffer(sHex,'hex'));

  var k = new Key();
  k.public = author;


  console.log('[TxProposals.js.124]', builder.vanilla); //TODO

  for (var i = 1; i <= s.countSignatures(); i++) {
    var chunk = s.chunks[i];

    var txSigHash = builder.build().hashForSignature(builder.vanilla, i-1, Transaction.SIGHASH_ALL);

    var sigRaw = new Buffer(chunk.slice(0, chunk.length - 1));
    if (k.verifySignatureSync(txSigHash, sigRaw)) {
      ret = true;
      break;
    }
  }
  return ret;
};

TxProposal.prototype.mergeMetadata = function(incoming, author) {
  var events = [];

  var ntxid = this.getID();
  var limits = {
    min: COPAY_EPOCH,
    max: Date.now(),
  };
  var status = this._isSignedBy(incoming, author);

  // Only use author's metadata
  if (!this.seenBy[author] && incoming.seenBy[k]) {
    this._validateTimestamp(incoming.seenBy[k], limits);
    this.seenBy[author] = incoming.seenBy[author];
    events.push({
      type: 'seen',
      cId: k,
      txId: ntxid
    });
  };


  if (this.seenBy[author]) {
    limits.min = this.seenBy[author];


    if (!this.signedBy[author] && incoming.signedBy[author]) {
      this._validateTimestamp(incoming.seenBy[k], this.seenBy[author], now);
      this.signedBy[k] = incoming.signedBy[k];
      events.push({
        type: 'signed',
        cId: k,
        txId: ntxid
      });
    }
    if (!this.rejectedBy[author] && incoming.signedBy[author]) {
      this._validateTimestamp(incoming.rejectedBy[k], this.seenBy[author], now);
      v0.rejectedBy[k] = v1.rejectedBy[k];
      events.push({
        type: 'rejected',
        cId: k,
        txId: ntxid
      });
    }
  }

  if (!v0.sentTxid && v1.sentTxid) {
    v0.sentTs = v1.sentTs;
    v0.sentTxid = v1.sentTxid;
    events.push({
      type: 'broadcast',
      txId: ntxid
    });
  }
  return events;

};

//This should be on bitcore / Transaction
TxProposal.prototype.countSignatures = function() {
  var tx = this.builder.build();

  var ret = 0;
  for (var i in tx.ins) {
    ret += tx.countInputSignatures(i);
  }
  return ret;
};

module.exports = require('soop')(TxProposal);


function TxProposals(opts) {
  opts = opts || {};
  this.walletId = opts.walletId;
  this.network = opts.networkName === 'livenet' ?
    bitcore.networks.livenet : bitcore.networks.testnet;
  this.txps = {};
}

TxProposals.fromObj = function(o, forceOpts) {
  var ret = new TxProposals({
    networkName: o.networkName,
    walletId: o.walletId,
  });

  o.txps.forEach(function(o2) {
    var t = TxProposal.fromObj(o2, forceOpts);
    if (t.builder) {
      var id = t.getID();
      ret.txps[id] = t;
    }
  });
  return ret;
};

TxProposals.prototype.getNtxids = function() {
  return Object.keys(this.txps);
};

TxProposals.prototype.toObj = function(onlyThisNtxid) {
  if (onlyThisNtxid) throw new Error();
  var ret = [];
  for (var id in this.txps) {

    if (onlyThisNtxid && id != onlyThisNtxid)
      continue;

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

TxProposals.prototype.merge = function(inTxp, author) {
  var myTxps = this.txps;

  var ntxid = inTxp.getID();
  var ret = {};
  ret.events = [];
  ret.events.hasChanged = false;

  if (myTxps[ntxid]) {
    var v0 = myTxps[ntxid];
    var v1 = inTxp;
    ret = v0.merge(v1, author);
  } else {
    this.txps[ntxid] = inTxp;
    ret.hasChanged = true;
    ret.events.push({
      type: 'new',
      cid: inTxp.creator,
      tx: ntxid
    });
  }
  return ret;
};

TxProposals.prototype.add = function(data) {
  preconditions.checkArgument(data.inputChainPaths);
  preconditions.checkArgument(data.signedBy);
  preconditions.checkArgument(data.creator);
  preconditions.checkArgument(data.createdTs);
  preconditions.checkArgument(data.builder);
  var txp = new TxProposal(data);
  var ntxid = txp.getID();
  this.txps[ntxid] = txp;
  return ntxid;
};

TxProposals.prototype.setSent = function(ntxid, txid) {
  //sent TxProposals are local an not broadcasted.
  this.txps[ntxid].setSent(txid);
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

TxProposals.TxProposal = TxProposal;
module.exports = require('soop')(TxProposals);
