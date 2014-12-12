'use strict';

var _ = require('lodash');
var preconditions = require('preconditions').singleton();

var bitcore = require('bitcore');
var util = bitcore.util;
var Transaction = bitcore.Transaction;
var TransactionBuilder = bitcore.TransactionBuilder;
var Script = bitcore.Script;
var Key = bitcore.Key;

var log = require('../util/log');

var TX_MAX_SIZE_KB = 50;
var VERSION = 1;
var CORE_FIELDS = ['builderObj', 'inputChainPaths', 'version', 'comment', 'paymentProtocolURL', 'paymentAckMemo'];


function TxProposal(opts) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.inputChainPaths, 'no inputChainPaths');
  preconditions.checkArgument(opts.builder, 'no builder');
  preconditions.checkArgument(opts.inputChainPaths, 'no inputChainPaths');

  this.inputChainPaths = opts.inputChainPaths;
  this.version = opts.version;
  this.builder = opts.builder;
  this.createdTs = opts.createdTs;

  // Copayer Actions ( copayerId: timeStamp )
  this.signedBy = opts.signedBy || {};
  this.seenBy = opts.seenBy || {};
  this.rejectedBy = opts.rejectedBy || {};

  this.sentTs = opts.sentTs || null;
  this.sentTxid = opts.sentTxid || null;
  this.comment = opts.comment || null;
  this.readonly = opts.readonly || null;
  this.merchant = opts.merchant || null;
  this.paymentAckMemo = opts.paymentAckMemo || null;
  this.paymentProtocolURL = opts.paymentProtocolURL || null;

  this.resetCache();

  // New Tx Proposal
  if (_.isEmpty(this.seenBy) && opts.creator) {
    var now = Date.now();
    var me = {};
    me[opts.creator] = now;

    this.seenBy = me;
    this.signedBy = {};
    this.creator = opts.creator;
    this.createdTs = now;
    if (opts.signWith) {
      if (!this.sign(opts.signWith, opts.creator))
        throw new Error('Could not sign generated tx');
    }
  }
}

TxProposal.prototype._checkPayPro = function() {
  if (!this.merchant) return;

  if (this.paymentProtocolURL !== this.merchant.request_url)
    throw new Error('PayPro: Mismatch on Payment URLs');

  if (!this.merchant.outs || this.merchant.outs.length !== 1)
    throw new Error('PayPro: Unsopported number of outputs');

  if (this.merchant.expires < (this.getSent() || Date.now() / 1000.))
    throw new Error('PayPro: Request expired');

  if (!this.merchant.total || !this.merchant.outs[0].amountSatStr || !this.merchant.outs[0].address)
    throw new Error('PayPro: Missing amount');

  var outs = JSON.parse(this.builder.vanilla.outs);
  if (_.size(outs) != 1)
    throw new Error('PayPro: Wrong outs in Tx');

  var ppOut = this.merchant.outs[0];
  var txOut = outs[0];

  if (ppOut.address !== txOut.address)
    throw new Error('PayPro: Wrong out address in Tx');

  if (ppOut.amountSatStr !== txOut.amountSatStr + '')
    throw new Error('PayPro: Wrong amount in Tx');

};


TxProposal.prototype.isFullySigned = function() {
  return this.builder && this.builder.isFullySigned();
};


TxProposal.prototype.getMySignatures = function() {
  preconditions.checkState(this._mySignatures, 'Still no signatures from us');
  return _.clone(this._mySignatures);
};

TxProposal.prototype._setMySignatures = function(signaturesBefore) {
  var mySigs = [];
  _.each(this.getSignatures(), function(signatures, index) {
    var diff = _.difference(signatures, signaturesBefore[index]);
    preconditions.checkState(diff.length == 1, 'more that one signature added!');
    mySigs.push(diff[0].toString('hex'));
  })
  this._mySignatures = mySigs;
  return;
};

TxProposal.prototype.sign = function(keys, signerId) {
  var before = this.countSignatures();
  var signaturesBefore = this.getSignatures();
  this.builder.sign(keys);

  var signaturesAdded = this.countSignatures() > before;
  if (signaturesAdded) {
    this.signedBy[signerId] = Date.now();
    this._setMySignatures(signaturesBefore);
  }
  return signaturesAdded;
};

