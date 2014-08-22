'use strict';

var EventEmitter = require('events').EventEmitter;
var async = require('async');
var preconditions = require('preconditions').singleton();
var util = require('util');

var bitcore = require('bitcore');
var bignum = bitcore.Bignum;
var coinUtil = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder = bitcore.TransactionBuilder;
var SecureRandom = bitcore.SecureRandom;
var Base58Check = bitcore.Base58.base58Check;
var Address = bitcore.Address;
var PayPro = bitcore.PayPro;
var Transaction = bitcore.Transaction;

var HDParams = require('./HDParams');
var PublicKeyRing = require('./PublicKeyRing');
var TxProposal = require('./TxProposal');
var TxProposals = require('./TxProposals');
var PrivateKey = require('./PrivateKey');
var WalletLock = require('./WalletLock');
var copayConfig = require('../../../config');

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
  if (copayConfig.forceNetwork && this.getNetworkName() !== copayConfig.networkName)
    throw new Error('Network forced to ' + copayConfig.networkName +
      ' and tried to create a Wallet with network ' + this.getNetworkName());

  this.log('creating ' + opts.requiredCopayers + ' of ' + opts.totalCopayers + ' wallet');

  this.id = opts.id || Wallet.getRandomId();
  this.lock = new WalletLock(this.storage, this.id, opts.lockTimeOutMin);


  this.name = opts.name;

  this.verbose = opts.verbose;
  this.publicKeyRing.walletId = this.id;
  this.txProposals.walletId = this.id;
  this.network.maxPeers = this.totalCopayers;
  this.registeredPeerIds = [];
  this.addressBook = opts.addressBook || {};
  this.publicKey = this.privateKey.publicHex;

  this.paymentRequests = opts.paymentRequests || {};

  //network nonces are 8 byte buffers, representing a big endian number
  //one nonce for oneself, and then one nonce for each copayer
  this.network.setHexNonce(opts.networkNonce);
  this.network.setHexNonces(opts.networkNonces);
}

util.inherits(Wallet, EventEmitter);

Wallet.builderOpts = {
  lockTime: null,
  signhash: bitcore.Transaction.SIGNHASH_ALL,
  fee: null,
  feeSat: null,
};

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
  var inIndexes = HDParams.fromList(data.indexes);
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
    this.log('## WALLET ERROR', e);
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


Wallet.prototype._processProposalEvents = function(senderId, m) {
  var ev;
  if (m) {
    if (m.new) {
      ev = {
        type: 'new',
        cid: senderId
      }
    } else if (m.newCopayer) {
      ev = {
        type: 'signed',
        cid: m.newCopayer
      };
    }
  } else {
    ev = {
      type: 'corrupt',
      cId: senderId,
    };
  }

  if (ev)
    this.emit('txProposalEvent', ev);
};



/* OTDO
   events.push({
type: 'signed',
cId: k,
txId: ntxid
});
*/
Wallet.prototype._getKeyMap = function(txp) {
  preconditions.checkArgument(txp);

  var keyMap = this.publicKeyRing.copayersForPubkeys(txp._inputSignatures[0], txp.inputChainPaths);

  var inSig = JSON.stringify(txp._inputSignatures[0].sort());

  if (JSON.stringify(Object.keys(keyMap).sort()) !== inSig) {
    throw new Error('inputSignatures dont match know copayers pubkeys');
  }

  var keyMapStr = JSON.stringify(keyMap);
  // All inputs must be signed with the same copayers
  for (var i in txp._inputSignatures) {
    if (!i) continue;
    var inSigX = JSON.stringify(txp._inputSignatures[i].sort());
    if (inSigX !== inSig)
      throw new Error('found inputs with different signatures:');
  }
  return keyMap;
};


Wallet.prototype._checkSentTx = function(ntxid, cb) {
  var txp = this.txProposals.get(ntxid);
  var tx = txp.builder.build();

  this.blockchain.checkSentTx(tx, function(err, txid) {
    var ret = false;
    if (txid) {
      txp.setSent(txid);
      ret = txid;
    }
    return cb(ret);
  });
};


Wallet.prototype._handleTxProposal = function(senderId, data) {
  var self = this;
  this.log('RECV TXPROPOSAL: ', data);
  var m;

  try {
    m = this.txProposals.merge(data.txProposal, Wallet.builderOpts);
    var keyMap = this._getKeyMap(m.txp);
    ret.newCopayer = m.txp.setCopayers(senderId, keyMap);

  } catch (e) {
    this.log('Corrupt TX proposal received from:', senderId, e);
  }

  if (m) {

    if (m.hasChanged) {
      this.sendSeen(m.ntxid);
      var tx = m.txp.builder.build();
      if (tx.isComplete()) {
        this._checkSentTx(m.ntxid, function(ret) {
          if (ret) {
            self.emit('txProposalsUpdated');
            self.store();
          }
        });
      } else {
        this.sendTxProposal(m.ntxid);
      }
    }
    this.emit('txProposalsUpdated');
    this.store();
  }
  this._processProposalEvents(senderId, m);
};


