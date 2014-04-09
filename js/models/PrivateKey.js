'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var WalletKey   = bitcore.WalletKey;
var networks    = bitcore.networks;
var PublicKeyRing  = require('./PublicKeyRing');

function PrivateKey(opts) {
  this.id    = opts.id;
  this.network = opts.networkName === 'testnet' ? 
    networks.testnet : networks.livenet;
  this.BIP32 = opts.BIP32 || new BIP32(this.network.name);
};


PrivateKey.prototype.getBIP32 = function(index,isChange) {
  if (typeof index === 'undefined') {
    return this.BIP32;
  }
  return this.BIP32.derive( isChange ? 
    PublicKeyRing.ChangeBranch(index):PublicKeyRing.PublicBranch(index) );
};

PrivateKey.prototype.get = function(index,isChange) {
  var derivedBIP32 =  this.getBIP32(index,isChange);
  var wk = new WalletKey({network: this.network});
  var p = derivedBIP32.eckey.private.toString('hex');
  wk.fromObj({priv: p});
  return wk;
};

module.exports = require('soop')(PrivateKey);