TxProposal.prototype._check = function() {

  if (this.builder.signhash && this.builder.signhash !== Transaction.SIGHASH_ALL) {
    throw new Error('Invalid tx proposal');
  }

  // Should be able to build
  var tx = this.builder.build();

  var txSize = tx.getSize();
  if (txSize / 1024 > TX_MAX_SIZE_KB)
    throw new Error('BIG: Invalid TX proposal. Too big: ' + txSize + ' bytes');

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
  this._checkPayPro();
};


TxProposal.prototype.trimForStorage = function() {
  // TODO (remove builder / builderObj. utxos, etc)
  //
  return this;
};

TxProposal.prototype.addMerchantData = function(merchantData) {
  preconditions.checkArgument(merchantData.pr);
  preconditions.checkArgument(merchantData.request_url);
  var m = _.clone(merchantData);

  if (!this.paymentProtocolURL)
    this.paymentProtocolURL = m.request_url;

  // remove unneeded data
  m.raw = m.pr.pki_data = m.pr.signature = undefined;
  this.merchant = m;
  this._checkPayPro();
};

TxProposal.prototype.getSignatures = function() {
  var ins = this.builder.build().ins;
  var sigs = _.map(ins, function(value) {
    var script = new bitcore.Script(value.s);
    var nchunks = script.chunks.length;
    return _.map(script.chunks.slice(1, nchunks - 1), function(buffer) {
      return buffer.toString('hex');
    });
  });

  return sigs;
};

TxProposal.prototype.rejectCount = function() {
  return _.size(this.rejectedBy);
};


TxProposal.prototype.isFinallyRejected = function(maxRejectCount) {
  return this.rejectCount() > maxRejectCount;
};

TxProposal.prototype.isPending = function(maxRejectCount) {
  preconditions.checkArgument(_.isNumber(maxRejectCount));

  if (this.isFinallyRejected(maxRejectCount) || this.sentTxid)
    return false;

  return true;
};

TxProposal.prototype._setSigned = function(copayerId) {

  // Sign powns rejected
  if (this.rejectedBy[copayerId]) {
    log.info("WARN: a previously rejected transaction was signed by:", copayerId);
    delete this.rejectedBy[copayerId];
  }

  this.signedBy[copayerId] = Date.now();

  return this;
};



/**
 *
 * @desc verify signatures of ONE copayer, using an array of signatures for each input
 *
 * @param {string[]} signatures, of the same copayer, one for each input
 * @return {string[]} array for signing pubkeys for each input
 */
TxProposal.prototype._addSignatureAndVerify = function(signatures) {
  var self = this;

  var ret = [];
  var tx = self.builder.build();

  var inputsFullySigned = 0;
  var newScriptSigs = [];

  this.resetCache();
  _.each(tx.ins, function(input, index) {
    var scriptSig = new Script(input.s);

    var info = TxProposal.infoFromRedeemScript(scriptSig);
    var txSigHash = tx.hashForSignature(info.script, parseInt(index), Transaction.SIGHASH_ALL);
    var keys = TxProposal.formatKeys(info.keys);
    var sig = new Buffer(signatures[index], 'hex');

    var hashType = sig[sig.length - 1];
    if (hashType !== Transaction.SIGHASH_ALL)
      throw new Error('BADSIG: Invalid signature: Bad hash type');

    var sigRaw = new Buffer(sig.slice(0, sig.length - 1));
    var signingPubKeyHex = self._verifyOneSignature(keys, sigRaw, txSigHash);
    if (!signingPubKeyHex)
      throw new Error('BADSIG: Invalid signatures: invalid for input:' + index);

    // now insert it
    var keysHex = _.pluck(keys, 'keyHex');
    var prio = _.indexOf(keysHex, signingPubKeyHex);
    preconditions.checkState(prio >= 0);

    var currentKeys = self.getSignersPubKeys()[index];

    if (_.indexOf(currentKeys, signingPubKeyHex) >= 0)
      throw new Error('BADSIG: Already have this signature');

    var currentPrios = _.map(currentKeys, function(key) {
      var prio = _.indexOf(keysHex, key);
      preconditions.checkState(prio >= 0);
      return prio;
    });

    var insertAt = 0;
    while (!_.isUndefined(currentPrios[insertAt]) && prio > currentPrios[insertAt])
      insertAt++;

    // Insert it! (1 is OP_0!)
    scriptSig.chunks.splice(1 + insertAt, 0, sig);
    scriptSig.updateBuffer();

    if (info.nreq == currentKeys.length + 1) {
      inputsFullySigned++;
    }
    newScriptSigs.push(scriptSig.buffer);
  });
  preconditions.checkState(newScriptSigs.length === tx.ins.length);

  // If we reach here, all signatures are OK, let's update the TX.
  _.each(tx.ins, function(input, index) {
    input.s = newScriptSigs[index];

    // just to keep TransactionBuilder updated
    if (tx.ins.length == inputsFullySigned)
      self.builder.inputsSigned++;
  });
};

