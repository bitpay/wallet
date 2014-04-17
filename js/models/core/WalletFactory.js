'use strict';

var imports     = require('soop').imports();
var Storage     = imports.Storage;
var Network     = imports.Network;
var Blockchain  = imports.Blockchain;

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');

/*
 * WalletFactory
 *
 *
 * var wallet = WF.read(config,walletId); -> always go to storage
 * var wallet = WF.create(config,walletId); -> create wallets, with the given ID (or random is not given)
 *
 * var wallet = WF.open(config,walletId); -> try to read walletId, if fails, create a new wallet with that id
 */

function WalletFactory(config) {
  var self = this;
  this.storage = new Storage(config.storage);
  this.network = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);

  this.networkName = config.networkName;
  this.verbose     = config.verbose;
  this.walletDefaults = config.wallet;
}

WalletFactory.prototype.log = function(){
  if (!this.verbose) return;
  console.log(arguments);
};


WalletFactory.prototype._checkRead = function(walletId) {
  var s = this.storage;
  var ret = s.get(walletId, 'publicKeyRing') &&
    s.get(walletId, 'txProposals')   &&
    s.get(walletId, 'opts') &&
    s.get(walletId, 'privateKey')
  ;
  return ret;
};

WalletFactory.prototype.read = function(walletId) {
  if (! this._checkRead(walletId)) return false;

  var s = this.storage;
  var opts = s.get(walletId, 'opts');

  opts.publicKeyRing = new PublicKeyRing.fromObj(s.get(walletId, 'publicKeyRing'));
  opts.txProposals   = new TxProposals.fromObj(s.get(walletId, 'txProposals'));
  opts.privateKey    = new PrivateKey.fromObj(s.get(walletId, 'privateKey'));

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;

  var w = new Wallet(opts);

  // JIC: Add our key
  try {
    w.publicKeyRing.addCopayer(
      w.privateKey.getBIP32().extendedPublicKeyString()
    );
  } catch (e) {
    this.log('NOT NECCESARY AN ERROR:', e); //TODO
  }
  this.log('### WALLET OPENED:', w.id);
  return w;
};

WalletFactory.prototype.create = function(opts) {
  var s = WalletFactory.storage;
  opts    = opts || {};
  this.log('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID'));

  opts.privateKey = opts.privateKey ||  new PrivateKey({ networkName: this.networkName });
  this.log('\t### PrivateKey Initialized');

  var requiredCopayers = opts.requiredCopayers || this.walletDefaults.requiredCopayers;
  var totalCopayers =  opts.totalCopayers || this.walletDefaults.totalCopayers;

  opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
    networkName: this.networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });
  opts.publicKeyRing.addCopayer(opts.privateKey.getBIP32().extendedPublicKeyString());
  this.log('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: this.networkName,
  });
  this.log('\t### TxProposals Initialized');

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  var w   = new Wallet(opts);
  w.store();
  this.addWalletId(w.id);
  return w;
};

WalletFactory.prototype.open = function(walletId) {
  var w = this.read(walletId) || this.create({id: walletId});
  return w;
};

WalletFactory.prototype.openRemote = function(peedId) {
  var s = WalletFactory.storage;
  opts    = opts || {};
  this.log('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID'));

  opts.privateKey = opts.privateKey ||  new PrivateKey({ networkName: this.networkName });
  this.log('\t### PrivateKey Initialized');

  var requiredCopayers = opts.requiredCopayers || this.walletDefaults.requiredCopayers;
  var totalCopayers =  opts.totalCopayers || this.walletDefaults.totalCopayers;

  opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
    networkName: this.networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });
  opts.publicKeyRing.addCopayer(opts.privateKey.getBIP32().extendedPublicKeyString());
  this.log('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: this.networkName,
  });
  this.log('\t### TxProposals Initialized');

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  var w   = new Wallet(opts);
  w.store();
  this.addWalletId(w.id);
  return w;
};

WalletFactory.prototype.getWalletIds = function() {
  var ids = this.storage.getGlobal('walletIds');
  return ids || [];
}

WalletFactory.prototype._delWalletId = function(walletId) {
  var ids = this.getWalletIds();
  var index = ids.indexOf(walletId);
  if (index === -1) return;
  ids.splice(index, 1); // removes walletId
  this.storage.setGlobal('walletIds', ids);
};

WalletFactory.prototype.remove = function(walletId) {
  WalletFactory._delWalletId(walletId);
  // TODO remove wallet contents, not only the id (Wallet.remove?)
};

WalletFactory.prototype.addWalletId = function(walletId) {
  var ids = this.getWalletIds();
  if (ids.indexOf(walletId) !== -1) return;
  ids.push(walletId);
  this.storage.setGlobal('walletIds', ids);
};


WalletFactory.prototype.connectTo = function(peerId, cb) {
  var self=this;
  self.network.start(function() {
    self.network.connectTo(peerId)
    self.network.on('walletId', function(walletId) {
console.log('[WalletFactory.js.187]'); //TODO
      return cb(self.open(walletId));
    });
  });
};

module.exports = require('soop')(WalletFactory);
