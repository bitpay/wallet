'use strict';

var imports     = require('soop').imports();

var bitcore     = require('bitcore');
var coinUtil    = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder     = bitcore.TransactionBuilder;
var http        = require('http');

var Storage     = imports.Storage;
var Network     = imports.Network;
var Blockchain  = imports.Blockchain;

var copay       = copay || require('../../../copay');

function Wallet(config) {
  this._startInterface(config);
}

Wallet.prototype.log = function(){
  if (!this.verbose) return;

  console.this.log(arguments);
}

Wallet.prototype._startInterface = function(config) {
  this.storage = new Storage(config.storage);
  this.network = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);

  this.networkName = config.networkName;
  this.requiredCopayers = config.wallet.requiredCopayers;
  this.totalCopayers = config.wallet.totalCopayers;
};


Wallet.prototype.create = function(opts) {
  opts = opts || {};
  this.id = opts.id || Wallet.getRandomId();
  this.log('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID'));

  this.privateKey = new copay.PrivateKey({
    networkName: this.networkName
  });
  this.log('\t### PrivateKey Initialized');

  this.publicKeyRing = new copay.PublicKeyRing({
    walletId: this.id,
    requiredCopayers: opts.requiredCopayers || this.requiredCopayers,
    totalCopayers: opts.totalCopayers       || this.totalCopayers,
    networkName: this.networkName,
  });

  this.publicKeyRing.addCopayer(this.privateKey.getBIP32().extendedPublicKeyString());
  this.log('\t### PublicKeyRing Initialized WalletID: ' + this.publicKeyRing.walletId);

  this.txProposals = new copay.TxProposals({
    walletId: this.id,
    networkName: this.networkName,
  });
  this.log('\t### TxProposals Initialized');
};


Wallet.prototype._checkLoad = function(walletId) {
  var ret = this.storage.get(walletId, 'publicKeyRing') &&
    this.storage.get(walletId, 'txProposals')   &&
    this.storage.get(walletId, 'privateKey')
  ;
  return ret;
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
    this.log('NOT NECCESARY AN ERROR:', e); //TODO
  };
};



Wallet.prototype.store = function() {
  Wallet.factory.addWalletId(this.id);
  this.storage.set(this.id,'publicKeyRing', this.publicKeyRing.toObj());
  this.storage.set(this.id,'txProposals', this.txProposals.toObj());
  this.storage.set(this.id,'privateKey', this.privateKey.toObj());
};


Wallet.prototype.sendTxProposals = function(recipients) {
  this.log('### SENDING txProposals TO:', recipients||'All', this.txProposals);

  this.network.send( recipients, { 
    type: 'txProposals', 
    txProposals: this.txProposals.toObj(),
    walletId: this.id,
  });
};

Wallet.prototype.sendPublicKeyRing = function(recipients) {
  this.log('### SENDING publicKeyRing TO:', recipients||'All', this.publicKeyRing.toObj());

  this.network.send(recipients, { 
    type: 'publicKeyRing', 
    publicKeyRing: this.publicKeyRing.toObj(),
    walletId: this.id,
  });
};

Wallet.prototype.generateAddress = function() {
  var addr = this.publicKeyRing.generateAddress();
  this.store();

  this.network.send(null, {
    type: 'publicKeyRing',
    publicKeyRing: this.publicKeyRing.toObj(),
    walletId: this.id
  });

  return addr;
};

Wallet.prototype.getTxProposals = function() {
  var ret = [];
  this.txProposals.txps.forEach(function(txp) {
    var i = {txp:txp};
    i.signedByUs = txp.signedBy[this.privateKey.id]?true:false;
    ret.push(i);
  });

  return ret;
};


Wallet.prototype.addSeenToTxProposals = function() {
  var ret=false;
  this.txProposals.txps.forEach(function(txp) {
    if (!txp.seenBy[this.privateKey.id]) {
      txp.seenBy[this.privateKey.id] = Date.now();
      ret = true;
    }
  });
  return ret;
};


Wallet.prototype.getAddresses = function() {
  return this.publicKeyRing.getAddresses();
};

Wallet.prototype.getAddressesStr = function() {
  var ret = [];
  this.publicKeyRing.getAddresses().forEach(function(a) {
    ret.push(a.toString());
  });
  return ret;
};



Wallet.prototype.listUnspent = function(cb) {
  this.blockchain.listUnspent(this.getAddressesStr(), cb);
};

Wallet.prototype.createTx = function(toAddress, amountSatStr, utxos, opts) {
  var pkr  = this.publicKeyRing; 
  var priv = this.privateKey;
  opts = opts || {};

  var amountSat = bitcore.bignum(amountSatStr);

  if (! pkr.isComplete() ) {
    throw new Error('publicKeyRing is not complete');
  }

  if (!opts.remainderOut) {
    opts.remainderOut ={ address: pkr.generateAddress(true).toString() };
  };

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{address: toAddress, amountSat: amountSat}])
    ;

  var signRet;  
  if (priv) {
    b.sign( priv.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
  }
  var me = {};
  if (priv) me[priv.id] = Date.now();

  this.txProposals.add({
    signedBy: priv && b.signaturesAdded ? me : {},
    seenBy:   priv ? me : {},
    builder: b,
  });
};

Wallet.prototype.sign = function(txp) {
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
