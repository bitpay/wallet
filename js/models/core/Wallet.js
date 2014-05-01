'use strict';

var imports = require('soop').imports();

var bitcore = require('bitcore');
var coinUtil = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder = bitcore.TransactionBuilder;
var http = require('http');
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;
var copay = copay || require('../../../copay');
var SecureRandom  = bitcore.SecureRandom;
var Base58Check   = bitcore.Base58.base58Check;

function Wallet(opts) {
  var self = this;

  //required params
  ['storage', 'network', 'blockchain',
    'requiredCopayers', 'totalCopayers', 'spendUnconfirmed',
    'publicKeyRing', 'txProposals', 'privateKey'
  ].forEach(function(k) {
    if (typeof opts[k] === 'undefined') throw new Error('missing key:' + k);
    self[k] = opts[k];
  });

  this.log('creating ' + opts.requiredCopayers + ' of ' + opts.totalCopayers + ' wallet');

  this.id = opts.id || Wallet.getRandomId();
  this.name = opts.name;
  this.netKey = opts.netKey || SecureRandom.getRandomBuffer(8).toString('base64');

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

Wallet.prototype._handlePublicKeyRing = function(senderId, data, isInbound) {
  this.log('RECV PUBLICKEYRING:', data);

  var recipients, pkr = this.publicKeyRing;
  var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);

  var hasChanged = pkr.merge(inPKR, true);
  if (hasChanged) {
    if (this.publicKeyRing.isComplete()) {
      this._lockIncomming();
    }
    this.log('### BROADCASTING PKR');
    recipients = null;
    this.sendPublicKeyRing(recipients);
  }
  this.emit('publicKeyRingUpdated', this.publicKeyRing);
  this.store();
};


Wallet.prototype._handleTxProposals = function(senderId, data, isInbound) {
  this.log('RECV TXPROPOSAL:', data); 

  var recipients;
  var inTxp = copay.TxProposals.fromObj(data.txProposals);
  var mergeInfo = this.txProposals.merge(inTxp, true);
  var addSeen = this.addSeenToTxProposals();
  if (mergeInfo.hasChanged || addSeen) {
    this.log('### BROADCASTING txProposals. ');
    recipients = null;
    this.sendTxProposals(recipients);
  }
  this.emit('txProposalsUpdated', this.txProposals);
  this.store();
};

Wallet.prototype._handleData = function(senderId, data, isInbound) {
  // TODO check message signature
  if (this.id !== data.walletId) {
    this.emit('badMessage', senderId);
    this.log('badMessage FROM:', senderId); //TODO
    return;
  }
  this.log('[Wallet.js.98]', data.type); //TODO
  switch (data.type) {
    // This handler is repeaded on WalletFactory (#join). TODO
    case 'walletId':
      this.sendWalletReady(senderId);
      break;
    case 'walletReady':
      this.sendPublicKeyRing(senderId);
      this.sendTxProposals(senderId);
      break;
    case 'publicKeyRing':
      this._handlePublicKeyRing(senderId, data, isInbound);
      break;
    case 'txProposals':
      this._handleTxProposals(senderId, data, isInbound);
      break;
  }
};

Wallet.prototype._handleNetworkChange = function(newCopayerId) {
  if (newCopayerId) {
    this.log('#### Setting new COPAYER:', newCopayerId);
    this.sendWalletId(newCopayerId);
    this.emit('peer', this.network.peerFromCopayer(newCopayerId));
  }
  this.emit('refresh');
};


Wallet.prototype._optsToObj = function() {
  var obj = {
    id: this.id,
    spendUnconfirmed: this.spendUnconfirmed,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,
    name: this.name,
    netKey: this.netKey,
  };

  return obj;
};


Wallet.prototype.getCopayerId = function(index) {
  return this.publicKeyRing.getCopayerId(index || 0);
};


Wallet.prototype.getMyCopayerId = function() {
  return this.getCopayerId(0);
};


Wallet.prototype.getSecret = function() {
  var i = new Buffer(this.getMyCopayerId(),'hex');
  var k = new Buffer(this.netKey,'base64');
  var b = Buffer.concat([i,k]);
  var str = Base58Check.encode(b);
  return str;
};