TxProposal.prototype.resetCache = function() {
  this.cache = {
    pubkeysForScript: {},
  };
};

/**
 * addSignature
 *
 * @param {string[]} signatures from *ONE* copayer, one signature for each TX input.
 * @return {boolean} true = signatures added
 */
TxProposal.prototype.addSignature = function(copayerId, signatures) {
  preconditions.checkArgument(_.isArray(signatures));

  if (this.isFullySigned())
    return false;

  var tx = this.builder.build();
  preconditions.checkArgument(signatures.length === tx.ins.length, 'Wrong number of signatures given');

  this._addSignatureAndVerify(signatures);

  this._setSigned(copayerId);
  return true;
};

/**
 *
 * getSignersPubKey
 * @desc get Pubkeys of signers, for each input. this is CPU intensive
 *
 * @return {string[][]} array of hashes for signing pubkeys for each input
 */
TxProposal.prototype.getSignersPubKeys = function(forceUpdate) {
  var self = this;


  var signersPubKey = [];

  if (!self.cache.signersPubKey || forceUpdate) {

    log.debug('PERFORMANCE WARN: Verifying *all* TX signatures:', self.getId());

    var tx = self.builder.build();
    _.each(tx.ins, function(input, index) {

      if (!self.cache.pubkeysForScript[input.s]) {
        var scriptSig = new Script(input.s);
        var signatureCount = scriptSig.countSignatures();

        var info = TxProposal.infoFromRedeemScript(scriptSig);
        var txSigHash = tx.hashForSignature(info.script, parseInt(index), Transaction.SIGHASH_ALL);
        var inputSignersPubKey = self.verifySignatures(info.keys, scriptSig, txSigHash);

        // Does  scriptSig has strings that are not signatures?
        if (inputSignersPubKey.length !== signatureCount)
          throw new Error('Invalid signature');

        self.cache.pubkeysForScript[input.s] = inputSignersPubKey;
      }

      signersPubKey[index] = self.cache.pubkeysForScript[input.s];
    });
    self.cache.signersPubKey = signersPubKey;
  } else {
    log.debug('Using signatures verification cache')
  }

  return self.cache.signersPubKey;
};

TxProposal.prototype.getId = function() {
  preconditions.checkState(this.builder);

  if (!this.ntxid) {
    this.ntxid = this.builder.build().getNormalizedHash().toString('hex');
  }
  return this.ntxid;
};

TxProposal.prototype.toObj = function() {
  var o = JSON.parse(JSON.stringify(this));
  delete o['builder'];
  delete o['cache'];
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
  o.builderObj.opts = o.builderObj.opts || {};

  // force opts is requested.
  _.each(forceOpts, function(value, key) {
    o.builderObj.opts[key] = value;
  });

  // Handle undef fee options
  if (_.isUndefined(forceOpts.fee) && _.isUndefined(forceOpts.feeSat)) {
    o.builderObj.opts.fee = undefined;
    o.builderObj.opts.feeSat = undefined;
  }

  try {
    o.builder = TransactionBuilder.fromObj(o.builderObj);
  } catch (e) {
    throw new Error(e);
    return null;
  }
  return new TxProposal(o);
};

TxProposal.fromUntrustedObj = function(o, forceOpts) {
  var trimmed = TxProposal._trim(o);
  var txp = TxProposal.fromObj(trimmed, forceOpts);
  if (!txp)
    throw new Error('Invalid Transaction');

  txp._check();
  return txp;
};

