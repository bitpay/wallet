
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var HK          = bitcore.HierarchicalKey;
var Address     = bitcore.Address;
var Script      = bitcore.Script;
var coinUtil    = bitcore.util;
var Transaction = bitcore.Transaction
var util        = bitcore.util;

var Storage     = imports.Storage || require('../storage/Base.js');
var storage     = Storage.default();


function PublicKeyRing(opts) {
  opts = opts || {};

  this.walletId = opts.walletId;

  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.copayersHK = opts.copayersHK || [];

  this.changeAddressIndex= opts.changeAddressIndex || 0;
  this.addressIndex= opts.addressIndex || 0;

  this.publicKeysCache = opts.publicKeysCache || {};
  this.nicknameFor = opts.nicknameFor || {};
  this.copayerIds = [];
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
  // first 0 is for future use: could be copayerId.
  return 'm/0/'+(isChange?1:0)+'/'+index;
};

PublicKeyRing.ID_BRANCH = 'm/100/0/0';

PublicKeyRing.fromObj = function (data) {
  if (data instanceof PublicKeyRing) {
    throw new Error('bad data format: Did you use .toObj()?');
  }
  var ret =  new PublicKeyRing(data);

  for (var k in data.copayersExtPubKeys) {
    ret.addCopayer(data.copayersExtPubKeys[k]);
  }

  return ret;
};

PublicKeyRing.prototype.toObj = function() {
  return {
    walletId: this.walletId,
    networkName: this.network.name,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,

    changeAddressIndex: this.changeAddressIndex,
    addressIndex: this.addressIndex,
    copayersExtPubKeys: this.copayersHK.map( function (b) { 
      return b.extendedPublicKeyString(); 
    }),
    nicknameFor: this.nicknameFor,
    publicKeysCache: this.publicKeysCache
  };
};

PublicKeyRing.prototype.getCopayerId = function(i) {
  return this.copayerIds[i];
};

PublicKeyRing.prototype.registeredCopayers = function () {
  return this.copayersHK.length;
};

PublicKeyRing.prototype.isComplete = function () {
  return this.registeredCopayers() === this.totalCopayers;
};

PublicKeyRing.prototype.getAllCopayerIds = function() {
  return this.copayerIds;
};

PublicKeyRing.prototype.myCopayerId = function(i) {
  return this.getCopayerId(0);
};

PublicKeyRing.prototype._checkKeys = function() {

  if (!this.isComplete())
      throw new Error('dont have required keys yet');
};

PublicKeyRing.prototype._newExtendedPublicKey = function () {
  return new HK(this.network.name)
    .extendedPublicKeyString();
};

PublicKeyRing.prototype._updateBip = function (index) {
  var path = PublicKeyRing.ID_BRANCH;
  var hk = this.copayersHK[index].derive(path);
  this.copayerIds[index]= hk.eckey.public.toString('hex');
};

PublicKeyRing.prototype._setNicknameForIndex = function (index, nickname) {
  this.nicknameFor[this.copayerIds[index]] = nickname;
};

PublicKeyRing.prototype.nicknameForIndex = function (index) {
  return this.nicknameFor[this.copayerIds[index]];
};

PublicKeyRing.prototype.nicknameForCopayer = function (copayerId) {
  return this.nicknameFor[copayerId];
};

PublicKeyRing.prototype.addCopayer = function (newEpk, nickname) {
  if (this.isComplete())
      throw new Error('already have all required key:' + this.totalCopayers);

  if (!newEpk) {
    newEpk = this._newExtendedPublicKey();
  }

  this.copayersHK.forEach(function(b){
    if (b.extendedPublicKeyString() === newEpk)
      throw new Error('already have that key');
  });

  var i=this.copayersHK.length;
  var bip = new HK(newEpk);
  this.copayersHK.push(bip);
  this._updateBip(i);
  if (nickname) { 
    this._setNicknameForIndex(i,nickname);
  }
  return newEpk;
};

PublicKeyRing.prototype.getPubKeys = function (index, isChange) {
  this._checkKeys();

  var path = PublicKeyRing.Branch(index, isChange); 
  var pubKeys = this.publicKeysCache[path];
  if (!pubKeys) {
    pubKeys = [];
    var l = this.copayersHK.length;
    for(var i=0; i<l; i++) {
      var hk = this.copayersHK[i].derive(path);
      pubKeys[i] = hk.eckey.public;
    }
    this.publicKeysCache[path] = pubKeys.map(function(pk){return pk.toString('hex');});
  } 
  else {
    pubKeys = pubKeys.map(function(s){return new Buffer(s,'hex');}); 
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

// TODO this could be cached
PublicKeyRing.prototype.getRedeemScript = function (index, isChange) {
  this._checkIndexRange(index, isChange);

  var pubKeys = this.getPubKeys(index, isChange);
  var script  = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};

// TODO this could be cached
PublicKeyRing.prototype.getAddress = function (index, isChange) {
  var script  = this.getRedeemScript(index,isChange);
  return Address.fromScript(script, this.network.name);
};

// TODO this could be cached
PublicKeyRing.prototype.getScriptPubKeyHex = function (index, isChange) {
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

PublicKeyRing.prototype.getAddresses = function(opts) {
  return this.getAddressesInfo(opts).map(function(info) {
    return info.address;
  });
};

PublicKeyRing.prototype.getAddressesInfo = function(opts) {
  opts = opts || {};

  var ret = [];
  if (!opts.excludeChange) {
    for (var i=0; i<this.changeAddressIndex; i++) {
      ret.unshift({
        address: this.getAddress(i,true),
        isChange: true
      });
    }
  }

  if (!opts.excludeMain) {
    for (var i=0; i<this.addressIndex; i++) {
      ret.unshift({
        address: this.getAddress(i,false),
        isChange: false
      });
    }
  }

  return ret;
};

// TODO this could be cached
PublicKeyRing.prototype._addScriptMap = function (map, index, isChange) {
  var script  = this.getRedeemScript(index,isChange);
  map[Address.fromScript(script, this.network.name).toString()] = script.getBuffer().toString('hex');
};

PublicKeyRing.prototype.getRedeemScriptMap = function () {
  var ret = {};

  for (var i=0; i<this.changeAddressIndex; i++) {
    this._addScriptMap(ret,i,true);
  }
  for (var i=0; i<this.addressIndex; i++) {
    this._addScriptMap(ret,i,false);
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
    throw new Error('inPRK requiredCopayers mismatch '+this.requiredCopayers+'!='+inPKR.requiredCopayers);

  if (
    this.totalCopayers && inPKR.totalCopayers &&
    (this.totalCopayers !== inPKR.totalCopayers))
    throw new Error('inPRK totalCopayers mismatch'+this.totalCopayers+'!='+inPKR.requiredCopayers);
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
  var l= self.copayersHK.length;
  if (self.isComplete()) 
    return;

  inPKR.copayersHK.forEach( function(b) {
    var haveIt = false;
    var epk = b.extendedPublicKeyString(); 
    for(var j=0; j<l; j++) {
      if (self.copayersHK[j].extendedPublicKeyString() === epk) {
        haveIt=true;
        break;
      }
    }
    if (!haveIt) {
      if (self.isComplete()) {
        throw new Error('trying to add more pubkeys, when PKR isComplete at merge');
      }
      var l2 = self.copayersHK.length;
      self.copayersHK.push(new HK(epk));
      self._updateBip(l2);
      if (inPKR.nicknameFor[self.getCopayerId(l2)])
        self._setNicknameForIndex(l2,inPKR.nicknameFor[self.getCopayerId(l2)]);
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
