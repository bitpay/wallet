'use strict';

var imports = require('soop').imports();

var bitcore = require('bitcore');
var bignum = bitcore.Bignum;
var coinUtil = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder = bitcore.TransactionBuilder;
var http = require('http');
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;
var copay = copay || require('../../../copay');
var SecureRandom = bitcore.SecureRandom;
var Base58Check = bitcore.Base58.base58Check;

function Wallet(opts) {
  var self = this;

  //required params
  ['storage', 'network', 'blockchain',
    'requiredCopayers', 'totalCopayers', 'spendUnconfirmed',
    'publicKeyRing', 'txProposals', 'privateKey', 'version',
    'reconnectDelay'
  ].forEach(function(k) {
    if (typeof opts[k] === 'undefined')
      throw new Error('missing required option for Wallet: ' + k);
    self[k] = opts[k];
  });

  this.log('creating ' + opts.requiredCopayers + ' of ' + opts.totalCopayers + ' wallet');

  this.id = opts.id || Wallet.getRandomId();
  this.name = opts.name;
  this.netKey = opts.netKey || SecureRandom.getRandomBuffer(8).toString('base64');

  // Renew token every 24hs
  if (opts.tokenTime && new Date().getTime() - opts.tokenTime < 86400000) {
    this.token = opts.token;
    this.tokenTime = opts.tokenTime;
  }

  this.verbose = opts.verbose;
  this.publicKeyRing.walletId = this.id;
  this.txProposals.walletId = this.id;
  this.network.maxPeers = this.totalCopayers;
  this.registeredPeerIds = [];
}

Wallet.parent = EventEmitter;
Wallet.prototype.log = function() {
  if (!this.verbose) return;
  if (console)
    console.log.apply(console, arguments);
};

Wallet.getRandomId = function() {
  var r = bitcore.SecureRandom.getPseudoRandomBuffer(8).toString('hex');
  return r;
};

Wallet.prototype.seedCopayer = function(pubKey) {
  this.seededCopayerId = pubKey;
};

Wallet.prototype.connectToAll = function() {

  var all = this.publicKeyRing.getAllCopayerIds();
  this.network.connectToCopayers(all);
  if (this.seededCopayerId) {
    this.sendWalletReady(this.seededCopayerId);
    this.seededCopayerId = null;
  }
};

Wallet.prototype._handleIndexes = function(senderId, data, isInbound) {
  this.log('RECV INDEXES:', data);
  var inIndexes = copay.AddressIndex.fromObj(data.indexes);
  var hasChanged = this.publicKeyRing.indexes.merge(inIndexes);
  if (hasChanged) {
    this.emit('publicKeyRingUpdated');
    this.store();
  }
};

Wallet.prototype._handlePublicKeyRing = function(senderId, data, isInbound) {
  this.log('RECV PUBLICKEYRING:', data);

  var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);
  var wasIncomplete = !this.publicKeyRing.isComplete();
  var hasChanged;

  try {
    hasChanged = this.publicKeyRing.merge(inPKR, true);
  } catch (e) {
    this.log('## WALLET ERROR', e); //TODO
    this.emit('connectionError', e.message);
    return;
  }

  if (hasChanged) {
    if (wasIncomplete) {
      this.sendPublicKeyRing();
    }
    if (this.publicKeyRing.isComplete()) {
      this._lockIncomming();
    }
    this.emit('publicKeyRingUpdated');
    this.store();
  }
};


Wallet.prototype._handleTxProposals = function(senderId, data, isInbound) {
  this.log('RECV TXPROPOSAL:', data);

  var recipients;
  var inTxp = copay.TxProposals.fromObj(data.txProposals);
  var ids = inTxp.getNtxids();

  if (ids.lenght > 1) {
    this.emit('badMessage', senderId);
    this.log('Received BAD TxProposal messsage FROM:', senderId); //TODO
    return;
  }

  var newId = ids[0];
  var mergeInfo = this.txProposals.merge(inTxp, true);
  var addSeen = this.addSeenToTxProposals();
  if (mergeInfo.hasChanged || addSeen) {
    this.log('### BROADCASTING txProposals. ');
    recipients = null;
    this.sendTxProposals(recipients, newId);
  }
  if (data.lastInBatch) {
    this.emit('txProposalsUpdated');
    this.store();
  }
};

