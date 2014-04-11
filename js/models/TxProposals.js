
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var util        = bitcore.util;
var Transaction = bitcore.Transaction;
var Builder     = bitcore.TransactionBuilder;
var Script      = bitcore.Script;
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
  this.txps = [];
}

TxProposals.fromObj = function(o) {
  var ret = new TxProposals({
    networkName: o.networkName,
  });
  o.txps.forEach(function(t) {
    var tx = new Transaction;
    tx.parse(t.txHex);
    ret.txps.push({
      seenBy: t.seenBy,
      signedBy: t.signedBy,
      tx: tx,
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
      txHex: t.tx.serialize(),
    });
  });
  return { 
    txps: ret, 
    networkName: this.network.name,
  };
};


TxProposals.prototype._getNormHash = function(txps) {
  var ret = {};
  txps.forEach(function(txp) {
    var hash = txp.tx.getNormalizedHash().toString('hex');
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


TxProposals.prototype._chunkIsEmpty = function(chunk) {
  return chunk === 0 ||  // when serializing and back, EMPTY_BUFFER becomes 0
    buffertools.compare(chunk, util.EMPTY_BUFFER) === 0;
};
//
// function d(s,l) {
// console.log('DUMP'); //TODO
//   for (var i=0; i<l; i++) {
//     var k = s.chunks[i];
//     console.log("0:", i, Buffer.isBuffer(k)? k.toString('hex'):k);
//   }
// };



// this assumes that the same signature can not be v0 / v1 (which shouldnt be!)
TxProposals.prototype._mergeInputSig = function(s0buf, s1buf) {
  if (buffertools.compare(s0buf,s1buf) === 0) {
    console.log('BUFFERS .s MATCH'); //TODO
    return s0buf;
  }
  // Is multisig?
  var s0 = new Script(s0buf);
  var s1 = new Script(s1buf);
  var l0  = s0.chunks.length;
  var l1 = s1.chunks.length;
  var s0map = {};

  if (l0 && l1 && l0 !== l1)
    throw new Error('TX sig types mismatch in merge');

  if (l0) {
    for (var i=0; i<l0; i++) {
      if (!this._chunkIsEmpty(s0.chunks[i]))
        s0map[s0.chunks[i]] = 1;
    };

    var diff = []; 
    for (var i=0; i<l1; i++) {
      if ( !this._chunkIsEmpty(s1.chunks[i]) && !s0map[s1.chunks[i]]) {
        diff.push(s1.chunks[i]);
      }
    };

    if (!diff) {
      console.log('[TxProposals.js.155] NO DIFF FOUND'); //TODO
      return s0.getBuffer();
    }
  
    var emptySlots = [];
    for (var i=1; i<l0; i++) {
      if (this._chunkIsEmpty(s0.chunks[i])) {
        emptySlots.push(i);
      }
    }

    if (emptySlots.length<diff.length) 
      throw new Error('no enough empty slots to merge Txs');

    for (var i=0;  i<diff.length; i++) {
      s0.chunks[emptySlots[i]] = diff[i];
    }
    s0.updateBuffer();
    return s0.getBuffer();
  }
  else {
    return s1.getBuffer();
  }

};

TxProposals.prototype._mergeSignatures = function(myTxps, theirTxps, mergeInfo) {
  var self = this;
  var toMerge = mergeInfo.toMerge;

  Object.keys(toMerge).forEach(function(hash) {
    var v0 = myTxps[hash].tx;
    var v1 = toMerge[hash].tx;

    var l = v0.ins.length;
    if (l !== v1.ins.length) 
      throw new Error('TX in length mismatch in merge');

    for(var i=0; i<l; i++) {
      var i0 =  v0.ins[i];
      var i1 =  v1.ins[i];

      if (i0.q !==  i1.q)
        throw new Error('TX sequence ins mismatch in merge. Input:',i);

      if (buffertools.compare(i0.o,i1.o) !== 0) 
        throw new Error('TX .o in mismatch in merge. Input:',i);
      

      i0.s=self._mergeInputSig(i0.s,i1.s);
    }
  });
};



TxProposals.prototype.merge = function(t) {
  if (this.network.name !== t.network.name) 
    throw new Error('network mismatch');

  var res = [];

  var myTxps      = this._getNormHash(this.txps);
  var theirTxps   = this._getNormHash(t.txps);

  var mergeInfo   = this._startMerge(myTxps, theirTxps);
  this._mergeMetadata(myTxps, theirTxps, mergeInfo);
  this._mergeSignatures(myTxps, theirTxps, mergeInfo);

  Object.keys(mergeInfo.toMerge).forEach(function(hash) {
    mergeInfo.ready.push(myTxps[hash]);
  });

  this.txps=mergeInfo.ready;
  return mergeInfo.stats;
};

TxProposals.prototype.create = function(toAddress, amountSat, utxos, priv, opts) {
  var pkr = this.publicKeyRing; 
  opts = opts || {};

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

  var tx = b.build();

  var me = {};

  if (priv) me[priv.id] = Date.now();

  this.txps.push(
    new TxProposal({
      signedBy: priv && b.signaturesAdded ? me : {},
      seenBy:   priv ? me : {},
      tx: tx,
    })
  );
  return tx;
};

TxProposals.prototype.sign = function(index) {
};

module.exports = require('soop')(TxProposals);
