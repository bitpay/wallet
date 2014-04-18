
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var BIP32       = bitcore.BIP32;
var Address     = bitcore.Address;
var Script      = bitcore.Script;
var coinUtil    = bitcore.util;
var Transaction = bitcore.Transaction;

var Storage     = imports.Storage || require('../storage/Base.js');
var storage     = Storage.default();


function PublicKeyRing(opts) {
  opts = opts || {};

  this.walletId = opts.walletId;

  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.copayersBIP32 = opts.copayersBIP32 || [];

  this.changeAddressIndex= opts.changeAddressIndex || 0;
  this.addressIndex= opts.addressIndex || 0;

  this.publicKeysCache = opts.publicKeysCache || {};
}

/*
 * This follow Electrum convetion, as described in
 * https://bitcointalk.org/index.php?topic=274182.0
 *
 * We should probably adopt the next standard once it's ready, as discussed in:
 * http://sourceforge.net/p/bitcoin/mailman/message/32148600/
 *
 */

PublicKeyRing.Branch = function (index, isChange) {
  return 'm/'+(isChange?1:0)+'/'+index;
};

PublicKeyRing.fromObj = function (data) {
  if (data instanceof PublicKeyRing) {
    throw new Error('bad data format: Did you use .toObj()?');
  }
  data.copayersBIP32 = data.copayersExtPubKeys.map(function(pk) {
    return new BIP32(pk);
  });
  return new PublicKeyRing(data);
};

PublicKeyRing.prototype.toObj = function() {
  return {
    walletId: this.walletId,
    networkName: this.network.name,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,

    changeAddressIndex: this.changeAddressIndex,
    addressIndex: this.addressIndex,
    copayersExtPubKeys: this.copayersBIP32.map( function (b) { 
      return b.extendedPublicKeyString(); 
    }),
    publicKeysCache: this.publicKeysCache
  };
};

PublicKeyRing.prototype.serialize = function () {
  return JSON.stringify(this.toObj());
};


PublicKeyRing.prototype.registeredCopayers = function () {
  return this.copayersBIP32.length;
};


PublicKeyRing.prototype.isComplete = function () {
  return this.registeredCopayers() >= this.totalCopayers;
};

PublicKeyRing.prototype._checkKeys = function() {

  if (!this.isComplete())
      throw new Error('dont have required keys yet');
};


PublicKeyRing.prototype._newExtendedPublicKey = function () {
  return new BIP32(this.network.name)
    .extendedPublicKeyString();
};

PublicKeyRing.prototype.addCopayer = function (newEpk) {

  if (this.isComplete())
      throw new Error('already have all required key:' + this.totalCopayers);

  if (!newEpk) {
    newEpk = this._newExtendedPublicKey();
  }

  this.copayersBIP32.forEach(function(b){
    if (b.extendedPublicKeyString() === newEpk)
      throw new Error('already have that key');
  });

  this.copayersBIP32.push(new BIP32(newEpk));
  return newEpk;
};


PublicKeyRing.prototype.getPubKeys = function (index, isChange) {
  this._checkKeys();

  var path = PublicKeyRing.Branch(index, isChange); 
  var pubKeys = this.publicKeysCache[path];
  if (!pubKeys) {
    pubKeys = [];
    var l = this.copayersBIP32.length;
    for(var i=0; i<l; i++) {
      var bip32 = this.copayersBIP32[i].derive(path);
      pubKeys[i] = bip32.eckey.public;
    }
    this.publicKeysCache[path] = pubKeys.map(function(pk){return pk.toString('hex')});
  } else {
    pubKeys = pubKeys.map(function(s){return new Buffer(s,'hex')});
  }

  return pubKeys;
};

PublicKeyRing.prototype._checkIndexRange = function (index, isChange) {
  if ( (isChange && index > this.changeAddressIndex) ||
      (!isChange && index > this.addressIndex)) {
    console.log('Out of bounds at getAddress: Index %d isChange: %d', index, isChange);
    throw new Error('index out of bound');
  }
};

PublicKeyRing.prototype.getRedeemScript = function (index, isChange) {
  this._checkIndexRange(index, isChange);

  var pubKeys = this.getPubKeys(index, isChange);
  var script  = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};