Wallet.prototype._handleData = function(senderId, data, isInbound) {

  // TODO check message signature

  if (data.type !== 'walletId' && this.id !== data.walletId) {
    this.emit('badMessage', senderId);
    this.log('badMessage FROM:', senderId); //TODO
    return;
  }
  switch (data.type) {
    // This handler is repeaded on WalletFactory (#join). TODO
    case 'walletId':
      this.sendWalletReady(senderId);
      break;
    case 'walletReady':
      this.sendPublicKeyRing(senderId);
      this.sendTxProposals(senderId); // send old
      break;
    case 'publicKeyRing':
      this._handlePublicKeyRing(senderId, data, isInbound);
      break;
    case 'txProposals':
      this._handleTxProposals(senderId, data, isInbound);
      break;
    case 'indexes':
      this._handleIndexes(senderId, data, isInbound);
      break;
  }
};

Wallet.prototype._handleConnect = function(newCopayerId) {
  if (newCopayerId) {
    this.log('#### Setting new COPAYER:', newCopayerId);
    this.sendWalletId(newCopayerId);
  }
  var peerID = this.network.peerFromCopayer(newCopayerId)
  this.emit('connect', peerID);
};

Wallet.prototype._handleDisconnect = function(peerID) {
  this.currentDelay = null;
  this.emit('disconnect', peerID);
};


Wallet.prototype.getNetworkName = function() {
  return this.publicKeyRing.network.name;
};

Wallet.prototype._optsToObj = function() {
  var obj = {
    id: this.id,
    spendUnconfirmed: this.spendUnconfirmed,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,
    name: this.name,
    netKey: this.netKey,
    version: this.version,
  };

  if (this.token) {
    obj.token = this.token;
    obj.tokenTime = new Date().getTime();
  }

  return obj;
};


Wallet.prototype.getCopayerId = function(index) {
  return this.publicKeyRing.getCopayerId(index || 0);
};


Wallet.prototype.getMyCopayerId = function() {
  return this.getCopayerId(0);
};


Wallet.prototype.getSecret = function() {
  var i = new Buffer(this.getMyCopayerId(), 'hex');
  var k = new Buffer(this.netKey, 'base64');
  var b = Buffer.concat([i, k]);
  var str = Base58Check.encode(b);
  return str;
};


Wallet.decodeSecret = function(secretB) {
  var secret = Base58Check.decode(secretB);
  var netKeyBuf = secret.slice(-8);
  var pubKeyBuf = secret.slice(0, 33);
  return {
    pubKey: pubKeyBuf.toString('hex'),
    netKey: netKeyBuf.toString('base64'),
  }
};

Wallet.prototype._lockIncomming = function() {
  this.network.lockIncommingConnections(this.publicKeyRing.getAllCopayerIds());
};

Wallet.prototype.netStart = function() {
  var self = this;
  var net = this.network;
  net.removeAllListeners();
  net.on('connect', self._handleConnect.bind(self));
  net.on('disconnect', self._handleDisconnect.bind(self));
  net.on('data', self._handleData.bind(self));
  net.on('close', function() {
    self.emit('close');
  });
  net.on('serverError', function(msg) {
    self.emit('serverError', msg);
  });

  var myId = self.getMyCopayerId();
  var startOpts = {
    copayerId: myId,
    token: self.token,
    maxPeers: self.totalCopayers,
    netKey: this.netKey,
  };

  if (this.publicKeyRing.isComplete()) {
    this._lockIncomming();
  }

  net.start(startOpts, function() {
    self.emit('ready', net.getPeer());
    self.token = net.peer.options.token;
    setTimeout(function() {
      self.emit('publicKeyRingUpdated', true);
      self.scheduleConnect();
      self.emit('txProposalsUpdated');
      self.store();
    }, 10);
  });
};

Wallet.prototype.scheduleConnect = function() {
  var self = this;
  if (self.network.isOnline()) {
    self.connectToAll();
    self.currentDelay = self.currentDelay * 2 || self.reconnectDelay;
    setTimeout(self.scheduleConnect.bind(self), self.currentDelay);
  }
}