Wallet.decodeSecret = function(secretB) {
  var secret = Base58Check.decode(secretB);
  var netKeyBuf = secret.slice(-8);
  var pubKeyBuf = secret.slice(0,33);
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
  net.on('networkChange', self._handleNetworkChange.bind(self));
  net.on('data', self._handleData.bind(self));
  net.on('open', function() {}); // TODO
  net.on('openError', function() {
    self.log('[Wallet.js.132:openError:] GOT  openError'); //TODO
    self.emit('openError');
  });
  net.on('close', function() {
    self.emit('close');
  });

  var myId = self.getMyCopayerId();
  var startOpts = {
    copayerId: myId,
    maxPeers: self.totalCopayers,
    netKey: this.netKey,
  };

  if (this.publicKeyRing.isComplete()) {
    this._lockIncomming();
  }

  net.start(startOpts, function() {
    self.emit('created', net.getPeer());
    for (var i = 0; i < self.publicKeyRing.registeredCopayers(); i++) {
      var otherId = self.getCopayerId(i);
      if (otherId !== myId) {
        net.connectTo(otherId);
      }
      if (self.firstCopayerId) {
        self.sendWalletReady(self.firstCopayerId);
        self.firstCopayerId = null;
      }
      self.emit('refresh');
    }
  });
};

Wallet.prototype.getOnlinePeerIDs = function() {
  return this.network.getOnlinePeerIDs();
};

Wallet.prototype.getRegisteredPeerIds = function() {
  var l = this.publicKeyRing.registeredCopayers();
  if (this.registeredPeerIds.length !== l) {
    this.registeredPeerIds = [];
    for (var i = 0; i < l; i++) {
      var cid = this.getCopayerId(i);
      var pid = this.network.peerFromCopayer(cid);
      this.registeredPeerIds.push({
        peerId: pid,
        nick: this.publicKeyRing.nicknameForCopayer(cid)
      });
    }
  }
  return this.registeredPeerIds;
};

Wallet.prototype.store = function(isSync) {
  var wallet = this.toObj();
  this.storage.setFromObj(this.id, wallet);

  if (isSync) {
    this.log('Wallet stored.'); //TODO
  } else {
    this.log('Wallet stored. REFRESH Emitted'); //TODO
    this.emit('refresh');
  }

};

Wallet.prototype.toObj = function() {
  var optsObj = this._optsToObj();
  var walletObj = {
    opts: optsObj,
    publicKeyRing: this.publicKeyRing.toObj(),
    txProposals: this.txProposals.toObj(),
    privateKey: this.privateKey.toObj()
  };

  return walletObj;
};

Wallet.fromObj = function(o, storage, network, blockchain) {
  var opts           = JSON.parse(JSON.stringify(o.opts));
  opts.publicKeyRing = copay.PublicKeyRing.fromObj(o.publicKeyRing);
  opts.txProposals   = copay.TxProposals.fromObj(o.txProposals);
  opts.privateKey    = copay.PrivateKey.fromObj(o.privateKey);

  opts.storage       = storage;
  opts.network       = network;
  opts.blockchain    = blockchain;
  var w = new Wallet(opts);
  return w;
};

Wallet.prototype.sendTxProposals = function(recipients) {
  this.log('### SENDING txProposals TO:', recipients || 'All', this.txProposals);

  this.network.send(recipients, {
    type: 'txProposals',
    txProposals: this.txProposals.toObj(),
    walletId: this.id,
  });
};

Wallet.prototype.sendWalletReady = function(recipients) {
  this.log('### SENDING WalletReady TO:', recipients);

  this.network.send(recipients, {
    type: 'walletReady',
    walletId: this.id,
  });
  this.emit('walletReady');
};

Wallet.prototype.sendWalletId = function(recipients) {
  this.log('### SENDING walletId TO:', recipients || 'All', this.id);

  this.network.send(recipients, {
    type: 'walletId',
    walletId: this.id,
    opts: this._optsToObj()
  });
};


Wallet.prototype.sendPublicKeyRing = function(recipients) {
  this.log('### SENDING publicKeyRing TO:', recipients || 'All', this.publicKeyRing.toObj());

  this.network.send(recipients, {
    type: 'publicKeyRing',
    publicKeyRing: this.publicKeyRing.toObj(),
    walletId: this.id,
  });
};


Wallet.prototype.generateAddress = function(isChange) {
  var addr = this.publicKeyRing.generateAddress(isChange);
  this.sendPublicKeyRing();
  this.store(true);
  return addr;
};


Wallet.prototype.getTxProposals = function() {
  var ret = [];
  for (var k in this.txProposals.txps) {
    var i = this.txProposals.getTxProposal(k);
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
  if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) return;

  txp.rejectedBy[myId] = Date.now();
  this.sendTxProposals();
  this.store(true);
};


Wallet.prototype.sign = function(ntxid) {
  var self = this;
  var myId = this.getMyCopayerId();
  var txp = self.txProposals.txps[ntxid];
  if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) return;

  var pkr = self.publicKeyRing;
  var keys = self.privateKey.getAll(pkr.addressIndex, pkr.changeAddressIndex);

  var b = txp.builder;
  var before = b.signaturesAdded;
  b.sign(keys);

  var ret = false;
  if (b.signaturesAdded > before) {
    txp.signedBy[myId] = Date.now();
    this.sendTxProposals();
    this.store(true);
    ret = true;
  }
  return ret;
};

