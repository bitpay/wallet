'use strict';

var bitcore = require('bitcore');
var util = bitcore.util;
var Transaction = bitcore.Transaction;
var BuilderMockV0 = require('./BuilderMockV0');;
var TransactionBuilder = bitcore.TransactionBuilder;
var Script = bitcore.Script;
var Key = bitcore.Key;
var buffertools = bitcore.buffertools;
var preconditions = require('preconditions').instance();


function TxProposal(opts) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.inputChainPaths);
  preconditions.checkArgument(opts.creator);
  preconditions.checkArgument(opts.createdTs);
  preconditions.checkArgument(opts.builder);


  this.creator = opts.creator;
  this.createdTs = opts.createdTs;
  this.builder = opts.builder;
  this.inputChainPaths = opts.inputChainPaths;

  this._inputSignedBy = [];
  this.seenBy = opts.seenBy || {};
  this.signedBy = opts.signedBy || {};
  this.rejectedBy = opts.rejectedBy || {};
  this.sentTs = opts.sentTs || null;
  this.sentTxid = opts.sentTxid || null;
  this.comment = opts.comment || null;
  this.readonly = opts.readonly || null;
  //  this._updateSignedBy();
}

TxProposal.prototype.getId = function() {
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
  preconditions.checkArgument(o.builderObj);
  delete o['builder'];

  try {
    // force opts is requested.
    for (var k in forceOpts) {
      o.builderObj.opts[k] = forceOpts[k];
    }
    o.builder = TransactionBuilder.fromObj(o.builderObj);
  } catch (e) {
    if (!o.version) {
      o.builder = new BuilderMockV0(o.builderObj);
      o.readonly = 1;
    };
  }
  var t = new TxProposal(o);
  t._throwIfInvalid();
  t._updateSignedBy();
  return t;
};



TxProposal.prototype._formatKeys = function(allowedPubKeys) {
  var keys = [];
  for (var i in allowedPubKeys) {
    if (!Buffer.isBuffer(allowedPubKeys[i]))
      throw new Error('allowedPubKeys must be buffers');

    var k = new Key();
    k.public = allowedPubKeys[i];
    keys.push(k);
  };

  return keys;
};

TxProposal.prototype._verifySignatures = function(inKeys, scriptSig, txSigHash) {
  preconditions.checkArgument(Buffer.isBuffer(txSigHash));
  preconditions.checkArgument(inKeys);
  preconditions.checkState(Buffer.isBuffer(inKeys[0]));

  if (scriptSig.chunks[0] !== 0)
    throw new Error('Invalid scriptSig');
  var keys = this._formatKeys(inKeys);
  var ret = [];
  for (var i = 1; i <= scriptSig.countSignatures(); i++) {
    var chunk = scriptSig.chunks[i];
    var sigRaw = new Buffer(chunk.slice(0, chunk.length - 1));
    for (var j in keys) {
      var k = keys[j];
      if (k.verifySignatureSync(txSigHash, sigRaw)) {
        ret.push(parseInt(j));
        break;
      } 
    }
  }
  return ret;
};

TxProposal.prototype._keysFromRedeemScript = function(s) {
  var redeemScript = new Script(s.chunks[s.chunks.length - 1]);
  if (!redeemScript)
    throw new Error('Bad scriptSig');
  var pubkeys = redeemScript.capture();
  if (!pubkeys || !pubkeys.length)
    throw new Error('Bad scriptSig');

  return pubkeys;
};

TxProposal.prototype._updateSignedBy = function() {
  this._inputSignedBy = [];

  var tx = this.builder.build();
  for (var i in tx.ins) {
    var scriptSig = new Script(tx.ins[i].s);

    var keys = this._keysFromRedeemScript(scriptSig);
    var txSigHash = tx.hashForSignature(this.builder.inputMap[i].scriptPubKey, i, Transaction.SIGHASH_ALL);
    var copayerIndex = this._verifySignatures(keys, scriptSig, txSigHash);
    if (typeof copayerIndex === 'undefined')
      throw new Error('Invalid signature');
    this._inputSignedBy[i] = this._inputSignedBy[i] || {};
    this._inputSignedBy[i][copayerIndex] = true;
  };
};

TxProposal.prototype.isValid = function() {

  if (this.builder.signhash && this.builder.signhash !== Transaction.SIGHASH_ALL) {
    return false;
  }

  var tx = this.builder.build();
  if (!tx.ins.length)
    return false;

  for (var i = 0; i < tx.ins.length; i++) {
    var hashType = tx.getHashType(i);
    if (hashType && hashType !== Transaction.SIGHASH_ALL) {
      return false;
    }
  }

  console.log('[TxProposal.js.145]'); //TODO

  //Should be signed
  var scriptSigs = this.builder.vanilla.scriptSigs;
  if (!scriptSigs)
    return false;


  console.log('[TxProposal.js.153]'); //TODO
  return true;
};


TxProposal.prototype._throwIfInvalid = function(allowedPubKeys) {
  if (!this.isValid(allowedPubKeys))
    throw new Error('Invalid tx proposal');
};


TxProposal.prototype.merge = function(incoming, allowedPubKeys) {
  var ret = {};
  ret.events = [];
  incoming._throwIfInvalid(allowedPubKeys);

  /* TODO */

  /*
     events.push({
type: 'seen',
cId: k,
txId: ntxid
});
events.push({
type: 'signed',
cId: k,
txId: ntxid
});
events.push({
type: 'rejected',
cId: k,
txId: ntxid
});
ret.events = this.mergeMetadata(incoming);
*/
  ret.hasChanged = this.mergeBuilder(incoming);
  return ret;
};

TxProposal.prototype.mergeBuilder = function(incoming) {
  var b0 = this.builder;
  var b1 = incoming.builder;

  var before = JSON.stringify(b0.toObj());
  b0.merge(b1);
  var after = JSON.stringify(b0.toObj());
  return after !== before;
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
module.exports = TxProposal;
