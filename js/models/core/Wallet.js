'use strict';
var imports = require('soop').imports();

var http = require('http');
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;
var async = require('async');
var preconditions = require('preconditions').singleton();

var bitcore = require('bitcore');
var bignum = bitcore.Bignum;
var coinUtil = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder = bitcore.TransactionBuilder;
var SecureRandom = bitcore.SecureRandom;
var Base58Check = bitcore.Base58.base58Check;
var Address = bitcore.Address;

var AddressIndex = require('./AddressIndex');
var PublicKeyRing = require('./PublicKeyRing');
var TxProposals = require('./TxProposals');
var PrivateKey = require('./PrivateKey');

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

  this.verbose = opts.verbose;
  this.publicKeyRing.walletId = this.id;
  this.txProposals.walletId = this.id;
  this.network.maxPeers = this.totalCopayers;
  this.registeredPeerIds = [];
  this.addressBook = opts.addressBook || {};
  this.backupOffered = opts.backupOffered || false;
  this.publicKey = this.privateKey.publicHex;
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
  var inIndexes = AddressIndex.fromList(data.indexes);
  var hasChanged = this.publicKeyRing.mergeIndexes(inIndexes);
  if (hasChanged) {
    this.emit('publicKeyRingUpdated');
    this.store();
  }
};