Wallet.prototype.sendTx = function(ntxid, cb) {
  var txp = this.txProposals.txps[ntxid];
  if (!txp) return;

  var tx = txp.builder.build();
  if (!tx.isComplete()) return;
  this.log('[Wallet.js.231] BROADCASTING TX!!!'); //TODO

  var txHex = tx.serialize().toString('hex');
  this.log('[Wallet.js.261:txHex:]', txHex); //TODO

  var self = this;

  this.blockchain.sendRawTransaction(txHex, function(txid) {
    self.log('BITCOND txid:', txid); //TODO
    if (txid) {
      self.txProposals.setSent(ntxid, txid);
    }
    self.sendTxProposals();
    self.store();
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
Wallet.prototype.getAddresses = function(excludeChange) {
  return this.publicKeyRing.getAddresses(excludeChange);
};

Wallet.prototype.getAddressesStr = function(excludeChange) {
  return this.getAddresses(excludeChange).map(function(a) {
    return a.toString();
  });
};

Wallet.prototype.getAddressesInfo = function(excludeChange) {
  return this.publicKeyRing.getAddressesInfo(excludeChange);
};

Wallet.prototype.addressIsOwn = function(addrStr, excludeChange) {
  var addrList = this.getAddressesStr(excludeChange);
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

Wallet.prototype.getBalance = function(safe, cb) {
  var balance = 0;
  var balanceByAddr = {};
  var isMain = {};
  var COIN = bitcore.util.COIN;
  var f = safe ? this.getSafeUnspent.bind(this) : this.getUnspent.bind(this);
  f(function(utxos) {
    for (var i = 0; i < utxos.length; i++) {
      var u = utxos[i];
      var amt = u.amount * COIN;
      balance += amt;
      balanceByAddr[u.address] = (balanceByAddr[u.address] || 0) + amt;
    }

    // we multiply and divide by COIN to avoid rounding errors when adding
    for (var a in balanceByAddr) {
      balanceByAddr[a] = balanceByAddr[a] / COIN;
    }
    balance = balance / COIN;
    return cb(balance, balanceByAddr, isMain);
  });
};

Wallet.prototype.getUnspent = function(cb) {
  this.blockchain.getUnspent(this.getAddressesStr(), function(unspentList) {
    return cb(unspentList);
  });
};

Wallet.prototype.getSafeUnspent = function(cb) {
  var self = this;
  this.blockchain.getUnspent(this.getAddressesStr(), function(unspentList) {

    var ret = [];
    var maxRejectCount = self.totalCopayers - self.requiredCopayers;
    var uu = self.txProposals.getUsedUnspent(maxRejectCount);

    for (var i in unspentList) {
      if (uu.indexOf(unspentList[i].txid) === -1)
        ret.push(unspentList[i]);
    }

    return cb(ret);
  });
};


Wallet.prototype.createTx = function(toAddress, amountSatStr, opts, cb) {
  var self = this;
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts = opts || {};

  if (typeof opts.spendUnconfirmed === 'undefined') {
    opts.spendUnconfirmed = this.spendUnconfirmed;
  }

  self.getSafeUnspent(function(unspentList) {
    if (self.createTxSync(toAddress, amountSatStr, unspentList, opts)) {
      self.sendPublicKeyRing(); // Change Address
      self.sendTxProposals();
      self.store();
    }
    return cb();
  });
};

Wallet.prototype.createTxSync = function(toAddress, amountSatStr, utxos, opts) {
  var pkr = this.publicKeyRing;
  var priv = this.privateKey;
  opts = opts || {};

  var amountSat = bitcore.bignum(amountSatStr);

  if (!pkr.isComplete()) {
    throw new Error('publicKeyRing is not complete');
  }

  if (!opts.remainderOut) {
    opts.remainderOut = {
      address: this.generateAddress(true).toString()
    };
  }

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{
      address: toAddress,
      amountSat: amountSat
    }]);

  var signRet;
  if (priv) {
    b.sign(priv.getAll(pkr.addressIndex, pkr.changeAddressIndex));
  }
  var myId = this.getMyCopayerId();
  var now = Date.now();

  var me = {};
  if (priv && b.signaturesAdded) me[myId] = now;

  var meSeen = {};
  if (priv) meSeen[myId] = now;

  var data = {
    signedBy: me,
    seenBy: meSeen,
    creator: myId,
    createdTs: now,
    builder: b,
  };

  this.txProposals.add(data);
  return true;
};

Wallet.prototype.connectTo = function(peerId) {
  throw new Error('Wallet.connectTo.. not yet implemented!');
};

Wallet.prototype.disconnect = function() {
  this.log('## DISCONNECTING');
  this.network.disconnect();
};

Wallet.prototype.getNetwork = function() {
  return this.network;
};

module.exports = require('soop')(Wallet);
