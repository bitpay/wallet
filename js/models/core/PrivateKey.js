'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var HK          = bitcore.HierarchicalKey;
var WalletKey   = bitcore.WalletKey;
var networks    = bitcore.networks;
var util        = bitcore.util;
var Structure   = require('./Structure');

function PrivateKey(opts) {
  opts = opts || {};
  this.network = opts.networkName === 'testnet' ? 
    networks.testnet : networks.livenet;
  var init = opts.extendedPrivateKeyString || this.network.name;
  this.bip = opts.HK || new HK(init);
  this.privateKeyCache = opts.privateKeyCache || {};
};

PrivateKey.prototype.getId = function() {
  if (!this.id) {
    var path = Structure.IdFullBranch;
    var idhk = this.bip.derive(path);
    this.id= idhk.eckey.public.toString('hex');
  }
  return this.id;
};

PrivateKey.prototype.deriveBIP45Branch = function() {
  if (!this.bip45Branch) {
    this.bip45Branch = this.bip.derive(Structure.BIP45_PUBLIC_PREFIX);
  }
  return this.bip45Branch;
}

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

PrivateKey.prototype._getHK = function(path) {
  if (typeof path === 'undefined') {
    return this.bip;
  }
  return this.bip.derive(path);
};

PrivateKey.prototype.get = function(index,isChange) {
  var path = Structure.FullBranch(index, isChange);
  var pk = this.privateKeyCache[path];
  if (!pk) {
    var derivedHK =  this._getHK(path);
    pk = this.privateKeyCache[path] = derivedHK.eckey.private.toString('hex');
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
