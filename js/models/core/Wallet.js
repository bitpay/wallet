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

  this.networkName = config.networkName;
  this.requiredCopayers = config.requiredCopayers;
  this.totalCopayers = config.totalCopayers;
};


Wallet.prototype.create = function(opts) {

  this.id = opts.id || Wallet.getRandomId();
  console.log('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID'));

  this.privateKey = new copay.PrivateKey({
    networkName: this.networkName
  });
  console.log('\t### PrivateKey Initialized');

  this.publicKeyRing = new copay.PublicKeyRing({
    walletId: this.id,
    requiredCopayers: opts.requiredCopayers || this.requiredCopayers,
    totalCopayers: opts.totalCopayers       || this.totalCopayers,
    networkName: this.networkName,
  });

  this.publicKeyRing.addCopayer(this.privateKey.getBIP32().extendedPublicKeyString());
  console.log('\t### PublicKeyRing Initialized WalletID: ' + this.publicKeyRing.walletId);

  this.txProposals = new copay.TxProposals({
    walletId: this.id,
    publicKeyRing: this.publicKeyRing,
    networkName: this.networkName,
  });
  console.log('\t### TxProposals Initialized');
};


Wallet.prototype._checkLoad = function(walletId) {
  return (
    this.storage.get(walletId, 'publicKeyRing') &&
    this.storage.get(walletId, 'txProposals')   &&
    this.storage.get(walletId, 'privateKey')
  );
}

Wallet.prototype.load = function(walletId) {
  if (! this._checkLoad(walletId)) return;


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
  console.log('### SENDING publicKeyRing TO:', recipients||'All', this.publicKeyRing.toObj());

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
  var w = new Wallet(config);
  w.create(opts);
  w.store();
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
  if (ids.indexOf(walletId) !== -1) return;
  ids.push(walletId);
  this.storage.setGlobal('walletIds', ids);
};

WalletFactory.prototype._delWalletId = function(walletId) {
  var ids = this.getWalletIds();
  var index = ids.indexOf(walletId);
  if (index === -1) return;
  ids.splice(index, 1); // removes walletId
  this.storage.setGlobal('walletIds', ids);
};

WalletFactory.prototype.getWalletIds = function() {
  var ids = this.storage.getGlobal('walletIds');
  return ids || [];
};

Wallet.factory = new WalletFactory();

module.exports = require('soop')(Wallet);