Wallet.prototype.getOnlinePeerIDs = function() {
  return this.network.getOnlinePeerIDs();
};

Wallet.prototype.getRegisteredCopayerIds = function() {
  var l = this.publicKeyRing.registeredCopayers();
  var copayers = [];
  for (var i = 0; i < l; i++) {
    var cid = this.getCopayerId(i);
    copayers.push(cid);
  }
  return copayers;
};

Wallet.prototype.getRegisteredPeerIds = function() {
  var l = this.publicKeyRing.registeredCopayers();
  if (this.registeredPeerIds.length !== l) {
    this.registeredPeerIds = [];
    var copayers = this.getRegisteredCopayerIds();
    for (var i = 0; i < l; i++) {
      var cid = copayers[i];
      var pid = this.network.peerFromCopayer(cid);
      this.registeredPeerIds.push({
        peerId: pid,
        nick: this.publicKeyRing.nicknameForCopayer(cid)
      });
    }
  }
  return this.registeredPeerIds;
};

Wallet.prototype.store = function() {
  var wallet = this.toObj();
  this.storage.setFromObj(this.id, wallet);
  this.log('Wallet stored');
};

Wallet.prototype.toObj = function() {
  var optsObj = this._optsToObj();
  var walletObj = {
    opts: optsObj,
    publicKeyRing: this.publicKeyRing.toObj(),
    txProposals: this.txProposals.toObj(),
    privateKey: this.privateKey ? this.privateKey.toObj() : undefined
  };

  return walletObj;
};

Wallet.fromObj = function(o, storage, network, blockchain) {
  var opts = JSON.parse(JSON.stringify(o.opts));
  opts.publicKeyRing = copay.PublicKeyRing.fromObj(o.publicKeyRing);
  opts.txProposals = copay.TxProposals.fromObj(o.txProposals);
  opts.privateKey = copay.PrivateKey.fromObj(o.privateKey);

  opts.storage = storage;
  opts.network = network;
  opts.blockchain = blockchain;
  var w = new Wallet(opts);
  return w;
};

Wallet.prototype.toEncryptedObj = function() {
  var walletObj = this.toObj();
  delete walletObj.opts.token;
  delete walletObj.opts.tokenTime;
  return this.storage.export(walletObj);
};

Wallet.prototype.sendTxProposals = function(recipients, ntxid) {
  this.log('### SENDING txProposals TO:', recipients || 'All', this.txProposals);

  var toSend = ntxid ? [ntxid] : this.txProposals.getNtxids();

  var last = toSend[toSend];

  for (var i in toSend) {
    var id = toSend[i];
    var lastInBatch = (i == toSend.length - 1);
    this.network.send(recipients, {
      type: 'txProposals',
      txProposals: this.txProposals.toObj(id),
      walletId: this.id,
      lastInBatch: lastInBatch,
    });
  }
};

Wallet.prototype.sendWalletReady = function(recipients) {
  this.log('### SENDING WalletReady TO:', recipients);

  this.network.send(recipients, {
    type: 'walletReady',
    walletId: this.id,
  });
};

Wallet.prototype.sendWalletId = function(recipients) {
  this.log('### SENDING walletId TO:', recipients || 'All', this.id);

  this.network.send(recipients, {
    type: 'walletId',
    walletId: this.id,
    opts: this._optsToObj(),
    networkName: this.getNetworkName(),
  });
};


Wallet.prototype.sendPublicKeyRing = function(recipients) {
  this.log('### SENDING publicKeyRing TO:', recipients || 'All', this.publicKeyRing.toObj());
  var publicKeyRing = this.publicKeyRing.toObj();
  delete publicKeyRing.publicKeysCache; // exclude publicKeysCache from network obj

  this.network.send(recipients, {
    type: 'publicKeyRing',
    publicKeyRing: publicKeyRing,
    walletId: this.id,
  });
};
Wallet.prototype.sendIndexes = function(recipients) {
  this.log('### INDEXES TO:', recipients || 'All', this.publicKeyRing.indexes.toObj());

  this.network.send(recipients, {
    type: 'indexes',
    indexes: this.publicKeyRing.indexes.toObj(),
    walletId: this.id,
  });
};

Wallet.prototype.getName = function() {
  return this.name || this.id;
};

