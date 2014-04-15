'use strict';

var imports = require('soop').imports();

var bitcore = require('bitcore');
var coinUtil = bitcore.util;
var buffertools = bitcore.buffertools;
var http = require('http');

var Storage = imports.Storage;
var Network = imports.Network;
var Blockchain = imports.Blockchain;

var copay = copay || require('../../../copay');

function Wallet(config) {
  this._startInterface(config);
}

Wallet.prototype._startInterface = function(config) {
  this.storage = new Storage(config.storage);
  this.network = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);
};


Wallet.prototype._createNew = function(config, opts) {

  this.id = opts.id || Wallet.getRandomId();
  console.log('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID'));

  this.privateKey = new copay.PrivateKey({
    networkName: config.networkName
  });
  console.log('\t### PrivateKey Initialized');

  this.publicKeyRing = opts.publicKeyRing || new copay.PublicKeyRing({
    id: this.id,
    requiredCopayers: opts.requiredCopayers || config.wallet.requiredCopayers,
    totalCopayers: opts.totalCopayers || config.wallet.totalCopayers,
    networkName: config.networkName,
  });
  this.publicKeyRing.addCopayer(this.privateKey.getBIP32().extendedPublicKeyString());
  console.log('\t### PublicKeyRing Initialized WalletID: ' + this.publicKeyRing.id);

  this.txProposals = opts.txProposals || new copay.TxProposals({
    walletId: this.id,
    publicKeyRing: this.publicKeyRing,
    networkName: config.networkName,
  });
  console.log('\t### TxProposals Initialized');
};


Wallet.prototype._checkLoad = function(config, walletId) {
  return (
    this.storage.get(this.id, 'publicKeyRing') &&
    this.storage.get(this.id, 'txProposals')   &&
    this.storage.get(this.id, 'privateKey')
  );
}

Wallet.prototype._load = function(config, walletId) {
  if (! this._checkLoad(config,walletId)) return;


  this.id = walletId;
  this.publicKeyRing = new copay.PublicKeyRing.fromObj(
    this.storage.get(this.id, 'publicKeyRing')
  );
  this.txProposals = new copay.TxProposals.fromObj(
    this.storage.get(this.id, 'txProposals')
  );
  this.privateKey = new copay.PrivateKey.fromObj(
    this.storage.get(this.id, 'privateKey')
  ); //TODO secure

  // JIC: Add our key
  try {
    this.publicKeyRing.addCopayer(
      this.privateKey.getBIP32().extendedPublicKeyString()
    );
  } catch (e) {
    console.log('NOT NECCESARY AN ERROR:', e); //TODO
  };
};



Wallet.prototype.store = function() {
  Wallet.factory.addWalletId(this.id);
  this.storage.set(this.id,'publicKeyRing', this.publicKeyRing.toObj());
  this.storage.set(this.id,'txProposals', this.txProposals.toObj());
  this.storage.set(this.id,'privateKey', this.privateKey.toObj());
};


Wallet.prototype.sendTxProposals = function(recipients) {
  console.log('### SENDING txProposals TO:', recipients||'All', this.txProposals);

  this.network.send( recipients, { 
    type: 'txProposals', 
    txProposals: this.txProposals.toObj(),
    walletId: this.id,
  });
};

Wallet.prototype.sendPublicKeyRing = function(recipients) {
  console.log('### SENDING publicKeyRing TO:', recipients||'All');

console.log('[Wallet.js.100]', this.publicKeyRing.toObj()); //TODO


  this.network.send(recipients, { 
    type: 'publicKeyRing', 
    publicKeyRing: this.publicKeyRing.toObj(),
    walletId: this.id,
  });
};


// // HERE? not sure
// Wallet.prototype.cleanPeers = function() {
//   this.storage.remove('peerData'); 
// };
//
// CONSTRUCTORS
Wallet.read = function(config, walletId) {
  var w = new Wallet(config);
  w._load(config, walletId);
  return w;
};

Wallet.create = function(config, opts) {
  var w = new Wallet(config);
  w._createNew(config, opts);

  return w;
};

Wallet.getRandomId = function() {
  var r = buffertools.toHex(coinUtil.generateNonce());
  return r;
};

/*
 * WalletFactory
 *
 */

var WalletFactory = function() {
  this.storage = Storage.default();
};

WalletFactory.prototype.create = function(config, opts) {
  var w = new Wallet.create(config, opts);
  w.store();
  this.addWalletId(w.id);
  return w;
};

WalletFactory.prototype.get = function(config, walletId) {
  return Wallet.read(config, walletId);
};

WalletFactory.prototype.remove = function(walletId) {
  // TODO remove wallet contents, not only the id (Wallet.remove?)
  this._delWalletId(walletId);
};

WalletFactory.prototype.addWalletId = function(walletId) {
  var ids = this.getWalletIds();
  if (ids.indexOf(walletId) == -1) return;
  storage.set('walletIds', (ids ? ids + ',' : '') + walletId);
};

WalletFactory.prototype._delWalletId = function(walletId) {
  var ids = this.getWalletIds();
  var index = ids.indexOf(walletId);
  if (index == -1) return;
  ids.splice(index, 1); // removes walletId
  this.storage.set('walletIds', ids.join(','));
};

WalletFactory.prototype.getWalletIds = function() {
  var ids = this.storage.get('walletIds');
  return ids ? ids.split(',') : [];
};

Wallet.factory = new WalletFactory();

module.exports = require('soop')(Wallet);
