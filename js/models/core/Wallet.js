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


Wallet.prototype._load = function(config, walletId) {
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
  this.storage.set(this.id,'publicKeyRing', this.publicKeyRing.toObj());
  this.storage.set(this.id,'txProposals', this.txProposals.toObj());
  this.storage.set(this.id,'privateKey', this.privateKey.toObj());
};

// CONSTRUCTORS
Wallet.read = function(config, walletId) {
  var w = new Wallet(config);
  w._load(walletId);

  return w;
};

Wallet.create = function(config, opts) {
  var w = new Wallet(config);
  w._createNew(config, opts);

  return w;
};

<<<<<<< HEAD
Wallet.getRandomId = function() {
  var r = buffertools.toHex(coinUtil.generateNonce());
  return r;
};

Wallet.prototype.store = function() {
  // TODO store each variable
};

var WalletFactory = function() {
  this.storage = Storage.
  default ();
};

WalletFactory.prototype.create = function(config, opts) {
  var w = new Wallet.create(config, opts);
  w.store();
  this._addWalletId(w.id);
  return w;
};

WalletFactory.prototype.get = function(config, walletId) {
  return Wallet.read(config, walletId);
};

WalletFactory.prototype.remove = function(walletId) {
  // TODO remove wallet contents, not only the id (Wallet.remove?)
  this._delWalletId(walletId);
};
=======
module.exports = require('soop')(Wallet);
>>>>>>> WIP wallet working again

WalletFactory.prototype._addWalletId = function(walletId) {
  var ids = this._getWalletIds();
  if (ids.indexOf(walletId) == -1) return;
  storage.set('walletIds', (ids ? ids + ',' : '') + walletId);
};

WalletFactory.prototype._delWalletId = function(walletId) {
  var ids = this._getWalletIds();
  var index = ids.indexOf(walletId);
  if (index == -1) return;
  ids.splice(index, 1); // removes walletId
  this.storage.set('walletIds', ids.join(','));
};

WalletFactory.prototype._getWalletIds = function() {
  var ids = this.storage.get('walletIds');
  return ids ? ids.split(',') : [];
};

Wallet.factory = new WalletFactory();

module.exports = require('soop')(Wallet);