Wallet.prototype._handlePublicKeyRing = function(senderId, data, isInbound) {
  this.log('RECV PUBLICKEYRING:', data);

  var inPKR = PublicKeyRing.fromObj(data.publicKeyRing);
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


Wallet.prototype._handleTxProposal = function(senderId, data) {
  preconditions.checkArgument(senderId);
  this.log('RECV TXPROPOSAL:', data);

  var inTxp = TxProposals.TxProposal.fromObj(data.txProposal);
  var mergeInfo = this.txProposals.merge(inTxp, senderId);
  var added = this.addSeenToTxProposals();

  if (added) {
    this.log('### BROADCASTING txProposals with my seenBy updated.');
    this.sendTxProposal(inTxp.getID());
  }

  this.emit('txProposalsUpdated');
  this.store();

  for (var i = 0; i < mergeInfo.events.length; i++) {
    this.emit('txProposalEvent', mergeInfo.events[i]);
  }
};

Wallet.prototype._handleAddressBook = function(senderId, data, isInbound) {
  this.log('RECV ADDRESSBOOK:', data);
  var rcv = data.addressBook;
  var hasChange;
  for (var key in rcv) {
    if (!this.addressBook[key]) {
      this.addressBook[key] = rcv[key];
      var isVerified = this.verifyAddressbookSignature(senderId, key);
      hasChange = true;
    }
  }
  if (hasChange) {
    this.emit('addressBookUpdated');
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
      this.sendAddressBook(senderId);
      this.sendAllTxProposals(senderId); // send old txps
      break;
    case 'publicKeyRing':
      this._handlePublicKeyRing(senderId, data, isInbound);
      break;
    case 'txProposal':
      this._handleTxProposal(senderId, data, isInbound);
      break;
    case 'indexes':
      this._handleIndexes(senderId, data, isInbound);
      break;
    case 'addressbook':
      this._handleAddressBook(senderId, data, isInbound);
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
    version: this.version,
  };

  return obj;
};


Wallet.prototype.getCopayerId = function(index) {
  return this.publicKeyRing.getCopayerId(index || 0);
};


Wallet.prototype.getMyCopayerId = function() {
  return this.getCopayerId(0); //copayer id is hex of a public key
};

Wallet.prototype.getMyCopayerIdPriv = function() {
  return this.privateKey.getIdPriv(); //copayer idpriv is hex of a private key
};

Wallet.prototype.getSecret = function() {
  var pubkeybuf = new Buffer(this.getMyCopayerId(), 'hex');
  var str = Base58Check.encode(pubkeybuf);
  return str;
};


Wallet.decodeSecret = function(secretB) {
  var secret = Base58Check.decode(secretB);
  var pubKeyBuf = secret.slice(0, 33);
  return {
    pubKey: pubKeyBuf.toString('hex')
  }
};


Wallet.prototype._lockIncomming = function() {
  this.network.lockIncommingConnections(this.publicKeyRing.getAllCopayerIds());
};

Wallet.prototype.netStart = function(callback) {
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
  var myIdPriv = self.getMyCopayerIdPriv();

  var startOpts = {
    copayerId: myId,
    privkey: myIdPriv,
    maxPeers: self.totalCopayers
  };

  if (this.publicKeyRing.isComplete()) {
    this._lockIncomming();
  }

  net.start(startOpts, function() {
    self.emit('ready', net.getPeer());
    setTimeout(function() {
      self.emit('publicKeyRingUpdated', true);
      self.scheduleConnect();
      self.emit('txProposalsUpdated');
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
        nick: this.publicKeyRing.nicknameForCopayer(cid),
        index: i,
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
    privateKey: this.privateKey ? this.privateKey.toObj() : undefined,
    addressBook: this.addressBook,
    backupOffered: this.backupOffered,
  };

  return walletObj;
};

Wallet.fromObj = function(o, storage, network, blockchain) {
  var opts = JSON.parse(JSON.stringify(o.opts));
  opts.addressBook = o.addressBook;
  opts.backupOffered = o.backupOffered;

  opts.publicKeyRing = PublicKeyRing.fromObj(o.publicKeyRing);
  opts.txProposals = TxProposals.fromObj(o.txProposals);
  opts.privateKey = PrivateKey.fromObj(o.privateKey);

  opts.storage = storage;
  opts.network = network;
  opts.blockchain = blockchain;
  var w = new Wallet(opts);
  return w;
};

Wallet.prototype.toEncryptedObj = function() {
  var walletObj = this.toObj();
  return this.storage.export(walletObj);
};

Wallet.prototype.sendAllTxProposals = function(recipients) {
  var ntxids = this.txProposals.getNtxids();
  for (var i in ntxids) {
    var ntxid = ntxids[i];
    this.sendTxProposal(ntxid, recipients);
  }
};

Wallet.prototype.sendTxProposal = function(ntxid, recipients) {
  preconditions.checkArgument(ntxid);
  preconditions.checkState(this.txProposals.txps[ntxid]);
  this.log('### SENDING txProposal ' + ntxid + ' TO:', recipients || 'All', this.txProposals);
  this.network.send(recipients, {
    type: 'txProposal',
    txProposal: this.txProposals.txps[ntxid].toObj(),
    walletId: this.id,
  });
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
  var indexes = AddressIndex.serialize(this.publicKeyRing.indexes);
  this.log('### INDEXES TO:', recipients || 'All', indexes);

  this.network.send(recipients, {
    type: 'indexes',
    indexes: indexes,
    walletId: this.id,
  });
};

Wallet.prototype.sendAddressBook = function(recipients) {
  this.log('### SENDING addressBook TO:', recipients || 'All', this.addressBook);
  this.network.send(recipients, {
    type: 'addressbook',
    addressBook: this.addressBook,
    walletId: this.id,
  });
};

Wallet.prototype.getName = function() {
  return this.name || this.id;
};

Wallet.prototype._doGenerateAddress = function(isChange) {
  return this.publicKeyRing.generateAddress(isChange, this.publicKey);
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
  for (var ntxid in this.txProposals.txps) {
    var txp = this.txProposals.getTxProposal(ntxid, copayers);
    txp.signedByUs = txp.signedBy[this.getMyCopayerId()] ? true : false;
    txp.rejectedByUs = txp.rejectedBy[this.getMyCopayerId()] ? true : false;
    if (this.totalCopayers - txp.rejectCount < this.requiredCopayers) {
      txp.finallyRejected = true;
    }

    ret.push(txp);
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
  this.sendTxProposal(ntxid);
  this.store();
  this.emit('txProposalsUpdated');
};


Wallet.prototype.sign = function(ntxid, cb) {
  preconditions.checkState(typeof this.getMyCopayerId() !== 'undefined');
  var self = this;
  setTimeout(function() {
    var myId = self.getMyCopayerId();
    var txp = self.txProposals.txps[ntxid];
    if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) {
      if (cb) cb(false);
    }

    var keys = self.privateKey.getForPaths(txp.inputChainPaths);

    var b = txp.builder;
    var before = b.signaturesAdded;
    b.sign(keys);

    var ret = false;
    if (b.signaturesAdded > before) {
      txp.signedBy[myId] = Date.now();
      self.sendTxProposal(ntxid);
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
      self.sendTxProposal(ntxid);
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
  return this.publicKeyRing.getAddressesInfo(opts, this.publicKey);
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

//retunrs values in SATOSHIs
Wallet.prototype.getBalance = function(cb) {
  var balance = 0;
  var safeBalance = 0;
  var balanceByAddr = {};
  var COIN = coinUtil.COIN;

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
      balanceByAddr[a] = parseInt(balanceByAddr[a].toFixed(0));
    }

    balance = parseInt(balance.toFixed(0));

    for (var i = 0; i < safeUnspent.length; i++) {
      var u = safeUnspent[i];
      var amt = u.amount * COIN;
      safeBalance += amt;
    }

    safeBalance = parseInt(safeBalance.toFixed(0));
    return cb(null, balance, balanceByAddr, safeBalance);
  });
};

Wallet.prototype.getUnspent = function(cb) {
  var self = this;
  this.blockchain.getUnspent(this.getAddressesStr(), function(err, unspentList) {

    if (err) {
      return cb(err);
    }

    var safeUnspendList = [];
    var maxRejectCount = self.totalCopayers - self.requiredCopayers;
    var uu = self.txProposals.getUsedUnspent(maxRejectCount);

    for (var i in unspentList) {
      var u = unspentList[i];
      var name = u.txid + ',' + u.vout;
      if (!uu[name] && (self.spendUnconfirmed || u.confirmations >= 1))
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
    var ntxid = self.createTxSync(toAddress, amountSatStr, comment, safeUnspent, opts);
    if (ntxid) {
      self.sendIndexes();
      self.sendTxProposal(ntxid);
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
  preconditions.checkArgument(new Address(toAddress).network().name === this.getNetworkName());
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
    .setOutputs([{
      address: toAddress,
      amountSat: amountSat
    }]);

  var selectedUtxos = b.getSelectedUnspent();
  var inputChainPaths = selectedUtxos.map(function(utxo) {
    return pkr.pathForAddress(utxo.address);
  });

  b = b.setHashToScriptMap(pkr.getRedeemScriptMap(inputChainPaths));

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

Wallet.prototype.updateIndexes = function(callback) {
  var self = this;
  self.log('Updating indexes...');

  var tasks = this.publicKeyRing.indexes.map(function(index) {
    return function(callback) {
      self.updateIndex(index, callback);
    };
  });

  async.parallel(tasks, function(err) {
    if (err) callback(err);
    self.log('Indexes updated');
    self.emit('publicKeyRingUpdated');
    self.store();
    callback();
  });
}

Wallet.prototype.updateIndex = function(index, callback) {
  var self = this;
  var SCANN_WINDOW = 20;
  self.indexDiscovery(index.changeIndex, true, index.cosigner, SCANN_WINDOW, function(err, changeIndex) {
    if (err) return callback(err);
    if (changeIndex != -1)
      index.changeIndex = changeIndex + 1;

    self.indexDiscovery(index.receiveIndex, false, index.cosigner, SCANN_WINDOW, function(err, receiveIndex) {
      if (err) return callback(err);
      if (receiveIndex != -1)
        index.receiveIndex = receiveIndex + 1;
      callback();
    });
  });
}

Wallet.prototype.deriveAddresses = function(index, amout, isChange, cosigner) {
  var ret = new Array(amout);
  for (var i = 0; i < amout; i++) {
    ret[i] = this.publicKeyRing.getAddress(index + i, isChange, cosigner).toString();
  }
  return ret;
}

// This function scans the publicKeyRing branch starting at index @start and reports the index with last activity,
// using a scan window of @gap. The argument @change defines the branch to scan: internal or external.
// Returns -1 if no activity is found in range.
Wallet.prototype.indexDiscovery = function(start, change, cosigner, gap, cb) {
  var scanIndex = start;
  var lastActive = -1;
  var hasActivity = false;

  var self = this;
  async.doWhilst(
    function _do(next) {
      // Optimize window to minimize the derivations.
      var scanWindow = (lastActive == -1) ? gap : gap - (scanIndex - lastActive) + 1;
      var addresses = self.deriveAddresses(scanIndex, scanWindow, change, cosigner);
      self.blockchain.checkActivity(addresses, function(err, actives) {
        if (err) throw err;

        // Check for new activities in the newlly scanned addresses
        var recentActive = actives.reduce(function(r, e, i) {
          return e ? scanIndex + i : r;
        }, lastActive);
        hasActivity = lastActive != recentActive;
        lastActive = recentActive;
        scanIndex += scanWindow;
        next();
      });
    },
    function _while() {
      return hasActivity;
    },
    function _finnaly(err) {
      if (err) return cb(err);
      cb(null, lastActive);
    }
  );
}


Wallet.prototype.disconnect = function() {
  this.log('## DISCONNECTING');
  this.network.disconnect();
};

Wallet.prototype.getNetwork = function() {
  return this.network;
};

Wallet.prototype._checkAddressBook = function(key) {
  if (this.addressBook[key] && this.addressBook[key].copayerId != -1) {
    throw new Error('This address already exists in your Address Book: ' + address);
  }
};

Wallet.prototype.setAddressBook = function(key, label) {
  this._checkAddressBook(key);
  var copayerId = this.getMyCopayerId();
  var ts = Date.now();
  var payload = {
    address: key,
    label: label,
    copayerId: copayerId,
    createdTs: ts
  };
  var newEntry = {
    hidden: false,
    createdTs: ts,
    copayerId: copayerId,
    label: label,
    signature: this.signJson(payload)
  };
  this.addressBook[key] = newEntry;
  this.sendAddressBook();
  this.store();
};

Wallet.prototype.verifyAddressbookSignature = function(senderId, key) {
  if (!key) throw new Error('Keys are required');
  var signature = this.addressBook[key].signature;
  var payload = {
    address: key,
    label: this.addressBook[key].label,
    copayerId: this.addressBook[key].copayerId,
    createdTs: this.addressBook[key].createdTs
  };
  var isVerified = this.verifySignedJson(senderId, payload, signature);
  if (!isVerified) {
    // remove wrong signed entry
    delete this.addressBook[key];
    this.store();
  }
  return isVerified;
}

Wallet.prototype.toggleAddressBookEntry = function(key) {
  if (!key) throw new Error('Key is required');
  this.addressBook[key].hidden = !this.addressBook[key].hidden;
  this.store();
};

Wallet.prototype.isReady = function() {
  var ret = this.publicKeyRing.isComplete() && this.backupOffered;
  return ret;
};

Wallet.prototype.offerBackup = function() {
  this.backupOffered = true;
  this.store();
};

Wallet.prototype.signJson = function(payload) {
  var key = new bitcore.Key();
  key.private = new Buffer(this.getMyCopayerIdPriv(), 'hex');
  key.regenerateSync();
  var sign = bitcore.Message.sign(JSON.stringify(payload), key);
  return sign.toString('hex');
}

Wallet.prototype.verifySignedJson = function(senderId, payload, signature) {
  var pubkey = new Buffer(senderId, 'hex');
  var sign = new Buffer(signature, 'hex');
  var v = bitcore.Message.verifyWithPubKey(pubkey, JSON.stringify(payload), sign);
  return v;
}

module.exports = require('soop')(Wallet);