Wallet.prototype._handleReject = function(senderId, data, isInbound) {
  preconditions.checkState(data.ntxid);
  this.log('RECV REJECT:', data);

  var txp = this.txProposals.get(data.ntxid);

  if (!txp)
    throw new Error('Received Reject for an unknown TX from:' + senderId);

  if (txp.signedBy[senderId])
    throw new Error('Received Reject for an already signed TX from:' + senderId);

  txp.setRejected(senderId);
  this.store();

  this.emit('txProposalsUpdated');
  this.emit('txProposalEvent', {
    type: 'rejected',
    cId: senderId,
    txId: data.ntxid,
  });
};

Wallet.prototype._handleSeen = function(senderId, data, isInbound) {
  preconditions.checkState(data.ntxid);
  this.log('RECV SEEN:', data);

  var txp = this.txProposals.get(data.ntxid);
  txp.setSeen(senderId);
  this.store();
  this.emit('txProposalsUpdated');
  this.emit('txProposalEvent', {
    type: 'seen',
    cId: senderId,
    txId: data.ntxid,
  });

};



Wallet.prototype._handleAddressBook = function(senderId, data, isInbound) {
  preconditions.checkState(data.addressBook);
  this.log('RECV ADDRESSBOOK:', data);
  var rcv = data.addressBook;
  var hasChange;
  for (var key in rcv) {
    if (!this.addressBook[key]) {
      var isVerified = this.verifyAddressbookEntry(rcv[key], senderId, key);
      if (isVerified) {
        this.addressBook[key] = rcv[key];
        hasChange = true;
      }
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
    this.log('badMessage FROM:', senderId);
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
    case 'reject':
      this._handleReject(senderId, data, isInbound);
      break;
    case 'seen':
      this._handleSeen(senderId, data, isInbound);
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
        copayerId: cid,
        nick: this.publicKeyRing.nicknameForCopayer(cid),
        index: i,
      });
    }
  }
  return this.registeredPeerIds;
};

Wallet.prototype.keepAlive = function() {
  try {
    this.lock.keepAlive();
  } catch (e) {
    this.log(e);
    this.emit('locked', null, 'Wallet appears to be openned on other browser instance. Closing this one.');
  }
};

Wallet.prototype.store = function() {
  this.keepAlive();

  var wallet = this.toObj();
  this.storage.setFromObj(this.id, wallet);
  this.log('Wallet stored');
};

Wallet.prototype.toObj = function() {
  var optsObj = this._optsToObj();

  var networkNonce = this.network.getHexNonce();
  var networkNonces = this.network.getHexNonces();

  var walletObj = {
    opts: optsObj,
    networkNonce: networkNonce, //yours
    networkNonces: networkNonces, //copayers
    publicKeyRing: this.publicKeyRing.toObj(),
    txProposals: this.txProposals.toObj(),
    privateKey: this.privateKey ? this.privateKey.toObj() : undefined,
    addressBook: this.addressBook,
  };

  return walletObj;
};

// fromObj => from a trusted source
Wallet.fromObj = function(o, storage, network, blockchain) {
  var opts = JSON.parse(JSON.stringify(o.opts));

  opts.addressBook = o.addressBook;

  if (o.privateKey)
    opts.privateKey = PrivateKey.fromObj(o.privateKey);
  else
    opts.privateKey = new PrivateKey({
    networkName: opts.networkName
  });

  if (o.publicKeyRing)
    opts.publicKeyRing = PublicKeyRing.fromObj(o.publicKeyRing);
  else {
    opts.publicKeyRing = new PublicKeyRing({
      networkName: opts.networkName,
      requiredCopayers: opts.requiredCopayers,
      totalCopayers: opts.totalCopayers,
    });
    opts.publicKeyRing.addCopayer(
      opts.privateKey.deriveBIP45Branch().extendedPublicKeyString(),
      opts.nickname
    );
  }

  if (o.txProposals)
    opts.txProposals = TxProposals.fromObj(o.txProposals, Wallet.builderOpts);
  else
    opts.txProposals = new TxProposals({
      networkName: this.networkName,
    });

  opts.storage = storage;
  opts.network = network;
  opts.blockchain = blockchain;

  return new Wallet(opts);
};

Wallet.prototype.toEncryptedObj = function() {
  var walletObj = this.toObj();
  return this.storage.export(walletObj);
};

Wallet.prototype.send = function(recipients, obj) {
  this.network.send(recipients, obj);
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

  this.log('### SENDING txProposal ' + ntxid + ' TO:', recipients || 'All', this.txProposals);
  this.send(recipients, {
    type: 'txProposal',
    txProposal: this.txProposals.get(ntxid).toObjTrim(),
    walletId: this.id,
  });
};

Wallet.prototype.sendSeen = function(ntxid) {
  preconditions.checkArgument(ntxid);
  this.log('### SENDING seen:  ' + ntxid + ' TO: All');
  this.send(null, {
    type: 'seen',
    ntxid: ntxid,
    walletId: this.id,
  });
};