Wallet.prototype._doGenerateAddress = function(isChange) {
  return this.publicKeyRing.generateAddress(isChange);
};


Wallet.prototype.generateAddress = function(isChange, cb) {
  var addr = this._doGenerateAddress(isChange);
  this.sendIndexes();
  this.store();
  if (cb) return cb(addr);
  return addr;
};


Wallet.prototype.getTxProposals = function() {
  var ret = [];
  var copayers = this.getRegisteredCopayerIds();
  for (var k in this.txProposals.txps) {
    var i = this.txProposals.getTxProposal(k, copayers);
    i.signedByUs = i.signedBy[this.getMyCopayerId()] ? true : false;
    i.rejectedByUs = i.rejectedBy[this.getMyCopayerId()] ? true : false;
    if (this.totalCopayers - i.rejectCount < this.requiredCopayers)
      i.finallyRejected = true;

    ret.push(i);
  }
  return ret;
};


Wallet.prototype.reject = function(ntxid) {
  var myId = this.getMyCopayerId();
  var txp = this.txProposals.txps[ntxid];
  if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) {
    throw new Error('Invalid transaction to reject: ' + ntxid);
  }

  txp.rejectedBy[myId] = Date.now();
  this.sendTxProposals(null, ntxid);
  this.store();
  this.emit('txProposalsUpdated');
};


Wallet.prototype.sign = function(ntxid, cb) {
  var self = this;
  setTimeout(function() {
    var myId = self.getMyCopayerId();
    var txp = self.txProposals.txps[ntxid];
    if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) {
      if (cb) cb(false);
    }

    var pkr = self.publicKeyRing;
    var keys = self.privateKey.getForPaths(txp.inputChainPaths);

    var b = txp.builder;
    var before = b.signaturesAdded;
    b.sign(keys);

    var ret = false;
    if (b.signaturesAdded > before) {
      txp.signedBy[myId] = Date.now();
      self.sendTxProposals(null, ntxid);
      self.store();
      self.emit('txProposalsUpdated');
      ret = true;
    }
    if (cb) return cb(ret);
  }, 10);
};

Wallet.prototype.sendTx = function(ntxid, cb) {
  var txp = this.txProposals.txps[ntxid];
  if (!txp) return;

  var tx = txp.builder.build();
  if (!tx.isComplete()) return;
  this.log('Broadcasting Transaction');

  var scriptSig = tx.ins[0].getScript();
  var size = scriptSig.serialize().length;

  var txHex = tx.serialize().toString('hex');
  this.log('Raw transaction: ', txHex);

  var self = this;
  this.blockchain.sendRawTransaction(txHex, function(txid) {
    self.log('BITCOIND txid:', txid);
    if (txid) {
      self.txProposals.setSent(ntxid, txid);
      self.sendTxProposals(null, ntxid);
      self.store();
    }
    return cb(txid);
  });
};

Wallet.prototype.addSeenToTxProposals = function() {
  var ret = false;
  var myId = this.getMyCopayerId();

  for (var k in this.txProposals.txps) {
    var txp = this.txProposals.txps[k];
    if (!txp.seenBy[myId]) {

      txp.seenBy[myId] = Date.now();
      ret = true;
    }
  }
  return ret;
};

// TODO: remove this method and use getAddressesInfo everywhere
Wallet.prototype.getAddresses = function(opts) {
  return this.publicKeyRing.getAddresses(opts);
};

Wallet.prototype.getAddressesStr = function(opts) {
  return this.getAddresses(opts).map(function(a) {
    return a.toString();
  });
};

Wallet.prototype.getAddressesInfo = function(opts) {
  return this.publicKeyRing.getAddressesInfo(opts);
};

Wallet.prototype.addressIsOwn = function(addrStr, opts) {
  var addrList = this.getAddressesStr(opts);
  var l = addrList.length;
  var ret = false;

  for (var i = 0; i < l; i++) {
    if (addrList[i] === addrStr) {
      ret = true;
      break;
    }
  }
  return ret;
};

