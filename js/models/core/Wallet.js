'use strict';

var imports     = require('soop').imports();

var bitcore     = require('bitcore');
var http        = require('http');

var Storage     = imports.Storage     || require('FakeStorage');
var Network     = imports.Network     || require('FakeNetwork');
var Blockchain  = imports.Blockchain  || require('FakeBlockchain');

var copay = copay || require('../../../copay');


function Wallet(config) {
  this._startInterface(config);
}


Wallet.prototype._startInterface = function(config) {
  this.storage    = new Storage(config.storage);
  this.network    = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);
};

 
Wallet.prototype._createNew = function(config, opts) {

  console.log('### CREATING NEW WALLET.' 
    + (opts.walletId ? ' USING ID: ' +opts.walletId  : ' NEW ID') );

  this.privateKey = new copay.PrivateKey({networkName: config.networkName});
  console.log('\t### PrivateKey Initialized');

  this.publicKeyRing = opts.publicKeyRing || new copay.PublicKeyRing({
    id: opts.walletId,
    requiredCopayers: opts.requiredCopayers || config.wallet.requiredCopayers,
    totalCopayers: opts.totalCopayers       || config.wallet.totalCopayers,
    networkName: config.networkName,
  });
  this.publicKeyRing.addCopayer(this.privateKey.getBIP32().extendedPublicKeyString());
  console.log('\t### PublicKeyRing Initialized WalletID: ' +  this.publicKeyRing.id);

  this.txProposals = opts.txProposals || new copay.TxProposals({
    walletId: this.publicKeyRing.id,
    publicKeyRing: this.publicKeyRing,
    networkName: config.networkName,
  });
  console.log('\t### TxProposals Initialized');
};


Wallet.prototype._load = function(config, walletId) {
  this.id             = walletId; 
  this.publicKeyRing  = new copay.PublicKeyRing.fromObj(
    this.storage.get(this.id, 'publicKeyRing')
  );
  this.txProposals    = new copay.TxProposals.fromObj(
    this.storage.get(this.id, 'txProposals')
  );
  this.privateKey     = new copay.PrivateKey.fromObj(
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


// CONSTRUCTORS
Wallet.read = function(config, walletId) {
  var w = new Wallet(config);
  w.load(walletId);

  return w;
};

Wallet.create = function(config, opts) {
  var w = new Wallet(config);
  w._createNew(config, opts);

  return w;
};
  


module.exports = require('soop')(Wallet);