TxProposal.prototype.toObjTrim = function() {
  return TxProposal._trim(this.toObj());
};

TxProposal.formatKeys = function(keys) {
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


/**
 * @desc Verify a single signature, for a given hash, tested against a given list of public keys.
 * @param keys
 * @param sigRaw
 * @param txSigHash
 * @return {string?} on valid signature, return the signing public key hex representation
 */
TxProposal.prototype._verifyOneSignature = function(keys, sigRaw, txSigHash) {
  preconditions.checkArgument(Buffer.isBuffer(txSigHash));
  preconditions.checkArgument(Buffer.isBuffer(sigRaw));
  preconditions.checkArgument(_.isArray(keys));
  preconditions.checkArgument(keys[0].keyObj);

  var signingKey = _.find(keys, function(key) {
    var ret = false;
    try {
      ret = key.keyObj.verifySignatureSync(txSigHash, sigRaw);
    } catch (e) {};
    return ret;
  });

  return signingKey ? signingKey.keyHex : null;
};


/**
 * @desc verify transaction signatures
 *
 * @param inKeys
 * @param scriptSig
 * @param txSigHash
 * @return {string[]} signing pubkeys, in order of apperance
 */
TxProposal.prototype.verifySignatures = function(inKeys, scriptSig, txSigHash) {
  preconditions.checkArgument(Buffer.isBuffer(txSigHash));
  preconditions.checkArgument(inKeys);
  preconditions.checkState(Buffer.isBuffer(inKeys[0]));
  var self = this;

  if (scriptSig.chunks[0] !== 0)
    throw new Error('Invalid scriptSig');

  var keys = TxProposal.formatKeys(inKeys);
  var ret = [];
  for (var i = 1; i <= scriptSig.countSignatures(); i++) {
    var chunk = scriptSig.chunks[i];
    log.debug('\t Verifying CHUNK:', i);
    var sigRaw = new Buffer(chunk.slice(0, chunk.length - 1));

    var signingPubKeyHex = self._verifyOneSignature(keys, sigRaw, txSigHash);
    if (!signingPubKeyHex)
      throw new Error('Found a signature that is invalid');

    ret.push(signingPubKeyHex);
  }
  return ret;
};

TxProposal.infoFromRedeemScript = function(s) {
  var redeemScript = new Script(s.chunks[s.chunks.length - 1]);
  if (!redeemScript)
    throw new Error('Bad scriptSig (no redeemscript)');

  var nreq = nreq = redeemScript.chunks[0] - 80; //see OP_2-OP_16
  var pubkeys = redeemScript.capture();
  if (!pubkeys || !pubkeys.length)
    throw new Error('Bad scriptSig (no pubkeys)');

  return {
    nreq: nreq,
    keys: pubkeys,
    script: redeemScript,
  };
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

  return this;
};

TxProposal.prototype.setSent = function(sentTxid) {
  this.sentTxid = sentTxid;
  this.sentTs = Date.now();
  return this;
};

TxProposal.prototype.getSent = function() {
  return this.sentTs;
}

TxProposal.prototype.setCopayers = function(pubkeyToCopayerMap) {
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


  var iSig = this.getSignersPubKeys();
  for (var i in iSig) {
    var copayerId = pubkeyToCopayerMap[iSig[i]];

    if (!copayerId)
      throw new Error('Found unknown signature')

    if (oldCopayers[copayerId]) {
      //Already have it. Do nothing
    } else {
      newCopayer[copayerId] = Date.now();
      delete oldCopayers[i];
    }
  }

  if (Object.keys(newCopayer).length > 1)
    throw new Error('New TX must have only 1 new signature');

  // Handler creator / createdTs.
  // from senderId, and must be signed by senderId * DISABLED*
  //
  if (isNew) {
    this.creator = Object.keys(newCopayer)[0];
    this.seenBy[this.creator] = this.createdTs = Date.now();
  }

  //Ended. Update this
  _.extend(this.signedBy, newCopayer);

  // signedBy has preference over rejectedBy
  for (var i in this.signedBy) {
    delete this.rejectedBy[i];
  }

  return Object.keys(newCopayer);
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
