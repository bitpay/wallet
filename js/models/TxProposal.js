'use strict';

var bitcore = require('bitcore');
var _ = require('underscore');
var util = bitcore.util;
var Transaction = bitcore.Transaction;
var BuilderMockV0 = require('./BuilderMockV0');;
var TransactionBuilder = bitcore.TransactionBuilder;
var Script = bitcore.Script;
var Key = bitcore.Key;
var buffertools = bitcore.buffertools;
var preconditions = require('preconditions').instance();

var VERSION = 1;
var CORE_FIELDS = ['builderObj', 'inputChainPaths', 'version', 'comment'];


function TxProposal(opts) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.inputChainPaths, 'no inputChainPaths');
  preconditions.checkArgument(opts.builder, 'no builder');
  preconditions.checkArgument(opts.inputChainPaths, 'no inputChainPaths');

  this.inputChainPaths = opts.inputChainPaths;
  this.version = opts.version;
  this.builder = opts.builder;
  this.createdTs = opts.createdTs;
  this._inputSigners = [];

  // CopayerIds
  this.creator = opts.creator;
  this.signedBy = opts.signedBy || {};
  this.seenBy = opts.seenBy || {};
  this.rejectedBy = opts.rejectedBy || {};
  this.sentTs = opts.sentTs || null;
  this.sentTxid = opts.sentTxid || null;
  this.comment = opts.comment || null;
  this.readonly = opts.readonly || null;
  this.merchant = opts.merchant || null;
  this._sync();
}


TxProposal.prototype._check = function() {

  if (this.builder.signhash && this.builder.signhash !== Transaction.SIGHASH_ALL) {
    throw new Error('Invalid tx proposal');
  }

  var tx = this.builder.build();
  if (!tx.ins.length)
    throw new Error('Invalid tx proposal: no ins');

  _.each(tx.ins, function(value, index) {
    var scriptSig = value.s;
    if (!scriptSig || !scriptSig.length) {
      throw new Error('Invalid tx proposal: no signatures');
    }
    var hashType = tx.getHashType(index);
    if (hashType && hashType !== Transaction.SIGHASH_ALL)
      throw new Error('Invalid tx proposal: bad signatures');
  });
};

TxProposal.prototype.rejectCount = function() {
  return _.size(this.rejectedBy);
};

TxProposal.prototype.isPending = function(maxRejectCount) {
  preconditions.checkArgument(typeof maxRejectCount != 'undefined');

  if (this.rejectCount() > maxRejectCount || this.sentTxid)
    return false;

  return true;
};


TxProposal.prototype._updateSignedBy = function() {
  this._inputSigners = [];

  var tx = this.builder.build();
  for (var i in tx.ins) {
    var scriptSig = new Script(tx.ins[i].s);
    var signatureCount = scriptSig.countSignatures();

    var info = TxProposal._infoFromRedeemScript(scriptSig);
    var txSigHash = tx.hashForSignature(info.script, parseInt(i), Transaction.SIGHASH_ALL);
    var signersPubKey = TxProposal._verifySignatures(info.keys, scriptSig, txSigHash);
    if (signersPubKey.length !== signatureCount)
      throw new Error('Invalid signature');

    this._inputSigners[i] = signersPubKey;
  };
};

TxProposal.prototype._sync = function() {
  this._check();
  this._updateSignedBy();
  return this;
}


TxProposal.prototype.getId = function() {
  preconditions.checkState(this.builder);
  return this.builder.build().getNormalizedHash().toString('hex');
};

TxProposal.prototype.toObj = function() {
  var o = JSON.parse(JSON.stringify(this));
  delete o['builder'];
  o.builderObj = this.builder.toObj();
  return o;
};


TxProposal._trim = function(o) {
  var ret = {};
  CORE_FIELDS.forEach(function(k) {
    ret[k] = o[k];
  });
  return ret;
};

TxProposal.fromObj = function(o, forceOpts) {
  preconditions.checkArgument(o.builderObj);
  delete o['builder'];
  forceOpts = forceOpts || {};


  if (forceOpts) {
    o.builderObj.opts = o.builderObj.opts || {};
  }

  // force opts is requested.
  for (var k in forceOpts) {
    o.builderObj.opts[k] = forceOpts[k];
  }
  // Handle undef options
  if (_.isUndefined(forceOpts.fee) && _.isUndefined(forceOpts.feeSat)) {
    if (o.builderObj.opts) {
      o.builderObj.opts.fee = undefined;
      o.builderObj.opts.feeSat = undefined;
    }
  }

  try {
    o.builder = TransactionBuilder.fromObj(o.builderObj);
  } catch (e) {

    // backwards (V0) compatatibility fix.
    if (!o.version) {
      o.builder = new BuilderMockV0(o.builderObj);
      o.readonly = 1;
    };
  }
  return new TxProposal(o);
};

