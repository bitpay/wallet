'use strict';
var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var Address     = bitcore.Address;
var Script      = bitcore.Script;
var coinUtil    = bitcore.util;
var Transaction = bitcore.Transaction;
var buffertools = bitcore.buffertools;

var Storage     = imports.Storage || require('./Storage');
var log         = imports.log || console.log;

var storage     = Storage.default();

/*
 * This follow Electrum convetion, as described on
 * https://bitcointalk.org/index.php?topic=274182.0
 *
 * We should probably adapt the next standard once its ready as discussed at:
 * http://sourceforge.net/p/bitcoin/mailman/message/32148600/
 *
 */

var PUBLIC_BRANCH = 'm/0/';
var CHANGE_BRANCH = 'm/1/';


function PublicKeyRing(opts) {
  opts = opts || {};

  this.network = opts.network === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.id = opts.id || PublicKeyRing.getRandomId();

  this.dirty = 1;
  this.copayersWallets = [];
  this.bip32 = new BIP32(opts.bytes ||  this.network.name);

  this.changeAddressIndex=0;
  this.addressIndex=0;
}


PublicKeyRing.getRandomId = function () {
  return buffertools.toHex(coinUtil.generateNonce());
};

PublicKeyRing.decrypt = function (passphrase, encPayload) {
  log('[wallet.js.35] TODO READ: passphrase IGNORED');
  return encPayload;
};

PublicKeyRing.encrypt = function (passphrase, payload) {
  log('[wallet.js.92] TODO: passphrase IGNORED');
  return payload;
};

PublicKeyRing.read = function (id, passphrase) {
  var encPayload = storage.read(id);
  if (!encPayload) 
    throw new Error('Could not find wallet data');
  var data;
  try {
    data = JSON.parse( PublicKeyRing.decrypt( passphrase, encPayload ));
  } catch (e) {
    throw new Error('error in storage: '+ e.toString());
    return;
  };

  if (data.id !== id) 
    throw new Error('Wrong id in data');

  var config = { network: data.network === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet
  };

  var w = new PublicKeyRing(config);

  w.requiredCopayers = data.neededCopayers;
  w.totalCopayers = data.totalCopayers;
  w.copayersWallets = data.copayersExtPubKeys.map( function (pk) { 
    return new PublicKeyRing({bytes:pk, network: w.network.name});
  });

  w.dirty = 0;

  return w;
};

PublicKeyRing.prototype.serialize = function () {
  return JSON.stringify({
    id: this.id,
    network: this.network.name,
    requiredCopayers: this.neededCopayers,
    totalCopayers: this.totalCopayers,
    copayersExtPubKeys: this.copayersWallets.map( function (b) { 
      return b.getMasterExtendedPubKey(); 
    }),
  });
};

PublicKeyRing.prototype.store = function (passphrase) {

  if (!this.id) 
      throw new Error('wallet has no id');

  storage.save(this.id, PublicKeyRing.encrypt(passphrase,this.serialize()));
  this.dirty = 0;

  return true;
};

PublicKeyRing.prototype.registeredCopayers = function () {
  if (! this.copayersWallets) return 1;


  // 1 is self.
  return 1 + this.copayersWallets.length;
};

PublicKeyRing.prototype.getMasterExtendedPubKey = function () {
  return this.bip32.extendedPublicKeyString();
};


PublicKeyRing.prototype.haveAllRequiredPubKeys = function () {
  return this.registeredCopayers() === this.totalCopayers;
};

PublicKeyRing.prototype._checkKeys = function() {

  if (!this.haveAllRequiredPubKeys())
      throw new Error('dont have required keys yet');
};


//  should receive an array also?
PublicKeyRing.prototype.addCopayerExtendedPubKey = function (newEpk) {

  if (this.haveAllRequiredPubKeys())
      throw new Error('already have all required key:' + this.totalCopayers);

  if (this.getMasterExtendedPubKey() === newEpk)
    throw new Error('already have that key (self key)');


  this.copayersWallets.forEach(function(b){
    if (b.getMasterExtendedPubKey() === newEpk)
      throw new Error('already have that key');
  });

  this.copayersWallets.push(new PublicKeyRing({bytes:newEpk, network: this.network.name } ));
  this.dirty = 1;
};


PublicKeyRing.prototype.getPubKey = function (index,isChange) {

  var path = (isChange ? CHANGE_BRANCH : PUBLIC_BRANCH) + index;
  var bip32 = this.bip32.derive(path);
  var pub   = bip32.eckey.public;
  return pub;
};

PublicKeyRing.prototype.getCopayersPubKeys = function (index, isChange) {
  this._checkKeys();

  var pubKeys = [];
  var l = this.copayersWallets.length;
  for(var i=0; i<l; i++) {
    pubKeys[i] = this.copayersWallets[i].getPubKey(index, isChange);
  }

  return pubKeys;
};

PublicKeyRing.prototype.getAddress = function (index, isChange) {

  if ( (isChange && index > this.changeAddressIndex)
      || (!isChange && index > this.addressIndex)) {
    log('Out of bounds at getAddress: Index %d isChange: %d', index, isChange);
    throw new Error('index out of bound');
  }

  var pubKeys = this.getCopayersPubKeys();
  var version = this.network.addressScript;
  var script  = Script.createMultisig(this.requiredCopayers, pubKeys);
  var buf     = script.buffer;
  var hash    = coinUtil.sha256ripe160(buf);
  var addr    = new Address(version, hash);
  var addrStr = addr.as('base58');
  return addrStr;
};

//generate a new address, update index.
PublicKeyRing.prototype.generateAddress = function(isChange) {

  var ret =  
    this.getAddress(isChange ? this.changeAddressIndex : this.addressIndex, isChange);
  if (isChange) 
    this.addressIndex++;
  else 
    this.changeAddressIndex++;

  return ret;

};

PublicKeyRing.prototype.getAddresses = function() {
  var ret = [];

  for (var i=0; i<this.changeAddressIndex; i++) {
    ret.push(this.getAddress(i,true));
  }

  for (var i=0; i<this.addressIndex; i++) {
    ret.push(this.getAddress(i,false));
  }
  return ret;
};

module.exports = require('soop')(PublicKeyRing);
