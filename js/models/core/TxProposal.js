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
  preconditions.checkArgument(opts.inputChainPaths,'no inputChainPaths');
  preconditions.checkArgument(opts.creator,'no creator');
  preconditions.checkArgument(opts.createdTs,'no createdTs');
  preconditions.checkArgument(opts.builder,'no builder');


  this.creator = opts.creator;
  this.createdTs = opts.createdTs;
  this.builder = opts.builder;
  this.inputChainPaths = opts.inputChainPaths;

  this._inputSignatures = [];
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
  t._check();
  t._updateSignedBy();

  return t;
};



TxProposal._formatKeys = function(keys) {
  var ret = [];
  for (var i in keys) {
    if (!Buffer.isBuffer(keys[i]))
      throw new Error('keys must be buffers');

    var k = new Key();
    k.public = keys[i];
    ret.push(k);
  };
  return ret;
};

TxProposal._verifySignatures = function(inKeys, scriptSig, txSigHash) {
  preconditions.checkArgument(Buffer.isBuffer(txSigHash));
  preconditions.checkArgument(inKeys);
  preconditions.checkState(Buffer.isBuffer(inKeys[0]));

  if (scriptSig.chunks[0] !== 0)
    throw new Error('Invalid scriptSig');

  var keys = TxProposal._formatKeys(inKeys);
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

TxProposal._infoFromRedeemScript = function(s) {
  var redeemScript = new Script(s.chunks[s.chunks.length - 1]);
  if (!redeemScript)
    throw new Error('Bad scriptSig (no redeemscript)');

  var pubkeys = redeemScript.capture();
  if (!pubkeys || !pubkeys.length)
    throw new Error('Bad scriptSig (no pubkeys)');

  return {
    keys: pubkeys,
    script: redeemScript,
  };
};

TxProposal.prototype._updateSignedBy = function() {
  this._inputSignatures = [];

  var tx = this.builder.build();
  for (var i in tx.ins) {
    var scriptSig = new Script(tx.ins[i].s);
    var signatureCount = scriptSig.countSignatures();
    var info = TxProposal._infoFromRedeemScript(scriptSig);
    var txSigHash = tx.hashForSignature(info.script, parseInt(i), Transaction.SIGHASH_ALL);
    var signatureIndexes = TxProposal._verifySignatures(info.keys, scriptSig, txSigHash);
    if (signatureIndexes.length !== signatureCount)
      throw new Error('Invalid signature');
    this._inputSignatures[i] = signatureIndexes.map(function(i) {
      return info.keys[i].toString('hex');
    });
  };
};

TxProposal.prototype._check = function() {

  if (this.builder.signhash && this.builder.signhash !== Transaction.SIGHASH_ALL) {
    throw new Error('Invalid tx proposal');
  }

  var tx = this.builder.build();
  if (!tx.ins.length)
    throw new Error('Invalid tx proposal: no ins');

  for(var i in tx.ins){
    var scriptSig = tx.ins[i].s;
    if (!scriptSig || !scriptSig.length) {
      throw new Error('Invalid tx proposal: no signatures');
    }
  }

  for (var i = 0; i < tx.ins.length; i++) {
    var hashType = tx.getHashType(i);
    if (hashType && hashType !== Transaction.SIGHASH_ALL) 
      throw new Error('Invalid tx proposal: bad signatures');
  }
};


TxProposal.prototype.mergeBuilder = function(incoming) {
  var b0 = this.builder;
  var b1 = incoming.builder;

  var before = JSON.stringify(b0.toObj());
  b0.merge(b1);
  var after = JSON.stringify(b0.toObj());
  return after !== before;
};


/* OTDO
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


TxProposal.prototype._allSignatures = function() {
  var ret = {};
  for(var i in this._inputSignatures) 
    for (var j in this._inputSignatures[i])
      ret[this._inputSignatures[i][j]] = true;

  return ret;
};

TxProposal.prototype.merge = function(incoming) {
  var ret = {};
  var newSignatures = [];

  incoming._check();
  incoming._updateSignedBy();

  var prevInputSignatures = this._allSignatures();

  ret.hasChanged = this.mergeBuilder(incoming);
  this._updateSignedBy();

  if (ret.hasChanged) 
    for(var i in this._inputSignatures) 
      for (var j in this._inputSignatures[i])
        if (!prevInputSignatures[this._inputSignatures[i][j]])
          newSignatures.push(this._inputSignatures[i][j]);

  ret.newSignatures = newSignatures;

  return ret;
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
