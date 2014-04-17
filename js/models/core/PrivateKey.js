'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var WalletKey   = bitcore.WalletKey;
var networks    = bitcore.networks;
var util        = bitcore.util;
var PublicKeyRing  = require('./PublicKeyRing');

function PrivateKey(opts) {
  opts = opts || {};
  this.network = opts.networkName === 'testnet' ? 
    networks.testnet : networks.livenet;
  var init = opts.extendedPrivateKeyString || this.network.name;
  this.bip = opts.BIP32 || new BIP32(init);
  this.privateKeyCache = opts.privateKeyCache || {};
  this._calcId();
};

PrivateKey.prototype._calcId = function() {
  this.id = util.ripe160(this.bip.extendedPublicKey).toString('hex');
};

PrivateKey.fromObj = function(obj) {
  return new PrivateKey(obj);
};

PrivateKey.prototype.toObj = function() {
  return {
    extendedPrivateKeyString: this.getExtendedPrivateKeyString(),
    networkName: this.network.name,
    privateKeyCache: this.privateKeyCache
  };
};

PrivateKey.prototype.getExtendedPublicKeyString = function() {
  return this.bip.extendedPublicKeyString();
};

PrivateKey.prototype.getExtendedPrivateKeyString = function() {
  return this.bip.extendedPrivateKeyString();
};

PrivateKey.prototype._getBIP32 = function(path) {
  if (typeof path === 'undefined') {
    return this.bip;
  }
  return this.bip.derive(path);
};

PrivateKey.prototype.get = function(index,isChange) {
  var path = PublicKeyRing.Branch(index, isChange);
  var pk = this.privateKeyCache[path];
  if (!pk) {
    var derivedBIP32 =  this._getBIP32(path);
    pk = this.privateKeyCache[path] = derivedBIP32.eckey.private.toString('hex');
  } else {
    //console.log('cache hit!');
  }
  var wk = new WalletKey({network: this.network});
  wk.fromObj({priv: pk});
  return wk;
};

PrivateKey.prototype.getAll = function(addressIndex, changeAddressIndex) {
  var ret = [];

  for(var i=0;i<addressIndex; i++) {
    ret.push(this.get(i,false));
  }
  for(var i=0; i<changeAddressIndex; i++) {
    ret.push(this.get(i,true));
  }
  return ret;
};



module.exports = require('soop')(PrivateKey);