Wallet.prototype.sendReject = function(ntxid) {
  preconditions.checkArgument(ntxid);
  this.log('### SENDING reject:  ' + ntxid + ' TO: All');
  this.send(null, {
    type: 'reject',
    ntxid: ntxid,
    walletId: this.id,
  });
};

Wallet.prototype.sendWalletReady = function(recipients) {
  this.log('### SENDING WalletReady TO:', recipients);

  this.send(recipients, {
    type: 'walletReady',
    walletId: this.id,
  });
};

Wallet.prototype.sendWalletId = function(recipients) {
  this.log('### SENDING walletId TO:', recipients || 'All', this.id);

  this.send(recipients, {
    type: 'walletId',
    walletId: this.id,
    opts: this._optsToObj(),
    networkName: this.getNetworkName(),
  });
};


Wallet.prototype.sendPublicKeyRing = function(recipients) {
  this.log('### SENDING publicKeyRing TO:', recipients || 'All', this.publicKeyRing.toObj());
  var publicKeyRing = this.publicKeyRing.toObj();

  this.send(recipients, {
    type: 'publicKeyRing',
    publicKeyRing: publicKeyRing,
    walletId: this.id,
  });
};
Wallet.prototype.sendIndexes = function(recipients) {
  var indexes = HDParams.serialize(this.publicKeyRing.indexes);
  this.log('### INDEXES TO:', recipients || 'All', indexes);

  this.send(recipients, {
    type: 'indexes',
    indexes: indexes,
    walletId: this.id,
  });
};

