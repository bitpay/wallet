
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
 * This follow Electrum convetion, as described in
 * https://bitcointalk.org/index.php?topic=274182.0
 *
 * We should probably adopt the next standard once it's ready, as discussed in:
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
  this.copayersBIP32 = [];

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

//  this.bip32 = ;
  w.copayersBIP32 = data.copayersExtPubKeys.map( function (pk) { 
    return new BIP32(pk);
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
    copayersExtPubKeys: this.copayersBIP32.map( function (b) { 
      return b.extendedPublicKeyString(); 
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
  return this.copayersBIP32.length;
};



PublicKeyRing.prototype.haveAllRequiredPubKeys = function () {
  return this.registeredCopayers() === this.totalCopayers;
};

PublicKeyRing.prototype._checkKeys = function() {

  if (!this.haveAllRequiredPubKeys())
      throw new Error('dont have required keys yet');
};


PublicKeyRing.prototype._newExtendedPublicKey = function () {
  return new BIP32(this.network.name)
    .extendedPublicKeyString();
};

PublicKeyRing.prototype.addCopayer = function (newEpk) {

  if (this.haveAllRequiredPubKeys())
      throw new Error('already have all required key:' + this.totalCopayers);

  if (!newEpk) {
    newEpk = this._newExtendedPublicKey();
  }

  this.copayersBIP32.forEach(function(b){
    if (b.extendedPublicKeyString() === newEpk)
      throw new Error('already have that key');
  });

  this.copayersBIP32.push(new BIP32(newEpk));
  this.dirty = 1;
  return newEpk;
};


PublicKeyRing.prototype.getCopayersPubKeys = function () {
  this._checkKeys();

  var pubKeys = [];
  var l = this.copayersBIP32.length;
  for(var i=0; i<l; i++) {
    var path = (isChange ? CHANGE_BRANCH : PUBLIC_BRANCH) + index;
    var bip32 = this.copayersBIP32[i].derive(path);
    pubKeys[i] = bip32.eckey.public;
  }

  return pubKeys;
};

PublicKeyRing.prototype._checkIndexRange = function (index, isChange) {
  if ( (isChange && index > this.changeAddressIndex) ||
      (!isChange && index > this.addressIndex)) {
    log('Out of bounds at getAddress: Index %d isChange: %d', index, isChange);
    throw new Error('index out of bound');
  }
};

PublicKeyRing.prototype.getRedeemScript = function (index, isChange) {
  this._checkIndexRange(index, isChange);

  var pubKeys = this.getCopayersPubKeys();
  var script  = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};

PublicKeyRing.prototype.getAddress = function (index, isChange) {
  this._checkIndexRange(index, isChange);

  var script  = this.getRedeemScript(index,isChange);
  var hash    = coinUtil.sha256ripe160(script.getBuffer());
  var version = this.network.addressScript;
  var addr    = new Address(version, hash);
  return addr.as('base58');
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