PublicKeyRing.prototype.getAddress = function (index, isChange) {
  this._checkIndexRange(index, isChange);
  var script  = this.getRedeemScript(index,isChange);
  return Address.fromScript(script, this.network.name);
};

PublicKeyRing.prototype.getScriptPubKeyHex = function (index, isChange) {
  this._checkIndexRange(index, isChange);
  var addr  = this.getAddress(index,isChange);
  return Script.createP2SH(addr.payload()).getBuffer().toString('hex');
};



//generate a new address, update index.
PublicKeyRing.prototype.generateAddress = function(isChange) {

  var ret =  
    this.getAddress(isChange ? this.changeAddressIndex : this.addressIndex, isChange);
  if (isChange) {
    this.changeAddressIndex++;
  } else { 
    this.addressIndex++;
  }

  return ret;

};

PublicKeyRing.prototype.getAddresses = function(onlyMain) {
  var ret = [];

  for (var i=0; i<this.addressIndex; i++) {
    ret.push(this.getAddress(i,false));
  }

  if (!onlyMain) {
    for (var i=0; i<this.changeAddressIndex; i++) {
      ret.push(this.getAddress(i,true));
    }
  }
  return ret;
};

PublicKeyRing.prototype.getRedeemScriptMap = function () {
  var ret = {};

  for (var i=0; i<this.changeAddressIndex; i++) {
    ret[this.getAddress(i,true)] = this.getRedeemScript(i,true).getBuffer().toString('hex');
  }

  for (var i=0; i<this.addressIndex; i++) {
    ret[this.getAddress(i)] = this.getRedeemScript(i).getBuffer().toString('hex');
  }
  return ret;
};



PublicKeyRing.prototype._checkInPRK = function(inPKR, ignoreId) {

  if (!ignoreId  && this.walletId !== inPKR.walletId) {
    throw new Error('inPRK walletId mismatch');
  }

  if (this.network.name !== inPKR.network.name)
    throw new Error('inPRK network mismatch');

  if (
    this.requiredCopayers && inPKR.requiredCopayers &&
    (this.requiredCopayers !== inPKR.requiredCopayers))
    throw new Error('inPRK requiredCopayers mismatch');

  if (
    this.totalCopayers && inPKR.totalCopayers &&
    (this.totalCopayers !== inPKR.totalCopayers))
    throw new Error('inPRK requiredCopayers mismatch');
};


PublicKeyRing.prototype._mergeIndexes = function(inPKR) {
  var hasChanged = false;

  // Indexes
  if (inPKR.changeAddressIndex > this.changeAddressIndex) {
    this.changeAddressIndex = inPKR.changeAddressIndex;
    hasChanged = true;
  }

  if (inPKR.addressIndex > this.addressIndex) {
    this.addressIndex = inPKR.addressIndex;
    hasChanged = true;
  }
  return hasChanged;
};

PublicKeyRing.prototype._mergePubkeys = function(inPKR) {
  var self = this;
  var hasChanged = false;
  var l= self.copayersBIP32.length;

  inPKR.copayersBIP32.forEach( function(b) {
    var haveIt = false;
    var epk = b.extendedPublicKeyString(); 
    for(var j=0; j<l; j++) {
      if (self.copayersBIP32[j].extendedPublicKeyString() === epk) {
        haveIt=true;
        break;
      }
    }
    if (!haveIt) {
      if (self.isComplete()) {
        //console.log('[PublicKeyRing.js.318] REPEATED KEY', epk); //TODO
        throw new Error('trying to add more pubkeys, when PKR isComplete at merge');
      }
      self.copayersBIP32.push(new BIP32(epk));
      hasChanged=true;
    }
  });
  return hasChanged;
};

PublicKeyRing.prototype.merge = function(inPKR, ignoreId) {
  var hasChanged = false;

  this._checkInPRK(inPKR, ignoreId);

  if (this._mergeIndexes(inPKR))
    hasChanged = true;

  if (this._mergePubkeys(inPKR))
    hasChanged = true;

  return hasChanged;
};

module.exports = require('soop')(PublicKeyRing);