TxProposal.fromUntrustedObj = function(o, forceOpts) {
  return TxProposal.fromObj(TxProposal._trim(o), forceOpts);
};

TxProposal.prototype.toObjTrim = function() {
  return TxProposal._trim(this.toObj());
};

TxProposal._formatKeys = function(keys) {
  var ret = [];
  for (var i in keys) {
    if (!Buffer.isBuffer(keys[i]))
      throw new Error('keys must be buffers');

    var k = new Key();
    k.public = keys[i];
    ret.push({
      keyObj: k,
      keyHex: keys[i].toString('hex'),
    });
  }
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
      if (k.keyObj.verifySignatureSync(txSigHash, sigRaw)) {
        ret.push(k.keyHex);
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

TxProposal.prototype.mergeBuilder = function(incoming) {
  var b0 = this.builder;
  var b1 = incoming.builder;

  var before = JSON.stringify(b0.toObj());
  b0.merge(b1);
  var after = JSON.stringify(b0.toObj());
  return after !== before;
};


TxProposal.prototype.getSeen = function(copayerId) {
  return this.seenBy[copayerId];
};

TxProposal.prototype.setSeen = function(copayerId) {
  if (!this.seenBy[copayerId])
    this.seenBy[copayerId] = Date.now();
};

TxProposal.prototype.setRejected = function(copayerId) {

  if (this.signedBy[copayerId])
    throw new Error('Can not reject a signed TX');

  if (!this.rejectedBy[copayerId])
    this.rejectedBy[copayerId] = Date.now();
};

TxProposal.prototype.setSent = function(sentTxid) {
  this.sentTxid = sentTxid;
  this.sentTs = Date.now();
};

TxProposal.prototype.getSent = function() {
  return this.sentTs;
}

TxProposal.prototype._allSignatures = function() {
  var ret = {};
  for (var i in this._inputSigners)
    for (var j in this._inputSigners[i])
      ret[this._inputSigners[i][j]] = true;

  return ret;
};


TxProposal.prototype.setCopayers = function(senderId, keyMap, readOnlyPeers) {
  var newCopayer = {},
    oldCopayers = {},
    newSignedBy = {},
    readOnlyPeers = {},
    isNew = 1;

  for (var k in this.signedBy) {
    oldCopayers[k] = 1;
    isNew = 0;
  };

  if (isNew == 0) {
    if (!this.creator || !this.createdTs)
      throw new Error('Existing TX has no creator');

    if (!this.signedBy[this.creator])
      throw new Error('Existing TX is not signed by creator');


    if (Object.keys(this.signedBy).length === 0)
      throw new Error('Existing TX has no signatures');
  }


  var iSig = this._inputSigners[0];
  for (var i in iSig) {
    var copayerId = keyMap[iSig[i]];

    if (!copayerId)
      throw new Error('Found unknown signature')

    if (oldCopayers[copayerId]) {
      //Already have it. Do nothing
    } else {
      newCopayer[copayerId] = Date.now();
      delete oldCopayers[i];
    }
  }

  // Seems unncessary to check this:
  // if (!newCopayer[senderId] && !readOnlyPeers[senderId])
  //   throw new Error('TX must have a (new) senders signature')

  if (Object.keys(newCopayer).length > 1)
    throw new Error('New TX must have only 1 new signature');

  // Handler creator / createdTs.
  // from senderId, and must be signed by senderId
  if (isNew) {
    this.creator = Object.keys(newCopayer)[0];
    this.seenBy[this.creator] = this.createdTs = Date.now();
  }

  //Ended. Update this.
  for (var i in newCopayer) {
    this.signedBy[i] = newCopayer[i];
  }

  // signedBy has preference over rejectedBy
  for (var i in this.signedBy) {
    delete this.rejectedBy[i];
  }

  return Object.keys(newCopayer);
};

// merge will not merge any metadata.
TxProposal.prototype.merge = function(incoming) {
  var hasChanged = this.mergeBuilder(incoming);
  this._sync();
  return hasChanged;
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
