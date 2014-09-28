'use strict';

var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var async = require('async');
var preconditions = require('preconditions').singleton();
var inherits = require('inherits');
var events = require('events');

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
var log = require('../log');

var HDParams = require('./HDParams');
var PublicKeyRing = require('./PublicKeyRing');
var TxProposal = require('./TxProposal');
var TxProposals = require('./TxProposals');
var PrivateKey = require('./PrivateKey');
var WalletLock = require('./WalletLock');
var copayConfig = require('../../config');

/**
 * @desc
 * Wallet manages a private key for Copay, network, storage of the wallet for
 * persistance, and blockchain information.
 *
 * @TODO: Split this leviathan.
 *
 * @param {Object} opts
 * @param {Storage} opts.storage - an object that can persist the wallet
 * @param {Network} opts.network - used to send and retrieve messages from
 *                                 copayers
 * @param {Blockchain} opts.blockchain - source of truth for what happens in
 *                                       the blockchain (utxos, balances)
 * @param {number} opts.requiredCopayers - number of required copayers to
 *                                         release funds
 * @param {number} opts.totalCopayers - number of copayers in the wallet
 * @param {boolean} opts.spendUnconfirmed - whether it's safe to spend
 *                                          unconfirmed outputs or not
 * @param {PublicKeyRing} opts.publicKeyRing - an instance of {@link PublicKeyRing}
 * @param {TxProposals} opts.txProposals - an instance of {@link TxProposals}
 * @param {PrivateKey} opts.privateKey - an instance of {@link PrivateKey}
 * @param {string} opts.version - the version of copay where this wallet was
 *                                created
 * @TODO: figure out if reconnectDelay is set in milliseconds
 * @param {number} opts.reconnectDelay - amount of seconds to wait before
 *                                       attempting to reconnect
 * @constructor
 */
function Wallet(opts) {
  var self = this;

  //required params
  ['storage', 'network', 'blockchain',
    'requiredCopayers', 'totalCopayers', 'spendUnconfirmed',
    'publicKeyRing', 'txProposals', 'privateKey', 'version',
    'reconnectDelay'
  ].forEach(function(k) {
    preconditions.checkArgument(!_.isUndefined(opts[k]), 'MISSOPT: missing required option for Wallet: ' + k);
    self[k] = opts[k];
  });

  this.id = opts.id || Wallet.getRandomId();
  this.secretNumber = opts.secretNumber || Wallet.getRandomNumber();
  this.lock = new WalletLock(this.storage, this.id, opts.lockTimeOutMin);
  this.settings = opts.settings || copayConfig.wallet.settings;
  this.name = opts.name;

  this.publicKeyRing.walletId = this.id;
  this.txProposals.walletId = this.id;
  this.network.maxPeers = this.totalCopayers;
  this.network.secretNumber = this.secretNumber;
  this.registeredPeerIds = [];
  this.addressBook = opts.addressBook || {};
  this.publicKey = this.privateKey.publicHex;
  this.lastTimestamp = opts.lastTimestamp || undefined;
  this.lastMessageFrom = {};

  //to avoid confirmation of copayer's backups if is imported from a file
  this.isImported = opts.isImported || false;


  //to avoid waiting others copayers to make a backup and login immediatly
  this.forcedLogin = opts.forcedLogin || false;

  this.paymentRequests = opts.paymentRequests || {};

  //network nonces are 8 byte buffers, representing a big endian number
  //one nonce for oneself, and then one nonce for each copayer
  this.network.setHexNonce(opts.networkNonce);
  this.network.setHexNonces(opts.networkNonces);
}

inherits(Wallet, events.EventEmitter);

/**
 * @TODO: Document this. Its usage is kind of weird
 *
 * @static
 * @property lockTime
 * @property signhash
 * @property fee
 * @property feeSat
 */
Wallet.builderOpts = {
  lockTime: null,
  signhash: bitcore.Transaction.SIGHASH_ALL,
  fee: undefined,
  feeSat: undefined,
};

/**
 * @desc static list with persisted properties of a wallet.
 * These are the properties that get stored/read from localstorage
 */
Wallet.PERSISTED_PROPERTIES = [
  'opts',
  'settings',
  'publicKeyRing',
  'txProposals',
  'privateKey',
  'addressBook',
  'backupOffered',
  'lastTimestamp',
];

Wallet.COPAYER_PAIR_LIMITS = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 4,
  6: 3,
  7: 3,
  8: 2,
  9: 2,
  10: 2,
  11: 1,
  12: 1,
};

/**
 * @desc Retrieve a random id for the wallet
 * @TODO: Discuss changing to a UUID
 * @return {string} 8 bytes, hexa encoded
 */
Wallet.getRandomId = function() {
  var r = bitcore.SecureRandom.getPseudoRandomBuffer(8).toString('hex');
  return r;
};

/**
 * @desc Get a random 8 byte number and encode it as a hexa string
 * @return {string}
 */
Wallet.getRandomNumber = function() {
  var r = bitcore.SecureRandom.getPseudoRandomBuffer(5).toString('hex');
  return r;
};

/**
 * @desc
 * Get the maximum allowed number of required copayers.
 * This is a limit imposed by the maximum allowed size of the scriptSig.
 * @param {number} totalCopayers - the total number of copayers
 * @return {number}
 */
Wallet.getMaxRequiredCopayers = function(totalCopayers) {
  return Wallet.COPAYER_PAIR_LIMITS[totalCopayers];
};


/**
 * @desc Set the copayer id for the owner of this wallet
 * @param {string} pubkey - the pubkey to set to the {@link Wallet#seededCopayerId} property
 */
Wallet.prototype.seedCopayer = function(pubKey) {
  this.seededCopayerId = pubKey;
};

/**
 * @desc Handles an 'indexes' message.
 *
 * Processes the data using {@link HDParams#fromList} and merges it with the
 * {@link Wallet#publicKeyRing}.
 *
 * Triggers a {@link Wallet#store} if the internal state has changed.
 *
 * @param {string} senderId - the sender id
 * @param {Object} data - the data recived, {@see HDParams#fromList}
 * @emits publicKeyRingUpdated
 */
Wallet.prototype._onIndexes = function(senderId, data) {
  log.debug('RECV INDEXES:', data);
  var inIndexes = HDParams.fromList(data.indexes);
  var hasChanged = this.publicKeyRing.mergeIndexes(inIndexes);
  if (hasChanged) {
    this.emit('publicKeyRingUpdated');
    this.store();
  }
};

/**
 * @desc
 * Changes wallet settings. The settings format is:
 *
 *   var settings = {
 *     unitName: 'bits',
 *     unitToSatoshi: 100,
 *     alternativeName: 'US Dollar',
 *     alternativeIsoCode: 'USD',
 *   };
 */
Wallet.prototype.changeSettings = function(settings) {
  this.settings = settings;
  this.store();
};

