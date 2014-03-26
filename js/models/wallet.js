'use strict';
var imports = require('soop').imports();
var bitcore = require('bitcore');
var BIP32   = bitcore.BIP32;
var coinUtil= bitcore.util;

var Storage = imports.Storage || require('./Storage');
var log     = imports.log || console.log;

var storage = Storage.default();

/*
 * This follow Electrum convetion, as described on
 * https://bitcointalk.org/index.php?topic=274182.0
 */

var PUBLIC_BRANCH = 'm/0/';
var CHANGE_BRANCH = 'm/1/';


function Wallet(opts) {
  opts = opts || {};

  this.network = opts.network === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.neededCosigners = opts.neededCosigners || 3;
  this.totalCosigners = opts.totalCosigners || 5;

  this.id = opts.id || Wallet.getRandomId();

  this.dirty = 1;
  this.cosignersWallets = [];
  this.bip32 = new BIP32(opts.bytes ||  this.network.name);
}


Wallet.getRandomId = function () {
  return coinUtil.generateNonce().toString('hex');
};

Wallet.decrypt = function (passphrase, encPayload) {
  log('[wallet.js.35] TODO READ: passphrase IGNORED');
  return encPayload;
};

Wallet.encrypt = function (passphrase, payload) {
  log('[wallet.js.92] TODO: passphrase IGNORED');
  return payload;
};

Wallet.read = function (id, passphrase) {
  var encPayload = storage.read(id);
  if (!encPayload) 
    throw new Error('Could not find wallet data');
  var data;
  try {
    data = JSON.parse( Wallet.decrypt( passphrase, encPayload ));
  } catch (e) {
    throw new Error('error in storage: '+ e.toString());
    return;
  };

  if (data.id !== id) 
    throw new Error('Wrong id in data');

  var config = { network: data.network === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet
  };

  var w = new Wallet(config);

  w.neededCosigners = data.neededCosigners;
  w.totalCosigners = data.totalCosigners;
  w.cosignersWallets = data.cosignersExtPubKeys.map( function (pk) { 
    return new Wallet({bytes:pk, network: w.network.name});
  });

  w.dirty = 0;

  return w;
};

Wallet.prototype.serialize = function () {
  return JSON.stringify({
    id: this.id,
    network: this.network.name,
    neededCosigners: this.neededCosigners,
    totalCosigners: this.totalCosigners,
    cosignersExtPubKeys: this.cosignersWallets.map( function (b) { 
      return b.getExtendedPubKey(); 
    }),
    priv: this.getExtendedPrivKey(),
  });
};

Wallet.prototype.store = function (passphrase) {

  if (!this.id) 
      throw new Error('wallet has no id');

  storage.save(this.id, Wallet.encrypt(passphrase,this.serialize()));
  this.dirty = 0;

  return true;
};

Wallet.prototype.registeredCosigners = function () {
  if (! this.cosignersWallets) return 1;


  // 1 is self.
  return 1 + this.cosignersWallets.length;
};

Wallet.prototype.getExtendedPrivKey = function () {

  if (!this.bip32) 
      throw new Error('no priv key defined on the wallet');

  return this.bip32.extended_private_key_string();
};


Wallet.prototype.getExtendedPubKey = function () {
  return this.bip32.extended_public_key_string();
};


//  should receive an array also?
Wallet.prototype.addCosignerExtendedPubKey = function (newEpk) {

  if (this.haveAllNeededPubKeys())
      throw new Error('already have all needed key:' + this.totalCosigners);

  if (this.getExtendedPubKey() === newEpk)
    throw new Error('already have that key (self kehy)');


  this.cosignersWallets.forEach(function(b){
    if (b.getExtendedPubKey() === newEpk)
      throw new Error('already have that key');
  });

  this.cosignersWallets.push(new Wallet({bytes:newEpk, network: this.network.name } ));
  this.dirty = 1;
};


Wallet.prototype.haveAllNeededPubKeys = function () {
  return this.registeredCosigners() === this.totalCosigners;
};


Wallet.prototype.getChangeAddress = function (index) {

  //index can be 0, 1, 2, etc.
  if (! this.haveAllNeededPubKeys() ) 
      throw new Error('cosigners pub key missing');
};


// Input: Bitcore's Transaction, sign with ownPK
// return partially signed or fully signed tx
Wallet.prototype.signTx = function (tx) {
};

module.exports = require('soop')(Wallet);
