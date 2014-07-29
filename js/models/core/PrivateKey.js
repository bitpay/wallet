'use strict';


var bitcore = require('bitcore');
var HK = bitcore.HierarchicalKey;
var WalletKey = bitcore.WalletKey;
var networks = bitcore.networks;
var util = bitcore.util;
var HDPath = require('./HDPath');

function PrivateKey(opts) {
  opts = opts || {};
  this.network = opts.networkName === 'testnet' ?
    networks.testnet : networks.livenet;
  var init = opts.extendedPrivateKeyString || this.network.name;
  this.bip = opts.HK || new HK(init);
  this.privateKeyCache = opts.privateKeyCache || {};
  this.publicHex = this.deriveBIP45Branch().eckey.public.toString('hex');
};

PrivateKey.prototype.getId = function() {
  if (!this.id) {
    this.cacheId();
  }
  return this.id;
};

PrivateKey.prototype.getIdPriv = function() {
  if (!this.idpriv) {
    this.cacheId();
  }
  return this.idpriv;
};

PrivateKey.prototype.getIdKey = function() {
  if (!this.idkey) {
    this.cacheId();
  }
  return this.idkey;
};

PrivateKey.prototype.cacheId = function() {
  var path = HDPath.IdFullBranch;
  var idhk = this.bip.derive(path);
  this.idkey = idhk.eckey;
  this.id = idhk.eckey.public.toString('hex');
  this.idpriv = idhk.eckey.private.toString('hex');
};

PrivateKey.prototype.deriveBIP45Branch = function() {
  if (!this.bip45Branch) {
    this.bip45Branch = this.bip.derive(HDPath.BIP45_PUBLIC_PREFIX);
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
  var ret = this.bip.derive(path);
  return ret;
};

PrivateKey.prototype.getForPaths = function(paths) {
  return paths.map(this.getForPath.bind(this));
};

PrivateKey.prototype.getForPath = function(path) {
  var pk = this.privateKeyCache[path];
  if (!pk) {
    var derivedHK = this._getHK(path);
    pk = this.privateKeyCache[path] = derivedHK.eckey.private.toString('hex');
  }
  var wk = new WalletKey({
    network: this.network
  });
  wk.fromObj({
    priv: pk
  });
  return wk;
};

PrivateKey.prototype.get = function(index, isChange, cosigner) {
  var path = HDPath.FullBranch(index, isChange, cosigner);
  return this.getForPath(path);
};

PrivateKey.prototype.getAll = function(receiveIndex, changeIndex, cosigner) {
  if (typeof receiveIndex === 'undefined' || typeof changeIndex === 'undefined')
    throw new Error('Invalid parameters');

  var ret = [];
  for (var i = 0; i < receiveIndex; i++) {
    ret.push(this.get(i, false, cosigner));
  }
  for (var i = 0; i < changeIndex; i++) {
    ret.push(this.get(i, true, cosigner));
  }
  return ret;
};



module.exports = PrivateKey;