/**
 * @desc
 * Handles a 'PUBLICKEYRING' message from <tt>senderId</tt>.
 *
 * <tt>data.publicKeyRing</tt> is expected to be processed correctly by
 * {@link PublicKeyRing#fromObj}.
 *
 * After successful deserialization, {@link Wallet#publicKeyRing} is merged
 * with the received data, a call to {@link Wallet#store} is performed if the
 * internal state has changed.
 *
 * This locks new incoming connections in case the public key ring is completed
 *
 * @param {string} senderId - the sender id
 * @param {Object} data - the data recived, {@see HDParams#fromList}
 * @param {Object} data.publicKeyRing - data to be deserialized into a {@link PublicKeyRing}
 *                                      using {@link PublicKeyRing#fromObj}
 * @emits publicKeyRingUpdated
 * @emits connectionError
 */
Wallet.prototype._onPublicKeyRing = function(senderId, data) {
  log.debug('RECV PUBLICKEYRING:', data);

  var inPKR = PublicKeyRing.fromObj(data.publicKeyRing);
  var wasIncomplete = !this.publicKeyRing.isComplete();
  var hasChanged;

  try {
    hasChanged = this.publicKeyRing.merge(inPKR, true);
  } catch (e) {
    log.debug('## WALLET ERROR', e);
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

/**
 * @desc
 * Demultiplexes calls to update TxProposal updates
 *
 * @param {string} senderId - the copayer that sent this event
 * @param {Object} m - the data received
 * @emits txProposalEvent
 */
Wallet.prototype._processProposalEvents = function(senderId, m) {
  var ev;
  if (m) {
    if (m.new) {
      ev = {
        type: 'new',
        cId: senderId
      }
    } else if (m.newCopayer.length) {
      ev = {
        type: 'signed',
        cId: m.newCopayer[0]
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
/**
 * @desc
 * Retrieves a keymap from from a transaction proposal set extracts a maps from
 * public key to cosignerId for each signed input of the transaction proposal.
 *
 * @param {TxProposals} txp - the transaction proposals
 * @return {Object}
 */
Wallet.prototype._getKeyMap = function(txp) {
  preconditions.checkArgument(txp);
  var inSig0, keyMapAll = {};

  for (var i in txp._inputSigners) {
    var keyMap = this.publicKeyRing.copayersForPubkeys(txp._inputSigners[i], txp.inputChainPaths);

    if (_.size(keyMap) !== _.size(txp._inputSigners[i]))
      throw new Error('Signature does not match known copayers');

    for (var j in keyMap) {
      keyMapAll[j] = keyMap[j];
    }

    // From here -> only to check that all inputs have the same sigs
    var inSigArr = [];
    _.each(keyMap, function(value, key) {
      inSigArr.push(value);
    });
    var inSig = JSON.stringify(inSigArr.sort());
    if (i === '0') {
      inSig0 = inSig;
      continue;
    }
    if (inSig !== inSig0)
      throw new Error('found inputs with different signatures');
  }
  return keyMapAll;
};

/**
 * @callback transactionCallback
 * @param {false|Transaction} returnValue
 */

/**
 * @desc
 * Asyncchronously check with the blockchain if a given transaction was sent.
 *
 * @param {string} ntxid - the transaction
 * @param {transactionCallback} cb
 */
Wallet.prototype._checkSentTx = function(ntxid, cb) {
  var txp = this.txProposals.get(ntxid);
  var tx = txp.builder.build();
  var txid = bitcore.util.formatHashFull(tx.getHash());

  this.blockchain.getTransaction(txid, function(err, tx) {
    if (err) return cb(false);
    return cb(ret);
  });
};

/**
 * @desc
 * Handles a 'TXPROPOSAL' network message
 *
 * @param {string} senderId - the id of the sender
 * @param {Object} data - the data received
 * @param {Object} data.txProposal - first parameter for {@link TxProposals#merge}
 * @emits txProposalsUpdated
 */
Wallet.prototype._onTxProposal = function(senderId, data) {
  var self = this;
  log.debug('RECV TXPROPOSAL: ', data);
  var m;

  try {
    m = this.txProposals.merge(data.txProposal, Wallet.builderOpts);
    var keyMap = this._getKeyMap(m.txp);
    m.newCopayer = m.txp.setCopayers(senderId, keyMap);
  } catch (e) {
    log.error('Corrupt TX proposal received from:', senderId, e.toString());
    m = null;
  }

  if (m) {
    if (!m.txp.getSeen(this.getMyCopayerId())) {
      m.txp.setSeen(this.getMyCopayerId());
      this.sendSeen(m.ntxid);
    }

    var tx = m.txp.builder.build();
    if (tx.isComplete()) {
      this._checkSentTx(m.ntxid, function(ret) {
        if (ret) {
          if (!m.txp.getSent()) {
            m.txp.setSent(m.ntxid);
            self.emit('txProposalsUpdated');
            self.store();
          }
        }
      });
    } else {
      if (m.hasChanged) {
        this.sendTxProposal(m.ntxid);
      }
    }

    this.emit('txProposalsUpdated');
    this.store();
  }
  this._processProposalEvents(senderId, m);
};

/**
 * @desc
 * Handle a REJECT message received
 *
 * @param {string} senderId
 * @param {Object} data
 * @param {string} data.ntxid
 * @emits txProposalsUpdated
 * @emits txProposalEvent
 */
Wallet.prototype._onReject = function(senderId, data) {
  preconditions.checkState(data.ntxid);
  log.debug('RECV REJECT:', data);

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

/**
 * @desc
 * Handle a SEEN message received
 *
 * @param {string} senderId
 * @param {Object} data
 * @param {string} data.ntxid
 * @emits txProposalsUpdated
 * @emits txProposalEvent
 */
Wallet.prototype._onSeen = function(senderId, data) {
  preconditions.checkState(data.ntxid);
  log.debug('RECV SEEN:', data);

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

/**
 * @desc
 * Handle a ADDRESSBOOK message received
 *
 * {@see Wallet#verifyAddressbookEntry}
 *
 * @param {string} senderId
 * @param {Object} data
 * @param {Object} data.addressBook
 * @emits addressBookUpdated
 * @emits txProposalEvent
 */
Wallet.prototype._onAddressBook = function(senderId, data) {
  preconditions.checkState(data.addressBook);
  log.debug('RECV ADDRESSBOOK:', data);
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

/**
 * @desc Updates the wallet's last modified timestamp and triggers a save
 * @param {number} ts - the timestamp
 */
Wallet.prototype.updateTimestamp = function(ts) {
  preconditions.checkArgument(ts);
  preconditions.checkArgument(_.isNumber(ts));
  this.lastTimestamp = ts;
  this.store();
};

/**
 * @desc Called when there are no messages in the server
 * Triggers a call to {@link Wallet#sendWalletReady}
 */
Wallet.prototype._onNoMessages = function() {
  log.debug('No messages at the server. Requesting peer sync from: ' + this.lastTimestamp + 1); //TODO
  this.sendWalletReady(null, parseInt((this.lastTimestamp + 1) / 1000));
};

/**
 * @desc Demultiplexes a new message received through the wire
 *
 * @param {string} senderId - the sender id
 * @param {Object} data - the received object
 * @param {number} ts - the timestamp when this object was received
 *
 * @emits corrupt
 */
Wallet.prototype._onData = function(senderId, data, ts) {
  preconditions.checkArgument(senderId);
  preconditions.checkArgument(data);
  preconditions.checkArgument(data.type);
  preconditions.checkArgument(ts);
  preconditions.checkArgument(_.isNumber(ts));
  log.debug('RECV', senderId, data);

  if (data.type !== 'walletId' && this.id !== data.walletId) {
    log.debug('Received corrupt message:', data)
    this.emit('corrupt', senderId);
    this.updateTimestamp(ts);
    return;
  }

  switch (data.type) {
    // This handler is repeaded on WalletFactory (#join). TODO
    case 'walletId':
      this.sendWalletReady(senderId);
      break;
    case 'walletReady':
      if (this.lastMessageFrom[senderId] !== 'walletReady') {
        log.debug('peer Sync received. since: ' + (data.sinceTs || 0));
        this.sendPublicKeyRing(senderId);
        this.sendAddressBook(senderId);
        this.sendAllTxProposals(senderId, data.sinceTs); // send old txps
      }
      break;
    case 'publicKeyRing':
      this._onPublicKeyRing(senderId, data);
      break;
    case 'reject':
      this._onReject(senderId, data);
      break;
    case 'seen':
      this._onSeen(senderId, data);
      break;
    case 'txProposal':
      this._onTxProposal(senderId, data);
      break;
    case 'indexes':
      this._onIndexes(senderId, data);
      break;
    case 'addressbook':
      this._onAddressBook(senderId, data);
      break;
      // unused messages
    case 'disconnect':
      //case 'an other unused message':
      break;
    default:
      throw new Error('unknown message type received: ' + data.type + ' from: ' + senderId)
  }

  this.lastMessageFrom[senderId] = data.type;
  this.updateTimestamp(ts);
};

/**
 * @desc Handles a connect message
 * @param {string} newCopayerId - the new copayer in the wallet
 * @emits connect
 */
Wallet.prototype._onConnect = function(newCopayerId) {
  if (newCopayerId) {
    log.debug('#### Setting new COPAYER:', newCopayerId);
    this.sendWalletId(newCopayerId);
  }
  var peerID = this.network.peerFromCopayer(newCopayerId)
  this.emit('connect', peerID);
};

/**
 * @desc Returns the network name for this wallet ('testnet' or 'livenet')
 * @return {string}
 */
Wallet.prototype.getNetworkName = function() {
  return this.publicKeyRing.network.name;
};

/**
 * @desc Serialize options into an object
 * @return {Object} with keys <tt>id</tt>, <tt>spendUnconfirmed</tt>,
 * <tt>requiredCopayers</tt>, <tt>totalCopayers</tt>, <tt>name</tt>,
 * <tt>version</tt>
 */
Wallet.prototype._optsToObj = function() {
  var obj = {
    id: this.id,
    spendUnconfirmed: this.spendUnconfirmed,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,
    name: this.name,
    version: this.version,
    networkName: this.getNetworkName(),
  };

  return obj;
};

/**
 * @desc Retrieve the copayerId pubkey for a given index
 * @param {number=} index - the index of the copayer, ours by default
 * @return {string} hex-encoded pubkey
 */
Wallet.prototype.getCopayerId = function(index) {
  return this.publicKeyRing.getCopayerId(index || 0);
};

/**
 * @desc Get my own pubkey
 * @return {string} hex-encoded pubkey
 */
Wallet.prototype.getMyCopayerId = function() {
  return this.getCopayerId(0); //copayer id is hex of a public key
};

/**
 * @desc Retrieve my private key
 * @return {string} hex-encoded private key
 */
Wallet.prototype.getMyCopayerIdPriv = function() {
  return this.privateKey.getIdPriv(); //copayer idpriv is hex of a private key
};

/**
 * @desc Get my own nickname
 * @return {string} copayer nickname
 */
Wallet.prototype.getMyCopayerNickname = function() {
  return this.publicKeyRing.nicknameForCopayer(this.getMyCopayerId());
};

/**
 * @desc Returns the secret value for other users to join this wallet
 * @return {string} my own pubkey, base58 encoded
 */
Wallet.prototype.getSecretNumber = function() {
  if (this.secretNumber) return this.secretNumber;
  this.secretNumber = Wallet.getRandomNumber();
  return this.secretNumber;
};

/**
 * @desc Returns the secret number used to prevent MitM attacks from Insight
 * @return {string}
 */
Wallet.prototype.getSecret = function() {
  var buf = new Buffer(
    this.getMyCopayerId() +
    this.getSecretNumber() +
    (this.getNetworkName() === 'livenet' ? '00' : '01'),
    'hex');
  var str = Base58Check.encode(buf);
  return str;
};

/**
 * @desc Returns an object with a <tt>pubKey</tt> value, an hex representation
 * of a public key
 * @param {string} secretB - the secret to be base58-decoded
 * @return {Object}
 */
Wallet.decodeSecret = function(secretB) {
  var secret = Base58Check.decode(secretB);
  var pubKeyBuf = secret.slice(0, 33);
  var secretNumber = secret.slice(33, 38);
  var networkName = secret.slice(38, 39).toString('hex') === '00' ? 'livenet' : 'testnet';
  return {
    pubKey: pubKeyBuf.toString('hex'),
    secretNumber: secretNumber.toString('hex'),
    networkName: networkName,
  }
};

/**
 * @desc Locks other sessions from connecting to the wallet
 * @see Async#lockIncommingConnections
 */
Wallet.prototype._lockIncomming = function() {
  this.network.lockIncommingConnections(this.publicKeyRing.getAllCopayerIds());
};



Wallet.prototype._setBlockchainListeners = function() {
  var self = this;
  this.blockchain.removeAllListeners();

  this.blockchain.on('reconnect', function(attempts) {
    log.debug('blockchain reconnect event');
    self.emit('insightReconnected');
  });

  this.blockchain.on('disconnect', function() {
    log.debug('blockchain disconnect event');
    self.emit('insightError');
  });
  this.blockchain.on('tx', function(tx) {
    log.debug('blockchain tx event');
    var addresses = self.getAddressesInfo();
    var addr = _.findWhere(addresses, {
      addressStr: tx.address
    });
    if (addr) {
      self.emit('tx', tx.address, addr.isChange);
    }
  });

  if (!self.spendUnconfirmed) {
    self.blockchain.on('block', self.emit.bind(self, 'balanceUpdated'));
  }
}

/**
 * @desc Sets up the networking with other peers.
 *
 * @emits connect
 * @emits data
 *
 * @emits ready
 * @emits publicKeyRingUpdated
 * @emits txProposalsUpdated
 *
 * @TODO: FIX PROTOCOL -- emit with a space is shitty
 * @emits no messages
 */
Wallet.prototype.netStart = function() {
  var self = this;
  var net = this.network;

  net.removeAllListeners();
  net.on('connect', self._onConnect.bind(self));
  net.on('data', self._onData.bind(self));
  net.on('no messages', self._onNoMessages.bind(self));

  var myId = self.getMyCopayerId();
  var myIdPriv = self.getMyCopayerIdPriv();

  var startOpts = {
    copayerId: myId,
    privkey: myIdPriv,
    maxPeers: self.totalCopayers,
    lastTimestamp: this.lastTimestamp,
    secretNumber: self.secretNumber,
  };

  if (this.publicKeyRing.isComplete()) {
    this._lockIncomming();
  }

  net.on('connect_error', function() {
    self.emit('connectionError');
  });

  net.start(startOpts, function() {
    self._setBlockchainListeners();
    self.emit('ready', net.getPeer());
    setTimeout(function() {
      self.emit('publicKeyRingUpdated', true);
      // no connection logic for now
      self.emit('txProposalsUpdated');
    }, 10);
  });
};

/**
 * @desc Retrieves the public keys of all the copayers in the ring
 * @return {string[]} hex-encoded public keys of copayers
 */
Wallet.prototype.getRegisteredCopayerIds = function() {
  var l = this.publicKeyRing.registeredCopayers();
  var copayers = [];
  for (var i = 0; i < l; i++) {
    var cid = this.getCopayerId(i);
    copayers.push(cid);
  }
  return copayers;
};

/**
 * @desc Retrieves the public keys of all the peers in the network
 * @TODO: Isn't this deprecated? Now that we don't use peerjs
 *
 * @return {string[]} hex-encoded public keys of copayers
 */
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

/**
 * @TODO: Review design of this call
 * @desc Send a keepalive to this wallet's {@link WalletLock} instance.
 *
 * @emits locked - in case the wallet is opened in another instance
 */
Wallet.prototype.keepAlive = function() {
  var self = this;

  this.lock.keepAlive(function(err) {
    if (err) {
      log.debug(err);
      self.emit('locked', null, 'Wallet appears to be openned on other browser instance. Closing this one.');
    }
  });
};

/**
 * @desc Store the wallet's state
 * @param {function} callback (err)
 */
Wallet.prototype.store = function(cb) {
  var self = this;
  this.keepAlive();

  var val  = this.toObj();
  var key = 'wallet::' + this.id + ((val.opts && val.opts.name) ? '_' + obj.opts.name : '');
  this.storage.set(key, val, function(err) {
    log.debug('Wallet stored');
    if (cb)
      cb(err);
  });
};

/**
 * @desc Serialize the wallet into a plain object.
 * @return {Object}
 */
Wallet.prototype.toObj = function() {
  var optsObj = this._optsToObj();

  var walletObj = {
    opts: optsObj,
    settings: this.settings,
    networkNonce: this.network.getHexNonce(), //yours
    networkNonces: this.network.getHexNonces(), //copayers
    publicKeyRing: this.publicKeyRing.toObj(),
    txProposals: this.txProposals.toObj(),
    privateKey: this.privateKey ? this.privateKey.toObj() : undefined,
    addressBook: this.addressBook,
    lastTimestamp: this.lastTimestamp,
  };

  return walletObj;
};

/**
 * @desc Retrieve the wallet state from a trusted object
 *
 * @param {Object} o
 * @param {Object[]} o.addressBook - Stores known associations of bitcoin addresses to names
 * @param {Object} o.privateKey - Private key to be deserialized by {@link PrivateKey#fromObj}
 * @param {string} o.networkName - 'livenet' or 'testnet'
 * @param {Object} o.publicKeyRing - PublicKeyRing to be deserialized by {@link PublicKeyRing#fromObj}
 * @param {number} o.lastTimestamp - last time this wallet object was deserialized
 * @param {Object} o.txProposals - TxProposals to be deserialized by {@link TxProposals#fromObj}
 * @param {string} o.nickname - user's nickname
 * @param {Storage} storage - a Storage instance to store the data of the wallet
 * @param {Network} network - a Network instance to communicate with peers
 * @param {Blockchain} blockchain - a Blockchain instance to retrieve state from the blockchain
 */
Wallet.fromObj = function(o, storage, network, blockchain) {

  // clone opts
  var opts = JSON.parse(JSON.stringify(o.opts));

  opts.addressBook = o.addressBook;
  opts.settings = o.settings;

  if (o.privateKey) {
    opts.privateKey = PrivateKey.fromObj(o.privateKey);
  } else {
    opts.privateKey = new PrivateKey({
      networkName: opts.networkName
    });
  }

  if (o.publicKeyRing) {
    opts.publicKeyRing = PublicKeyRing.fromObj(o.publicKeyRing);
  } else {
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

  if (o.txProposals) {
    opts.txProposals = TxProposals.fromObj(o.txProposals, Wallet.builderOpts);
  } else {
    opts.txProposals = new TxProposals({
      networkName: this.networkName,
    });
  }

  opts.lastTimestamp = o.lastTimestamp;

  opts.storage = storage;
  opts.network = network;
  opts.blockchain = blockchain;
  opts.isImported = true;

  return new Wallet(opts);
};

/**
 * @desc Return a base64 encrypted version of the wallet
 * @return {string} base64 encoded string
 */
Wallet.prototype.toEncryptedObj = function() {
  var walletObj = this.toObj();
  return this.storage.export(walletObj);
};

/**
 * @desc Send a message to other peers
 * @param {string[]} recipients - the pubkey of the recipients of the message
 * @param {Object} obj - the data to be sent to them
 */
Wallet.prototype.send = function(recipients, obj) {
  this.network.send(recipients, obj);
};

/**
 * @desc Send the set of TxProposals to some peers
 * @param {string[]} recipients - the pubkeys of the recipients
 */
Wallet.prototype.sendAllTxProposals = function(recipients, sinceTs) {
  var ntxids = sinceTs ? this.txProposals.getNtxidsSince(sinceTs) : this.txProposals.getNtxids();
  var self = this;
  _.each(ntxids, function(ntxid, key) {
    self.sendTxProposal(ntxid, recipients);
  });
};

/**
 * @desc Send a TxProposal identified by transaction id to a set of recipients
 * @param {string} ntxid - the transaction proposal id
 * @param {string[]} [recipients] - the pubkeys of the recipients
 */
Wallet.prototype.sendTxProposal = function(ntxid, recipients) {
  preconditions.checkArgument(ntxid);
  log.debug('### SENDING txProposal ' + ntxid + ' TO:', recipients || 'All', this.txProposals);
  this.send(recipients, {
    type: 'txProposal',
    txProposal: this.txProposals.get(ntxid).toObjTrim(),
    walletId: this.id,
  });
};

/**
 * @desc Notifies other peers that a transaction proposal was seen
 * @param {string} ntxid
 */
Wallet.prototype.sendSeen = function(ntxid) {
  preconditions.checkArgument(ntxid);
  log.debug('### SENDING seen:  ' + ntxid + ' TO: All');
  this.send(null, {
    type: 'seen',
    ntxid: ntxid,
    walletId: this.id,
  });
};

/**
 * @desc Notifies other peers that a transaction proposal was rejected
 * @param {string} ntxid
 */
Wallet.prototype.sendReject = function(ntxid) {
  preconditions.checkArgument(ntxid);
  log.debug('### SENDING reject:  ' + ntxid + ' TO: All');
  this.send(null, {
    type: 'reject',
    ntxid: ntxid,
    walletId: this.id,
  });
};

/**
 * @desc Notify other peers that a wallet has been backed up and it's ready to be used
 * @param {string[]} [recipients] - the pubkeys of the recipients
 */
Wallet.prototype.sendWalletReady = function(recipients, sinceTs) {
  log.debug('### SENDING WalletReady TO:', recipients || 'All');

  this.send(recipients, {
    type: 'walletReady',
    walletId: this.id,
    sinceTs: sinceTs,
  });
};

/**
 * @desc Notify other peers of the walletId
 * @TODO: Why is this needed? Can't everybody just calculate the walletId?
 * @param {string[]} [recipients] - the pubkeys of the recipients
 */
Wallet.prototype.sendWalletId = function(recipients) {
  log.debug('### SENDING walletId TO:', recipients || 'All', this.id);

  this.send(recipients, {
    type: 'walletId',
    walletId: this.id,
    opts: this._optsToObj(),
    networkName: this.getNetworkName(),
  });
};

/**
 * @desc Send the current PublicKeyRing to other recipients
 * @param {string[]} [recipients] - the pubkeys of the recipients
 */
Wallet.prototype.sendPublicKeyRing = function(recipients) {
  log.debug('### SENDING publicKeyRing TO:', recipients || 'All', this.publicKeyRing.toObj());
  var publicKeyRing = this.publicKeyRing.toObj();

  this.send(recipients, {
    type: 'publicKeyRing',
    publicKeyRing: publicKeyRing,
    walletId: this.id,
  });
};

/**
 * @desc Send the current indexes of our public key ring to other peers
 * @param {string[]} recipients - the pubkeys of the recipients
 */
Wallet.prototype.sendIndexes = function(recipients) {
  var indexes = HDParams.serialize(this.publicKeyRing.indexes);
  log.debug('### INDEXES TO:', recipients || 'All', indexes);

  this.send(recipients, {
    type: 'indexes',
    indexes: indexes,
    walletId: this.id,
  });
};

/**
 * @desc Send our addressBook to other recipients
 * @param {string[]} recipients - the pubkeys of the recipients
 */
Wallet.prototype.sendAddressBook = function(recipients) {
  log.debug('### SENDING addressBook TO:', recipients || 'All', this.addressBook);
  this.send(recipients, {
    type: 'addressbook',
    addressBook: this.addressBook,
    walletId: this.id,
  });
};

/**
 * @desc Retrieve this wallet's name
 * @return {string}
 */
Wallet.prototype.getName = function() {
  return this.name || this.id;
};

/**
 * @desc Generate a new address
 * @param {boolean} isChange - whether to generate a change address or a receive address
 * @return {string[]} a list of all the addresses generated so far for the wallet
 */
Wallet.prototype._doGenerateAddress = function(isChange) {
  return this.publicKeyRing.generateAddress(isChange, this.publicKey);
};

/**
 * @callback addressCallback
 * @param {string} addr - all the addresses of the wallet
 */
/**
 * @desc Generate a new address
 * @param {boolean} isChange - whether to generate a change address or a receive address
 * @param {addressCallback} cb
 * @return {string[]} a list of all the addresses generated so far for the wallet
 */
Wallet.prototype.generateAddress = function(isChange, cb) {
  var addr = this._doGenerateAddress(isChange);
  this.sendIndexes();
  this.store();
  if (cb) return cb(addr);
  return addr;
};

/**
 * @desc Retrieve all the Transaction proposals (see {@link TxProposals})
 * @return {Object[]} each object returned represents a transaction proposal, with two additional
 * booleans: <tt>signedByUs</tt> and <tt>rejectedByUs</tt>. An optional third boolean signals
 * whether the transaction was finally rejected (<tt>finallyRejected</tt> set to true).
 */
Wallet.prototype.getTxProposals = function() {
  var ret = [];
  var copayers = this.getRegisteredCopayerIds();
  for (var ntxid in this.txProposals.txps) {
    var txp = this.txProposals.getTxProposal(ntxid, copayers);
    txp.signedByUs = txp.signedBy[this.getMyCopayerId()] ? true : false;
    txp.rejectedByUs = txp.rejectedBy[this.getMyCopayerId()] ? true : false;
    txp.finallyRejected = this.totalCopayers - txp.rejectCount < this.requiredCopayers;
    txp.isPending = !txp.finallyRejected && !txp.sentTxid;

    if (!txp.readonly || txp.finallyRejected || txp.sentTs) {
      ret.push(txp);
    }
  }
  return ret;
};

/**
 * @desc Removes old transactions
 * @param {boolean} deleteAll - if true, remove all the transactions
 * @return {number} the number of deleted proposals
 */
Wallet.prototype.purgeTxProposals = function(deleteAll) {
  var m = this.txProposals.length();

  if (deleteAll) {
    this.txProposals.deleteAll();
  } else {
    this.txProposals.deletePending(this.maxRejectCount());
  }
  this.store();

  var n = this.txProposals.length();
  return m - n;
};

/**
 * @desc Reject a proposal
 * @param {string} ntxid the id of the transaction proposal to reject
 * @emits txProposalsUpdated
 */
Wallet.prototype.reject = function(ntxid) {
  var txp = this.txProposals.reject(ntxid, this.getMyCopayerId());
  this.sendReject(ntxid);
  this.store();
  this.emit('txProposalsUpdated');
};

/**
 * @callback signCallback
 * @param {boolean} ret - true if it was successfully signed
 */
/**
 * @desc Sign a proposal
 * @param {string} ntxid the id of the transaction proposal to sign
 * @param {signCallback} cb - a callback to be called on successful signing
 * @emits txProposalsUpdated
 */
Wallet.prototype.sign = function(ntxid, cb) {
  preconditions.checkState(!_.isUndefined(this.getMyCopayerId()));
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

/**
 * @callback broadcastCallback
 * @param {string} txid - the transaction id on the blockchain
 */
/**
 * @desc Broadcasts a transaction to the blockchain
 * @param {string} ntxid - the transaction proposal id
 * @param {broadcastCallback} cb
 */
Wallet.prototype.sendTx = function(ntxid, cb) {
  var txp = this.txProposals.get(ntxid);

  if (txp.merchant) {
    return this.sendPaymentTx(ntxid, cb);
  }
  var tx = txp.builder.build();
  if (!tx.isComplete())
    throw new Error('Tx is not complete. Can not broadcast');
  log.debug('Broadcasting Transaction');
  var scriptSig = tx.ins[0].getScript();
  var size = scriptSig.serialize().length;

  var txHex = tx.serialize().toString('hex');
  log.debug('Raw transaction: ', txHex);

  var self = this;
  this.blockchain.broadcast(txHex, function(err, txid) {
    log.debug('BITCOIND txid:', txid);
    if (txid) {
      self.txProposals.get(ntxid).setSent(txid);
      self.sendTxProposal(ntxid);
      self.store();
      return cb(txid);
    } else {
      log.debug('Sent failed. Checking if the TX was sent already');
      self._checkSentTx(ntxid, function(txid) {
        if (txid)
          self.store();

        return cb(txid);
      });
    }
  });
};

/**
 * @desc Create a Payment Protocol transaction
 * @param {Object|string} options - if it's a string, parse it as the uri
 * @param {string} options.uri the url for the transaction
 * @param {Function} cb
 */
Wallet.prototype.createPaymentTx = function(options, cb) {
  var self = this;

  if (_.isString(options)) {
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
      log.debug('Server was did not return PaymentRequest.');
      log.debug('XHR status: ' + status);
      if (options.fetch) {
        return cb(new Error('Status: ' + status));
      } else {
        // Should never happen:
        return cb(null, null, null);
      }
    });
};

/**
 * @desc Creates a Payment TxProposal from a uri
 * @param {Object} options
 * @param {string=} options.uri
 * @param {string=} options.url
 * @param {Function} cb
 */
Wallet.prototype.fetchPaymentTx = function(options, cb) {
  var self = this;

  options = options || {};
  if (_.isString(options)) {
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

/**
 * @desc Analyzes a payment request and generates a transaction proposal for it.
 * @param {Object} options
 * @param {PayProRequest} pr
 * @param {string} pr.payment_details_version
 * @param {string} pr.pki_type
 * @param {Object} pr.data
 * @param {string} pr.serialized_payment_details
 * @param {string} pr.signature
 * @param {string} options.memo
 * @param {string} options.comment
 * @param {Function} cb
 */
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

  // Verify Signature
  var trust = pr.verify(true);

  if (!trust.verified) {
    return cb(new Error('Server sent a bad signature.'));
  }

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
        merchant_data: merchant_data ? merchant_data.toString('hex') : null
      },
      signature: sig.toString('hex'),
      ca: trust.caName,
      untrusted: !trust.caTrusted,
      selfSigned: trust.selfSigned
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

    log.debug('You are currently on this BTC network:', network);
    log.debug('The server sent you a message:', memo);

    return cb(null, ntxid, merchantData);
  });
};

/**
 * @desc Send a payment transaction to a server, complying with BIP70
 *
 * @TODO: Get this out of here.
 *
 * @param {string} ntxid - the transaction proposal id
 * @param {Object} options
 * @param {string} options.refund_to
 * @param {string} options.memo
 * @param {string} options.comment
 * @param {Function} cb
 */
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
  log.debug('Sending Transaction');

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
  if (merchant_data) {
    merchant_data = new Buffer(merchant_data, 'hex');
    pay.set('merchant_data', merchant_data);
  }
  pay.set('transactions', [tx.serialize()]);
  pay.set('refund_to', refund_outputs);

  options.memo = options.memo || options.comment || 'Hi server, I would like to give you some money.';

  pay.set('memo', options.memo);

  pay = pay.serialize();

  log.debug('Sending Payment Message:', pay.toString('hex'));

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
      log.debug('Sending to server was not met with a returned tx.');
      log.debug('XHR status: ' + status);
      return self._checkSentTx(ntxid, function(txid) {
        log.debug('[Wallet.js.1581:txid:%s]', txid);
        if (txid) self.store();
        return cb(txid, txp.merchant);
      });
    });
};

/**
 * @desc Handles a PaymentRequestACK from the server
 */
Wallet.prototype.receivePaymentRequestACK = function(ntxid, tx, txp, ack, cb) {
  var self = this;

  var payment = ack.get('payment');
  var memo = ack.get('memo');

  log.debug('Our payment was acknowledged!');
  log.debug('Message from Merchant: %s', memo);

  payment = PayPro.Payment.decode(payment);
  var pay = new PayPro();
  payment = pay.makePayment(payment);

  txp.merchant.ack = {
    memo: memo
  };

  if (payment.message.transactions && payment.message.transactions.length) {
    tx = payment.message.transactions[0];
    if (!tx) {
      log.debug('Sending to server was not met with a returned tx.');
      return this._checkSentTx(ntxid, function(txid) {
        log.debug('[Wallet.js.1613:txid:%s]', txid);
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
  } else {
    log.debug('WARNING: This server does not comply by standards.');
    log.debug('It is not returning a copy of the transaction.');
  }

  var txid = tx.getHash().toString('hex');
  var txHex = tx.serialize().toString('hex');
  log.debug('Raw transaction: ', txHex);

  // XXX This fixes the invalid signature error:
  // we might as well broadcast it ourselves anyway.
  this.blockchain.broadcast(txHex, function(err, txid) {
    log.debug('BITCOIND txid:', txid);
    if (txid) {
      self.txProposals.get(ntxid).setSent(txid);
      self.sendTxProposal(ntxid);
      self.store();
      return cb(txid, txp.merchant);
    } else {
      log.debug('Sent failed. Checking if the TX was sent already');
      self._checkSentTx(ntxid, function(txid) {
        if (txid)
          self.store();

        return cb(txid, txp.merchant);
      });
    }
  });
};

/**
 * @desc Create a Payment Transaction Sync (see BIP70)
 * @TODO: Document better
 */
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

  if (_.isUndefined(opts.spendUnconfirmed)) {
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

  log.debug('Created transaction: %s', b.tx.getStandardizedObject());

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

/**
 * @desc Verifies a PaymentRequest sent by another peer
 * This essentially ensures that a copayer hasn't tampered with a
 * PaymentRequest message from a payment server. It verifies the signature
 * based on the cert, and checks to ensure the desired outputs are the same as
 * the ones on the tx proposal.
 * @TODO: Document better
 */
Wallet.prototype.verifyPaymentRequest = function(ntxid) {
  if (!ntxid) return false;

  var txp = _.isObject(ntxid) ? ntxid : this.txProposals.get(ntxid);

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
  var trust = pr.verify(true);
  if (!trust.verified) {
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

/**
 * @desc Mark that a user has seen a given TxProposal
 * @return {boolean} true if the internal state has changed
 */
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

/**
 * @desc Alias for {@link PublicKeyRing#getAddresses}
 * @TODO: remove this method and use getAddressesInfo everywhere
 * @return {Buffer[]}
 */
Wallet.prototype.getAddresses = function(opts) {
  return this.publicKeyRing.getAddresses(opts);
};

/**
 * @desc Retrieves all addresses as strings.
 *
 * @param {Object} opts - Same options as {@link PublicKeyRing#getAddresses}
 * @return {string[]}
 */
Wallet.prototype.getAddressesStr = function(opts) {
  return this.getAddresses(opts).map(function(a) {
    return a.toString();
  });
};

Wallet.prototype.subscribeToAddresses = function() {
  var addrInfo = this.publicKeyRing.getAddressesInfo();
  this.blockchain.subscribe(_.pluck(addrInfo, 'addressStr'));
};

/**
 * @desc Alias for {@link PublicKeyRing#getAddressesInfo}
 */
Wallet.prototype.getAddressesInfo = function(opts) {
  return this.publicKeyRing.getAddressesInfo(opts, this.publicKey);
};
/**
 * @desc Returns true if a given address was generated by deriving our master public key
 * @return {boolean}
 */
Wallet.prototype.addressIsOwn = function(addrStr, opts) {
  var addrList = this.getAddressesStr(opts);
  return _.any(addrList, function(value) {
    return value === addrStr;
  });
};


/**
 * @callback {getBalanceCallback}
 * @param {string=} err - an error, if any
 * @param {number} balance - total number of satoshis for all addresses
 * @param {Object} balanceByAddr - maps string addresses to satoshis
 * @param {number} safeBalance - total number of satoshis in UTXOs that are not part of any TxProposal
 */
/**
 * @desc Returns the balances for all addresses in Satoshis
 * @param {getBalanceCallback} cb
 */
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
      balanceByAddr[a] = parseInt(balanceByAddr[a].toFixed(0), 10);
    }

    balance = parseInt(balance.toFixed(0), 10);

    for (var i = 0; i < safeUnspent.length; i++) {
      var u = safeUnspent[i];
      var amt = u.amount * COIN;
      safeBalance += amt;
    }

    safeBalance = parseInt(safeBalance.toFixed(0), 10);
    return cb(null, balance, balanceByAddr, safeBalance);
  });
};


// See
// https://github.com/bitpay/copay/issues/1056
//
// maxRejectCount should equal requiredCopayers
// strictly.
/**
 * @desc Get the number of copayers that need to reject a transaction so it can't be signed
 * @return {number}
 */
Wallet.prototype.maxRejectCount = function() {
  return this.totalCopayers - this.requiredCopayers;
};

/**
 * @callback getUnspentCallback
 * @TODO: Document this better
 * @param {string} error
 * @param {Object[]} safeUnspendList
 * @param {Object[]} unspentList
 */
/**
 * @desc Get a list of unspent transaction outputs
 * @param {getUnspentCallback} cb
 */
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

Wallet.prototype.removeTxWithSpentInputs = function(cb) {
  var self = this;

  cb = cb || function() {};

  if (!_.some(self.getTxProposals(), {
    isPending: true
  }))
    return cb();

  var proposalsChanged = false;
  this.blockchain.getUnspent(this.getAddressesStr(), function(err, unspentList) {
    if (err) return cb(err);

    var txps = _.where(self.getTxProposals(), {
      isPending: true
    });
    if (txps.length === 0) return cb();

    var inputs = _.flatten(_.map(txps, function(txp) {
      return _.map(txp.builder.utxos, function(utxo) {
        return {
          ntxid: txp.ntxid,
          txid: utxo.txid,
          vout: utxo.vout,
        };
      });
    }));

    _.each(unspentList, function(unspent) {
      _.each(inputs, function(input) {
        input.unspent = input.unspent || (input.txid === unspent.txid && input.vout === unspent.vout);
      });
    });

    _.each(inputs, function(input) {
      if (!input.unspent) {
        proposalsChanged = true;
        self.txProposals.deleteOne(input.ntxid);
      }
    });

    if (proposalsChanged) {
      self.emit('txProposalsUpdated');
      self.store();
    }

    return cb();
  });

};

/**
 * @desc Create a transaction proposal
 * @TODO: Document more
 */
Wallet.prototype.createTx = function(toAddress, amountSatStr, comment, opts, cb) {
  var self = this;

  if (_.isFunction(opts)) {
    cb = opts;
    opts = {};
  }
  opts = opts || {};

  if (_.isUndefined(opts.spendUnconfirmed)) {
    opts.spendUnconfirmed = this.spendUnconfirmed;
  }

  this.getUnspent(function(err, safeUnspent) {
    if (err) return cb(new Error('Could not get list of UTXOs'));

    var ntxid = self.createTxSync(toAddress, amountSatStr, comment, safeUnspent, opts);
    if (!ntxid) {
      return cb(new Error('Error creating the Transaction'));
    }

    self.sendIndexes();
    self.sendTxProposal(ntxid);
    self.store();
    self.emit('txProposalsUpdated');
    return cb(null, ntxid);
  });
};

/**
 * @desc Create a transaction proposal
 * @TODO: Document more
 */
Wallet.prototype.createTxSync = function(toAddress, amountSatStr, comment, utxos, opts) {
  var pkr = this.publicKeyRing;
  var priv = this.privateKey;
  opts = opts || {};

  preconditions.checkArgument(new Address(toAddress).network().name === this.getNetworkName(), 'networkname mismatch');
  preconditions.checkState(pkr.isComplete(), 'pubkey ring incomplete');
  preconditions.checkState(priv, 'no private key');
  if (comment) preconditions.checkArgument(comment.length <= 100);

  if (!opts.remainderOut) {
    opts.remainderOut = {
      address: this._doGenerateAddress(true).toString()
    };
  }

  for (var k in Wallet.builderOpts) {
    opts[k] = Wallet.builderOpts[k];
  }

  var b;

  try {
    b = new Builder(opts)
    .setUnspent(utxos)
    .setOutputs([{
      address: toAddress,
      amountSatStr: amountSatStr,
    }]);
  } catch (e) {
    log.debug(e.message);
    return;
  };

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

/**
 * @desc Updates all the indexes for the current publicKeyRing
 *
 * Triggers a wallet {@link Wallet#store} call
 * @param {Function} callback - called when all indexes have been updated. Receives an error, if any, as first argument
 * @emits publicKeyRingUpdated
 */
Wallet.prototype.updateIndexes = function(callback) {
  var self = this;
  log.debug('Updating indexes...');

  var tasks = this.publicKeyRing.indexes.map(function(index) {
    return function(callback) {
      self.updateIndex(index, callback);
    };
  });

  async.parallel(tasks, function(err) {
    if (err) callback(err);
    log.debug('Indexes updated');
    self.emit('publicKeyRingUpdated');
    self.store();
    callback();
  });
};

/**
 * @desc Updates the lastly used index
 * @param {Object} index - an index, as used by {@link PublicKeyRing}
 * @param {Function} callback - called with no arguments when done updating
 */
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
};

/**
 * @desc Derive addresses using the given parameters
 *
 * @param {number} index - the index to start with
 * @param {number} amount - number of addresses to derive
 * @param {boolean} isChange - derive change addresses or receive addresses
 * @param {number} copayerIndex - the index of the copayer for whom to derive addresses
 * @return {string[]} the result of calling {@link PublicKeyRing#getAddress}
 */
Wallet.prototype.deriveAddresses = function(index, amount, isChange, copayerIndex) {
  preconditions.checkArgument(amount);
  preconditions.shouldBeDefined(copayerIndex);

  var ret = new Array(amount);
  for (var i = 0; i < amount; i++) {
    ret[i] = this.publicKeyRing.getAddress(index + i, isChange, copayerIndex).toString();
  }
  return ret;
};

/**
 * @callback {indexDiscoveryCallback}
 * @param {?} err
 * @param {number} lastActivityIndex
 */
/**
 * @desc Scans the block chain for the last index with activity for a copayer
 *
 * This function scans the publicKeyRing branch starting at index @start and reports the index with last activity,
 * using a scan window of @gap. The argument @change defines the branch to scan: internal or external.
 * Returns -1 if no activity is found in range.
 * @param {number} start - the number for which to start scanning
 * @param {boolean} change - whether to search for in the change branch or the receive branch
 * @param {number} copayerIndex - the index of the copayer
 * @param {number} gap - the maximum number of addresses to scan after the last active address
 * @param {indexDiscoveryCallback} cb - callback
 * @return {number} -1 if there's no activity in the range provided
 */
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
      self.blockchain.getActivity(addresses, function(err, actives) {
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
    function _finally(err) {
      if (err) return cb(err);
      cb(null, lastActive);
    }
  );
};

/**
 * @desc Closes the wallet and disconnects all services
 */
Wallet.prototype.close = function(cb) {
  var self = this;
  log.debug('## CLOSING');
  this.lock.release(function() {
    self.network.cleanUp();
    self.blockchain.destroy();
    if (cb) return cb();
  });
};

/**
 * @desc Returns the name of the network ('livenet' or 'testnet')
 * @return {string}
 */
Wallet.prototype.getNetwork = function() {
  return this.network;
};

/**
 * @desc Throws an error if an address already exists in the address book
 * @private
 */
Wallet.prototype._checkAddressBook = function(key) {
  if (this.addressBook[key] && this.addressBook[key].copayerId != -1) {
    throw new Error('This address already exists in your Address Book: ' + address);
  }
};

/**
 * @desc Add an entry to the address book
 *
 * @param {string} key - the address to be added
 * @param {string} label - a name for the address
 */
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

/**
 * @desc Verifies that an addressbook entry is correctly signed by a copayer
 *
 * @param {Object} rcvEntry - the entry in the address book
 * @param {string} senderId - the pubkey of a copayer
 * @param {string} key - the base58 encoded address
 * @return {boolean} true if the signature matches
 */
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
};

/**
 * @desc Hides or unhides an address book entry
 * @param {string} key - the address in the addressbook
 */
Wallet.prototype.toggleAddressBookEntry = function(key) {
  if (!key) throw new Error('Key is required');
  this.addressBook[key].hidden = !this.addressBook[key].hidden;
  this.store();
};

/**
 * @desc Returns true if there are more than one cosigners
 * @return {boolean}
 */
Wallet.prototype.isShared = function() {
  return this.totalCopayers > 1;
};

/**
 * @desc Returns true if more than one signature is required
 * @return {boolean}
 */
Wallet.prototype.requiresMultipleSignatures = function() {
  return this.requiredCopayers > 1;
};

/**
 * @desc Returns true if the keyring is complete and all users have backed up the wallet
 * @return {boolean}
 */
Wallet.prototype.isReady = function() {
  var ret = this.publicKeyRing.isComplete() && (this.publicKeyRing.isFullyBackup() || this.isImported || this.forcedLogin);
  return ret;
};

/**
 * @desc Mark that our backup is ready and send a sync to other users.
 *
 * Also backs up the wallet
 */
Wallet.prototype.setBackupReady = function(forcedLogin) {
  this.forcedLogin = forcedLogin;
  this.publicKeyRing.setBackupReady();
  this.sendPublicKeyRing();
  this.store();
};

/**
 * @desc Sign a JSON
 *
 * @TODO: THIS WON'T WORK ALLWAYS! JSON.stringify doesn't warants an order
 * @param {Object} payload - the payload to verify
 * @return {string} base64 encoded string
 */
Wallet.prototype.signJson = function(payload) {
  var key = new bitcore.Key();
  key.private = new Buffer(this.getMyCopayerIdPriv(), 'hex');
  key.regenerateSync();
  var sign = bitcore.Message.sign(JSON.stringify(payload), key);
  return sign.toString('hex');
}

/**
 * @desc Verify that a JSON object is correctly signed
 *
 * @TODO: THIS WON'T WORK ALLWAYS! JSON.stringify doesn't warants an order
 *
 * @param {string} senderId - a sender's public key, hex encoded
 * @param {Object} payload - the object to verify
 * @param {string} signature - a sender's public key, hex encoded
 * @return {boolean}
 */
Wallet.prototype.verifySignedJson = function(senderId, payload, signature) {
  var pubkey = new Buffer(senderId, 'hex');
  var sign = new Buffer(signature, 'hex');
  var v = bitcore.Message.verifyWithPubKey(pubkey, JSON.stringify(payload), sign);
  return v;
}

/**
 * @desc Create a HTTP request
 * @TODO: This shouldn't be a wallet responsibility
 */
Wallet.request = function(options, callback) {
  if (_.isString(options)) {
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
    var status;
    if (xhr.status === 0 || !xhr.statusText) {
      status = 'HTTP Request Error: This endpoint likely does not support cross-origin requests.';
    } else {
      status = xhr.statusText;
    }
    return ret._error(null, status, null, options);
  };

  if (req.body) {
    xhr.send(req.body);
  } else {
    xhr.send(null);
  }

  return ret;
};

module.exports = Wallet;