Wallet.prototype.sendAddressBook = function(recipients) {
  this.log('### SENDING addressBook TO:', recipients || 'All', this.addressBook);
  this.send(recipients, {
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

    if (txp.readonly && !txp.finallyRejected && !txp.sentTs) {} else {
      ret.push(txp);
    }
  }
  return ret;
};

Wallet.prototype.purgeTxProposals = function(deleteAll) {
  var m = this.txProposals.length();

  if (deleteAll) {
    this.txProposals.deleteAll();
  } else {
    this.txProposals.deletePending(this.maxRejectCount());
  }
  this.store();

  var n = this.txProposals.length();
  return m-n;
};

Wallet.prototype.reject = function(ntxid) {
  var txp = this.txProposals.reject(ntxid, this.getMyCopayerId());
  this.sendReject(ntxid);
  this.store();
  this.emit('txProposalsUpdated');
};

Wallet.prototype.sign = function(ntxid, cb) {
  preconditions.checkState(typeof this.getMyCopayerId() !== 'undefined');
  var self = this;
  setTimeout(function() {
    var myId = self.getMyCopayerId();
    var txp = self.txProposals.get(ntxid);
    // if (!txp || txp.rejectedBy[myId] || txp.signedBy[myId]) {
    //   if (cb) cb(false);
    // }
    //

    // If this is a payment protocol request,
    // ensure it hasn't been tampered with.
    if (!self.verifyPaymentRequest(ntxid)) {
      if (cb) cb(false);
      return;
    }

    var keys = self.privateKey.getForPaths(txp.inputChainPaths);

    var b = txp.builder;
    var before = txp.countSignatures();
    b.sign(keys);

    var ret = false;
    if (txp.countSignatures() > before) {
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
  var txp = this.txProposals.get(ntxid);

  if (txp.merchant) {
    return this.sendPaymentTx(ntxid, cb);
  }

  var tx = txp.builder.build();
  if (!tx.isComplete())
    throw new Error('Tx is not complete. Can not broadcast');
  this.log('Broadcasting Transaction');
  var scriptSig = tx.ins[0].getScript();
  var size = scriptSig.serialize().length;

  var txHex = tx.serialize().toString('hex');
  this.log('Raw transaction: ', txHex);

  var self = this;
  this.blockchain.sendRawTransaction(txHex, function(txid) {
    self.log('BITCOIND txid:', txid);
    if (txid) {
      self.txProposals.get(ntxid).setSent(txid);
      self.sendTxProposal(ntxid);
      self.store();
      return cb(txid);
    } else {
      self.log('Sent failed. Checking is the TX was sent already');
      self._checkSentTx(ntxid, function(txid) {
        if (txid)
          self.store();

        return cb(txid);
      });
    }
  });
};

Wallet.prototype.createPaymentTx = function(options, cb) {
  var self = this;

  if (typeof options === 'string') {
    options = {
      uri: options
    };
  }
  options.uri = options.uri || options.url;

  if (options.uri.indexOf('bitcoin:') === 0) {
    options.uri = new bitcore.BIP21(options.uri).data.merchant;
    if (!options.uri) {
      return cb(new Error('No URI.'));
    }
  }

  var req = this.paymentRequests[options.uri];
  if (req) {
    delete this.paymentRequests[options.uri];
    this.receivePaymentRequest(options, req.pr, cb);
    return;
  }

  return Wallet.request({
      method: 'GET',
      url: options.uri,
      headers: {
        'Accept': PayPro.PAYMENT_REQUEST_CONTENT_TYPE
      },
      responseType: 'arraybuffer'
    })
    .success(function(data, status, headers, config) {
      data = PayPro.PaymentRequest.decode(data);
      var pr = new PayPro();
      pr = pr.makePaymentRequest(data);
      return self.receivePaymentRequest(options, pr, cb);
    })
    .error(function(data, status, headers, config) {
      return cb(new Error('Status: ' + JSON.stringify(status)));
    });
};

Wallet.prototype.fetchPaymentTx = function(options, cb) {
  var self = this;

  options = options || {};
  if (typeof options === 'string') {
    options = {
      uri: options
    };
  }
  options.uri = options.uri || options.url;
  options.fetch = true;

  var req = this.paymentRequests[options.uri];
  if (req) {
    return cb(null, req.merchantData);
  }

  return this.createPaymentTx(options, function(err, merchantData, pr) {
    if (err) return cb(err);
    self.paymentRequests[options.uri] = {
      merchantData: merchantData,
      pr: pr
    };
    return cb(null, merchantData);
  });
};

Wallet.prototype.receivePaymentRequest = function(options, pr, cb) {
  var self = this;

  var ver = pr.get('payment_details_version');
  var pki_type = pr.get('pki_type');
  var pki_data = pr.get('pki_data');
  var details = pr.get('serialized_payment_details');
  var sig = pr.get('signature');

  var certs = PayPro.X509Certificates.decode(pki_data);
  certs = certs.certificate;

  // Fix for older versions of bitcore
  if (!PayPro.RootCerts) {
    PayPro.RootCerts = {
      getTrusted: function() {}
    };
  }

  var trusted = certs.map(function(cert) {
    var der = cert.toString('hex');
    var pem = PayPro.prototype._DERtoPEM(der, 'CERTIFICATE');
    return PayPro.RootCerts.getTrusted(pem);
  }).filter(Boolean);

  // Verify Signature
  var verified = pr.verify();

  if (!verified) {
    return cb(new Error('Server sent a bad signature.'));
  }

  var ca = trusted[0];

  details = PayPro.PaymentDetails.decode(details);
  var pd = new PayPro();
  pd = pd.makePaymentDetails(details);

  var network = pd.get('network');
  var outputs = pd.get('outputs');
  var time = pd.get('time');
  var expires = pd.get('expires');
  var memo = pd.get('memo');
  var payment_url = pd.get('payment_url');
  var merchant_data = pd.get('merchant_data');

  var merchantData = {
    pr: {
      payment_details_version: ver,
      pki_type: pki_type,
      pki_data: certs,
      pd: {
        network: network,
        outputs: outputs.map(function(output) {
          return {
            amount: output.get('amount'),
            script: {
              offset: output.get('script').offset,
              limit: output.get('script').limit,
              // NOTE: For some reason output.script.buffer
              // is only an ArrayBuffer
              buffer: new Buffer(new Uint8Array(
                output.get('script').buffer)).toString('hex')
            }
          };
        }),
        time: time,
        expires: expires,
        memo: memo || 'This server would like some BTC from you.',
        payment_url: payment_url,
        merchant_data: merchant_data.toString('hex')
      },
      signature: sig.toString('hex'),
      ca: ca,
      untrusted: !ca
    },
    request_url: options.uri,
    total: bignum('0', 10).toString(10),
    // Expose so other copayers can verify signature
    // and identity, not to mention data.
    raw: pr.serialize().toString('hex')
  };

  return this.getUnspent(function(err, safeUnspent, unspent) {
    if (options.fetch) {
      if (!unspent || !unspent.length) {
        return cb(new Error('No unspent outputs available.'));
      }
      try {
        self.createPaymentTxSync(options, merchantData, safeUnspent);
      } catch (e) {
        var msg = e.message || '';
        if (msg.indexOf('not enough unspent tx outputs to fulfill')) {
          var sat = /(\d+)/.exec(msg)[1];
          e = new Error('No unspent outputs available.');
          e.amount = sat;
          return cb(e);
        }
      }
      return cb(null, merchantData, pr);
    }

    var ntxid = self.createPaymentTxSync(options, merchantData, safeUnspent);
    if (ntxid) {
      self.sendIndexes();
      self.sendTxProposal(ntxid);
      self.store();
      self.emit('txProposalsUpdated');
    }

    self.log('You are currently on this BTC network:');
    self.log(network);
    self.log('The server sent you a message:');
    self.log(memo);

    return cb(ntxid, merchantData);
  });
};

Wallet.prototype.sendPaymentTx = function(ntxid, options, cb) {
  var self = this;

  if (!cb) {
    cb = options;
    options = {};
  }

  var txp = this.txProposals.get(ntxid);
  if (!txp) return;

  var tx = txp.builder.build();
  if (!tx.isComplete()) return;
  this.log('Sending Transaction');

  var refund_outputs = [];

  options.refund_to = options.refund_to || this.publicKeyRing.getPubKeys(0, false, this.getMyCopayerId())[0];

  if (options.refund_to) {
    var total = txp.merchant.pr.pd.outputs.reduce(function(total, _, i) {
      // XXX reverse endianness to work around bignum bug:
      var txv = tx.outs[i].v;
      var v = new Buffer(8);
      for (var j = 0; j < 8; j++) v[j] = txv[7 - j];
      return total.add(bignum.fromBuffer(v, {
        endian: 'big',
        size: 1
      }));
    }, bignum('0', 10));

    var rpo = new PayPro();
    rpo = rpo.makeOutput();

    // XXX Bad - the amount *has* to be a Number in protobufjs
    // Possibly does not matter - server can ignore the amount anyway.
    rpo.set('amount', +total.toString(10));

    rpo.set('script',
      Buffer.concat([
        new Buffer([
          118, // OP_DUP
          169, // OP_HASH160
          76, // OP_PUSHDATA1
          20, // number of bytes
        ]),
        // needs to be ripesha'd
        bitcore.util.sha256ripe160(options.refund_to),
        new Buffer([
          136, // OP_EQUALVERIFY
          172 // OP_CHECKSIG
        ])
      ])
    );

    refund_outputs.push(rpo.message);
  }

  // We send this to the serve after receiving a PaymentRequest
  var pay = new PayPro();
  pay = pay.makePayment();
  var merchant_data = txp.merchant.pr.pd.merchant_data;
  merchant_data = new Buffer(merchant_data, 'hex');
  pay.set('merchant_data', merchant_data);
  pay.set('transactions', [tx.serialize()]);
  pay.set('refund_to', refund_outputs);

  options.memo = options.memo || options.comment || 'Hi server, I would like to give you some money.';

  pay.set('memo', options.memo);

  pay = pay.serialize();

  this.log('Sending Payment Message:');
  this.log(pay.toString('hex'));

  var buf = new ArrayBuffer(pay.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i < pay.length; i++) {
    view[i] = pay[i];
  }

  return Wallet.request({
      method: 'POST',
      url: txp.merchant.pr.pd.payment_url,
      headers: {
        // BIP-71
        'Accept': PayPro.PAYMENT_ACK_CONTENT_TYPE,
        'Content-Type': PayPro.PAYMENT_CONTENT_TYPE
        // XHR does not allow these:
        // 'Content-Length': (pay.byteLength || pay.length) + '',
        // 'Content-Transfer-Encoding': 'binary'
      },
      // Technically how this should be done via XHR (used to
      // be the ArrayBuffer, now you send the View instead).
      data: view,
      responseType: 'arraybuffer'
    })
    .success(function(data, status, headers, config) {
      data = PayPro.PaymentACK.decode(data);
      var ack = new PayPro();
      ack = ack.makePaymentACK(data);
      return self.receivePaymentRequestACK(ntxid, tx, txp, ack, cb);
    })
    .error(function(data, status, headers, config) {
      return cb(new Error('Status: ' + JSON.stringify(status)));
    });
};

Wallet.prototype.receivePaymentRequestACK = function(ntxid, tx, txp, ack, cb) {
  var self = this;

  var payment = ack.get('payment');
  var memo = ack.get('memo');

  this.log('Our payment was acknowledged!');
  this.log('Message from Merchant: %s', memo);

  payment = PayPro.Payment.decode(payment);
  var pay = new PayPro();
  payment = pay.makePayment(payment);

  txp.merchant.ack = {
    memo: memo
  };

  var tx = payment.message.transactions[0];

  if (!tx) {
    this.log('Sending to server was not met with a returned tx.');
    return this._checkSentTx(ntxid, function(txid) {
      self.log('[Wallet.js.1048:txid:%s]', txid);
      if (txid) self.store();
      return cb(txid, txp.merchant);
    });
  }

  if (tx.buffer) {
    tx.buffer = new Buffer(new Uint8Array(tx.buffer));
    tx.buffer = tx.buffer.slice(tx.offset, tx.limit);
    var ptx = new bitcore.Transaction();
    ptx.parse(tx.buffer);
    tx = ptx;
  }

  var txid = tx.getHash().toString('hex');
  var txHex = tx.serialize().toString('hex');
  this.log('Raw transaction: ', txHex);
  this.log('BITCOIND txid:', txid);
  this.txProposals.get(ntxid).setSent(txid);
  this.sendTxProposal(ntxid);
  this.store();

  return cb(txid, txp.merchant);
};

Wallet.prototype.createPaymentTxSync = function(options, merchantData, unspent) {
  var self = this;
  var priv = this.privateKey;
  var pkr = this.publicKeyRing;

  preconditions.checkState(pkr.isComplete());
  if (options.memo) {
    preconditions.checkArgument(options.memo.length <= 100);
  }

  var opts = {
    remainderOut: {
      address: this._doGenerateAddress(true).toString()
    }
  };

  if (typeof opts.spendUnconfirmed === 'undefined') {
    opts.spendUnconfirmed = this.spendUnconfirmed;
  }

  for (var k in Wallet.builderOpts) {
    opts[k] = Wallet.builderOpts[k];
  }

  merchantData.total = bignum(merchantData.total, 10);

  var outs = [];
  merchantData.pr.pd.outputs.forEach(function(output) {
    var amount = output.amount;

    // big endian
    var v = new Buffer(8);
    v[0] = (amount.high >> 24) & 0xff;
    v[1] = (amount.high >> 16) & 0xff;
    v[2] = (amount.high >> 8) & 0xff;
    v[3] = (amount.high >> 0) & 0xff;
    v[4] = (amount.low >> 24) & 0xff;
    v[5] = (amount.low >> 16) & 0xff;
    v[6] = (amount.low >> 8) & 0xff;
    v[7] = (amount.low >> 0) & 0xff;

    var script = {
      offset: output.script.offset,
      limit: output.script.limit,
      buffer: new Buffer(output.script.buffer, 'hex')
    };
    var s = script.buffer.slice(script.offset, script.limit);
    var network = merchantData.pr.pd.network === 'main' ? 'livenet' : 'testnet';
    var addr = bitcore.Address.fromScriptPubKey(new bitcore.Script(s), network);

    outs.push({
      address: addr[0].toString(),
      amountSatStr: bignum.fromBuffer(v, {
        endian: 'big',
        size: 1
      }).toString(10)
    });

    merchantData.total = merchantData.total.add(bignum.fromBuffer(v, {
      endian: 'big',
      size: 1
    }));
  });

  merchantData.total = merchantData.total.toString(10);

  var b = new Builder(opts)
    .setUnspent(unspent)
    .setOutputs(outs);

  merchantData.pr.pd.outputs.forEach(function(output, i) {
    var script = {
      offset: output.script.offset,
      limit: output.script.limit,
      buffer: new Buffer(output.script.buffer, 'hex')
    };
    var s = script.buffer.slice(script.offset, script.limit);
    b.tx.outs[i].s = s;
  });

  var selectedUtxos = b.getSelectedUnspent();
  var inputChainPaths = selectedUtxos.map(function(utxo) {
    return pkr.pathForAddress(utxo.address);
  });

  b = b.setHashToScriptMap(pkr.getRedeemScriptMap(inputChainPaths));

  var keys = priv.getForPaths(inputChainPaths);
  var signed = b.sign(keys);

  if (options.fetch) return;

  this.log('');
  this.log('Created transaction:');
  this.log(b.tx.getStandardizedObject());
  this.log('');

  var myId = this.getMyCopayerId();
  var now = Date.now();

  var tx = b.build();
  if (!tx.countInputSignatures(0))
    throw new Error('Could not sign generated tx');

  var me = {};
  me[myId] = now;
  var meSeen = {};
  if (priv) meSeen[myId] = now;

  var ntxid = this.txProposals.add(new TxProposal({
    inputChainPaths: inputChainPaths,
    signedBy: me,
    seenBy: meSeen,
    creator: myId,
    createdTs: now,
    builder: b,
    comment: options.memo,
    merchant: merchantData
  }));
  return ntxid;
};

// This essentially ensures that a copayer hasn't tampered with a
// PaymentRequest message from a payment server. It verifies the signature
// based on the cert, and checks to ensure the desired outputs are the same as
// the ones on the tx proposal.
Wallet.prototype.verifyPaymentRequest = function(ntxid) {
  if (!ntxid) return false;

  var txp = typeof ntxid !== 'object' ? this.txProposals.get(ntxid) : ntxid;

  // If we're not a payment protocol proposal, ignore.
  if (!txp.merchant) return true;

  // The copayer didn't send us the raw payment request, unverifiable.
  if (!txp.merchant.raw) return false;

  // var tx = txp.builder.tx;
  var tx = txp.builder.build();

  var data = new Buffer(txp.merchant.raw, 'hex');
  data = PayPro.PaymentRequest.decode(data);
  var pr = new PayPro();
  pr = pr.makePaymentRequest(data);

  // Verify the signature so we know this is the real request.
  if (!pr.verify()) {
    // Signature does not match cert. It may have
    // been modified by an untrustworthy person.
    // We should not sign this transaction proposal!
    return false;
  }

  var details = pr.get('serialized_payment_details');
  details = PayPro.PaymentDetails.decode(details);
  var pd = new PayPro();
  pd = pd.makePaymentDetails(details);

  var outputs = pd.get('outputs');

  if (tx.outs.length < outputs.length) {
    // Outputs do not and cannot match.
    return false;
  }

  // Figure out whether the user is supposed
  // to decide the value of the outputs.
  var undecided = false;
  var total = bignum('0', 10);
  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i];
    var amount = output.get('amount');
    // big endian
    var v = new Buffer(8);
    v[0] = (amount.high >> 24) & 0xff;
    v[1] = (amount.high >> 16) & 0xff;
    v[2] = (amount.high >> 8) & 0xff;
    v[3] = (amount.high >> 0) & 0xff;
    v[4] = (amount.low >> 24) & 0xff;
    v[5] = (amount.low >> 16) & 0xff;
    v[6] = (amount.low >> 8) & 0xff;
    v[7] = (amount.low >> 0) & 0xff;
    total = total.add(bignum.fromBuffer(v, {
      endian: 'big',
      size: 1
    }));
  }
  if (+total.toString(10) === 0) {
    undecided = true;
  }

  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i];

    var amount = output.get('amount');
    var script = {
      offset: output.get('script').offset,
      limit: output.get('script').limit,
      buffer: new Buffer(new Uint8Array(output.get('script').buffer))
    };

    // Expected value
    // little endian (keep this LE to compare with tx output value)
    var ev = new Buffer(8);
    ev[0] = (amount.low >> 0) & 0xff;
    ev[1] = (amount.low >> 8) & 0xff;
    ev[2] = (amount.low >> 16) & 0xff;
    ev[3] = (amount.low >> 24) & 0xff;
    ev[4] = (amount.high >> 0) & 0xff;
    ev[5] = (amount.high >> 8) & 0xff;
    ev[6] = (amount.high >> 16) & 0xff;
    ev[7] = (amount.high >> 24) & 0xff;

    // Expected script
    var es = script.buffer.slice(script.offset, script.limit);

    // Actual value
    var av = tx.outs[i].v;

    // Actual script
    var as = tx.outs[i].s;

    // XXX allow changing of script as long as address is same
    // var as = es;

    // XXX allow changing of script as long as address is same
    // var network = pd.get('network') === 'main' ? 'livenet' : 'testnet';
    // var es = bitcore.Address.fromScriptPubKey(new bitcore.Script(es), network)[0];
    // var as = bitcore.Address.fromScriptPubKey(new bitcore.Script(tx.outs[i].s), network)[0];

    if (undecided) {
      av = ev = new Buffer([0]);
    }

    // Make sure the tx's output script and values match the payment request's.
    if (av.toString('hex') !== ev.toString('hex') || as.toString('hex') !== es.toString('hex')) {
      // Verifiable outputs do not match outputs of merchant
      // data. We should not sign this transaction proposal!
      return false;
    }

    // Checking the merchant data itself isn't technically
    // necessary as long as we check the transaction, but
    // we can do it for good measure.
    var ro = txp.merchant.pr.pd.outputs[i];

    // Actual value
    // little endian (keep this LE to compare with the ev above)
    var av = new Buffer(8);
    av[0] = (ro.amount.low >> 0) & 0xff;
    av[1] = (ro.amount.low >> 8) & 0xff;
    av[2] = (ro.amount.low >> 16) & 0xff;
    av[3] = (ro.amount.low >> 24) & 0xff;
    av[4] = (ro.amount.high >> 0) & 0xff;
    av[5] = (ro.amount.high >> 8) & 0xff;
    av[6] = (ro.amount.high >> 16) & 0xff;
    av[7] = (ro.amount.high >> 24) & 0xff;

    // Actual script
    var as = new Buffer(ro.script.buffer, 'hex')
      .slice(ro.script.offset, ro.script.limit);

    if (av.toString('hex') !== ev.toString('hex') || as.toString('hex') !== es.toString('hex')) {
      return false;
    }
  }

  return true;
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


// See 
// https://github.com/bitpay/copay/issues/1056
//
// maxRejectCount should equal requiredCopayers
// strictly. 
//
Wallet.prototype.maxRejectCount = function(cb) {
  return this.totalCopayers - this.requiredCopayers;
};

Wallet.prototype.getUnspent = function(cb) {
  var self = this;
  this.blockchain.getUnspent(this.getAddressesStr(), function(err, unspentList) {

    if (err) {
      return cb(err);
    }

    var safeUnspendList = [];
    var uu = self.txProposals.getUsedUnspent(self.maxRejectCount());

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

  if (typeof amountSatStr === 'function') {
    var cb = amountSatStr;
    var merchant = toAddress;
    return this.createPaymentTx({
      uri: merchant
    }, cb);
  }

  if (typeof comment === 'function') {
    var cb = comment;
    var merchant = toAddress;
    var comment = amountSatStr;
    return this.createPaymentTx({
      uri: merchant,
      memo: comment
    }, cb);
  }

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

  preconditions.checkArgument(new Address(toAddress).network().name === this.getNetworkName(), 'networkname mismatch');
  preconditions.checkState(pkr.isComplete(), 'pubkey ring incomplete');
  preconditions.checkState(priv, 'no private key');
  preconditions.checkArgument(bignum(amountSatStr, 10).cmp(copayConfig.limits.minAmountSatoshi) >= 0, 'invalid amount');
  if (comment) preconditions.checkArgument(comment.length <= 100);

  if (!opts.remainderOut) {
    opts.remainderOut = {
      address: this._doGenerateAddress(true).toString()
    };
  }

  for (var k in Wallet.builderOpts) {
    opts[k] = Wallet.builderOpts[k];
  }

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setOutputs([{
      address: toAddress,
      amountSatStr: amountSatStr,
    }]);

  var selectedUtxos = b.getSelectedUnspent();
  var inputChainPaths = selectedUtxos.map(function(utxo) {
    return pkr.pathForAddress(utxo.address);
  });

  b = b.setHashToScriptMap(pkr.getRedeemScriptMap(inputChainPaths));

  var keys = priv.getForPaths(inputChainPaths);
  var signed = b.sign(keys);
  var myId = this.getMyCopayerId();
  var now = Date.now();


  var tx = b.build();
  if (!tx.countInputSignatures(0))
    throw new Error('Could not sign generated tx');

  var me = {};
  me[myId] = now;

  var meSeen = {};
  if (priv) meSeen[myId] = now;

  var ntxid = this.txProposals.add(new TxProposal({
    inputChainPaths: inputChainPaths,
    signedBy: me,
    seenBy: meSeen,
    creator: myId,
    createdTs: now,
    builder: b,
    comment: comment
  }));
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
  self.indexDiscovery(index.changeIndex, true, index.copayerIndex, SCANN_WINDOW, function(err, changeIndex) {
    if (err) return callback(err);
    if (changeIndex != -1)
      index.changeIndex = changeIndex + 1;

    self.indexDiscovery(index.receiveIndex, false, index.copayerIndex, SCANN_WINDOW, function(err, receiveIndex) {
      if (err) return callback(err);
      if (receiveIndex != -1)
        index.receiveIndex = receiveIndex + 1;
      callback();
    });
  });
}

Wallet.prototype.deriveAddresses = function(index, amount, isChange, copayerIndex) {
  preconditions.checkArgument(amount);
  preconditions.shouldBeDefined(copayerIndex);

  var ret = new Array(amount);
  for (var i = 0; i < amount; i++) {
    ret[i] = this.publicKeyRing.getAddress(index + i, isChange, copayerIndex).toString();
  }
  return ret;
}

// This function scans the publicKeyRing branch starting at index @start and reports the index with last activity,
// using a scan window of @gap. The argument @change defines the branch to scan: internal or external.
// Returns -1 if no activity is found in range.
Wallet.prototype.indexDiscovery = function(start, change, copayerIndex, gap, cb) {
  preconditions.shouldBeDefined(copayerIndex);
  preconditions.checkArgument(gap);
  var scanIndex = start;
  var lastActive = -1;
  var hasActivity = false;

  var self = this;
  async.doWhilst(
    function _do(next) {
      // Optimize window to minimize the derivations.
      var scanWindow = (lastActive == -1) ? gap : gap - (scanIndex - lastActive) + 1;
      var addresses = self.deriveAddresses(scanIndex, scanWindow, change, copayerIndex);
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
  this.lock.release();
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

Wallet.prototype.verifyAddressbookEntry = function(rcvEntry, senderId, key) {
  if (!key) throw new Error('Keys are required');
  var signature = rcvEntry.signature;
  var payload = {
    address: key,
    label: rcvEntry.label,
    copayerId: rcvEntry.copayerId,
    createdTs: rcvEntry.createdTs
  };
  return this.verifySignedJson(senderId, payload, signature);
}

Wallet.prototype.toggleAddressBookEntry = function(key) {
  if (!key) throw new Error('Key is required');
  this.addressBook[key].hidden = !this.addressBook[key].hidden;
  this.store();
};

Wallet.prototype.isShared = function() {
  return this.totalCopayers > 1;
}

Wallet.prototype.isReady = function() {
  var ret = this.publicKeyRing.isComplete() && this.publicKeyRing.isFullyBackup();
  return ret;
};

Wallet.prototype.setBackupReady = function() {
  this.publicKeyRing.setBackupReady();
  this.sendPublicKeyRing();
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

// NOTE: Angular $http module does not send ArrayBuffers correctly, so we're
// not going to use it. We'll have to write our own. Otherwise, we could
// hex-encoded our messages and decode them on the other side, but that
// deviates from BIP-70.

// if (typeof angular !== 'undefined') {
//   var $http = angular.bootstrap().get('$http');
// }

Wallet.request = function(options, callback) {
  if (typeof options === 'string') {
    options = {
      uri: options
    };
  }

  options.method = options.method || 'GET';
  options.headers = options.headers || {};

  var ret = {
    success: function(cb) {
      this._success = cb;
      return this;
    },
    error: function(cb) {
      this._error = cb;
      return this;
    },
    _success: function() {;
    },
    _error: function(_, err) {
      throw err;
    }
  };

  var method = (options.method || 'GET').toUpperCase();
  var uri = options.uri || options.url;
  var req = options;

  req.headers = req.headers || {};
  req.body = req.body || req.data || {};

  var xhr = new XMLHttpRequest();
  xhr.open(method, uri, true);

  Object.keys(req.headers).forEach(function(key) {
    var val = req.headers[key];
    if (key === 'Content-Length') return;
    if (key === 'Content-Transfer-Encoding') return;
    xhr.setRequestHeader(key, val);
  });

  if (req.responseType) {
    xhr.responseType = req.responseType;
  }

  xhr.onload = function(event) {
    var response = xhr.response;
    var buf = new Uint8Array(response);
    var headers = {};
    (xhr.getAllResponseHeaders() || '').replace(
      /(?:\r?\n|^)([^:\r\n]+): *([^\r\n]+)/g,
      function($0, $1, $2) {
        headers[$1.toLowerCase()] = $2;
      }
    );
    return ret._success(buf, xhr.status, headers, options);
  };

  xhr.onerror = function(event) {
    return ret._error(null, new Error(event.message), null, options);
  };

  if (req.body) {
    xhr.send(req.body);
  } else {
    xhr.send(null);
  }

  return ret;
};

module.exports = Wallet;
