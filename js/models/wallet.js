'use strict';
var imports = require('soop').imports();
var bitcore = require('bitcore');
var BIP32   = bitcore.BIP32;

var Storage = imports.Storage || require('./Storage');

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

  this.dirty = 1;
  this.cosignersBIP = [];
  this.bip32 = new BIP32(opts.bytes ||  this.network.name);
}



Wallet.read = function (BIP38password) {
};

Wallet.prototype.registeredCosigners = function () {

  // 1 is self.
  return 1 + this.cosignersBIP.length;
};

Wallet.prototype.getExtendedPrivKey = function (BIP38password) {
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


  this.cosignersBIP.forEach(function(b){
    if (b.getExtendedPubKey() === newEpk)
      throw new Error('already have that key');
  });

  this.cosignersBIP.push(new Wallet({bytes:newEpk, network: this.network.name } ));
};


Wallet.prototype.haveAllNeededPubKeys = function () {
  return this.registeredCosigners() === this.totalCosigners;
};


Wallet.prototype.getChangeAddress = function (index) {

  //index can be 0, 1, 2, etc.
  if (! this.haveAllNeededPubKeys() ) 
      throw new Error('cosigners pub key missing');
};


Wallet.prototype.store = function () {
};


// Input: Bitcore's Transaction, sign with ownPK
// return partially signed or fully signed tx
Wallet.prototype.signTx = function (tx, BIP38password) {
};

module.exports = require('soop')(Wallet);