Wallet.prototype.getBalance = function(cb) {
  var balance = 0;
  var safeBalance = 0;
  var balanceByAddr = {};
  var BIT = coinUtil.BIT;
  var COIN = coinUtil.COIN;

  if (!BIT)
    throw new Error('BIT not defined. A newer version of bitcore is needed');

  console.log('[Wallet.js.574] getBalance'); //TODO



  this.getUnspent(function(err, safeUnspent, unspent) {
    if (err) {
      return cb(err);
    }

    for (var i = 0; i < unspent.length; i++) {
      var u = unspent[i];
      var amt = u.amount * COIN;
      balance += amt;
      balanceByAddr[u.address] = (balanceByAddr[u.address] || 0) + amt;
    }

    // we multiply and divide by BIT to avoid rounding errors when adding
    for (var a in balanceByAddr) {
      balanceByAddr[a] = balanceByAddr[a].toFixed(0) / BIT;
    }
    balance = balance.toFixed(0) / BIT;

    for (var i = 0; i < safeUnspent.length; i++) {
      var u = safeUnspent[i];
      var amt = u.amount * COIN;
      safeBalance += amt;
    }

    safeBalance = safeBalance.toFixed(0) / BIT;
    return cb(null, balance, balanceByAddr, safeBalance);
  });
};

Wallet.prototype.getUnspent = function(cb) {
  var self = this;
  this.blockchain.getUnspent(this.getAddressesStr(), function(err, unspentList) {
    console.log('[Wallet.js.606:unspentList:]', unspentList); //TODO

    if (err) {
      return cb(err);
    }

    var safeUnspendList = [];
    var maxRejectCount = self.totalCopayers - self.requiredCopayers;
    var uu = self.txProposals.getUsedUnspent(maxRejectCount);

    for (var i in unspentList) {
      var u = unspentList[i];
      if (!uu[u.txid + ',' + u.vout])
        safeUnspendList.push(u);
    }

    return cb(null, safeUnspendList, unspentList);
  });
};


Wallet.prototype.createTx = function(toAddress, amountSatStr, comment, opts, cb) {
  var self = this;
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts = opts || {};

  if (typeof opts.spendUnconfirmed === 'undefined') {
    opts.spendUnconfirmed = this.spendUnconfirmed;
  }

  this.getUnspent(function(err, safeUnspent) {
    console.log('[Wallet.js.639:safeUnspent:]', safeUnspent); //TODO
    var ntxid = self.createTxSync(toAddress, amountSatStr, comment, safeUnspent, opts);
    if (ntxid) {
      self.sendIndexes();
      self.sendTxProposals(null, ntxid);
      self.store();
      self.emit('txProposalsUpdated');
    }
    return cb(ntxid);
  });
};

Wallet.prototype.createTxSync = function(toAddress, amountSatStr, comment, utxos, opts) {
  var pkr = this.publicKeyRing;
  var priv = this.privateKey;
  opts = opts || {};

  var amountSat = bignum(amountSatStr);

  if (!pkr.isComplete()) {
    throw new Error('publicKeyRing is not complete');
  }

  if (comment && comment.length > 100) {
    throw new Error("comment can't be longer that 100 characters");
  }

  if (!opts.remainderOut) {
    opts.remainderOut = {
      address: this._doGenerateAddress(true).toString()
    };
  }

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{
      address: toAddress,
      amountSat: amountSat
    }]);

  var selectedUtxos = b.getSelectedUnspent();

  var inputChainPaths = selectedUtxos.map(function(utxo) {
    return pkr.pathForAddress(utxo.address);
  });

  if (priv) {
    var keys = priv.getForPaths(inputChainPaths);
    var signed = b.sign(keys);
  }
  var myId = this.getMyCopayerId();
  var now = Date.now();

  var me = {};
  if (priv && b.signaturesAdded) me[myId] = now;

  var meSeen = {};
  if (priv) meSeen[myId] = now;

  var data = {
    inputChainPaths: inputChainPaths,
    signedBy: me,
    seenBy: meSeen,
    creator: myId,
    createdTs: now,
    builder: b,
    comment: comment
  };

  var ntxid = this.txProposals.add(data);
  return ntxid;
};

Wallet.prototype.disconnect = function() {
  this.log('## DISCONNECTING');
  this.network.disconnect();
};

Wallet.prototype.getNetwork = function() {
  return this.network;
};

module.exports = require('soop')(Wallet);
