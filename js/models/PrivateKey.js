'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var WalletKey   = bitcore.WalletKey;
var networks    = bitcore.networks;
var util        = bitcore.util;
var PublicKeyRing  = require('./PublicKeyRing');

function PrivateKey(opts) {
  this.network = opts.networkName === 'testnet' ? 
    networks.testnet : networks.livenet;
  var init = opts.extendedPrivateKeyString || this.network.name;
  this.BIP32 = opts.BIP32 || new BIP32(init);
  this._calcId();
};

PrivateKey.prototype._calcId = function() {
  this.id = util.ripe160(this.BIP32.extendedPublicKey).toString('hex');
};

PrivateKey.prototype.getBIP32 = function(index,isChange) {
  if (typeof index === 'undefined') {
    return this.BIP32;
  }
  return this.BIP32.derive( isChange ? 
    PublicKeyRing.ChangeBranch(index):PublicKeyRing.PublicBranch(index) );
};


PrivateKey.fromObj = function(o) {
  return new PrivateKey({
    extendedPrivateKeyString: o.extendedPrivateKeyString,
    networkName: o.networkName,
  });
};

PrivateKey.prototype.toObj = function() {
  return {
    extendedPrivateKeyString: this.BIP32.extendedPrivateKeyString(),
    networkName: this.network.name,
  };
};

PrivateKey.prototype.get = function(index,isChange) {
  var derivedBIP32 =  this.getBIP32(index,isChange);
  var wk = new WalletKey({network: this.network});
  var p = derivedBIP32.eckey.private.toString('hex');
  wk.fromObj({priv: p});
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
