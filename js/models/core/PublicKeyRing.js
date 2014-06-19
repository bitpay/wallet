
'use strict';


var imports     = require('soop').imports();
var bitcore     = require('bitcore');
var HK          = bitcore.HierarchicalKey;
var PrivateKey  = require('./PrivateKey');
var Structure   = require('./Structure');
var AddressIndex= require('./AddressIndex');
var Address     = bitcore.Address;
var Script      = bitcore.Script;

function PublicKeyRing(opts) {
  opts = opts || {};

  this.walletId = opts.walletId;

  this.network = opts.networkName === 'livenet' ? 
      bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.copayersHK = opts.copayersHK || [];

  this.indexes = AddressIndex.fromObj(opts.indexes) || new AddressIndex(opts);

  this.publicKeysCache = opts.publicKeysCache || {};
  this.nicknameFor = opts.nicknameFor || {};
  this.copayerIds = [];
  this.addressToPath = {};
}

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
    indexes: this.indexes.toObj(),

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
  return new PrivateKey({networkName: this.network.name})
    .deriveBIP45Branch()
    .extendedPublicKeyString();
};

PublicKeyRing.prototype._updateBip = function (index) {
  var hk = this.copayersHK[index].derive(Structure.IdBranch);
  this.copayerIds[index]= hk.eckey.public.toString('hex');
};

PublicKeyRing.prototype._setNicknameForIndex = function (index, nickname) {
  this.nicknameFor[this.copayerIds[index]] = nickname;
};

PublicKeyRing.prototype.nicknameForIndex = function(index) {
  return this.nicknameFor[this.copayerIds[index]];
};

PublicKeyRing.prototype.nicknameForCopayer = function(copayerId) {
  return this.nicknameFor[copayerId] || 'NN';
};

PublicKeyRing.prototype.addCopayer = function(newEpk, nickname) {
  if (this.isComplete())
      throw new Error('PKR already has all required key:' + this.totalCopayers);

  this.copayersHK.forEach(function(b){
    if (b.extendedPublicKeyString() === newEpk)
      throw new Error('PKR already has that key');
  });

  if (!newEpk) {
    newEpk = this._newExtendedPublicKey();
  }

  var i = this.copayersHK.length;
  var bip = new HK(newEpk);
  this.copayersHK.push(bip);
  this._updateBip(i);
  if (nickname) { 
    this._setNicknameForIndex(i, nickname);
  }
  return newEpk;
};

PublicKeyRing.prototype.getPubKeys = function(index, isChange) {
  this._checkKeys();

  var path = Structure.Branch(index, isChange); 
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

// TODO this could be cached
PublicKeyRing.prototype.getRedeemScript = function (index, isChange) {
  var pubKeys = this.getPubKeys(index, isChange);
  var script  = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};

// TODO this could be cached
PublicKeyRing.prototype.getAddress = function (index, isChange) {
  var script  = this.getRedeemScript(index,isChange);
  var address = Address.fromScript(script, this.network.name);
  this.addressToPath[address.toString()] = Structure.FullBranch(index, isChange);
  return address;
};

PublicKeyRing.prototype.pathForAddress = function(address) {
  var path = this.addressToPath[address];
  if (!path) throw new Error('Couldn\'t find path for address '+address);
  return path;
};

// TODO this could be cached
PublicKeyRing.prototype.getScriptPubKeyHex = function (index, isChange) {
  var addr  = this.getAddress(index,isChange);
  return Script.createP2SH(addr.payload()).getBuffer().toString('hex');
};

//generate a new address, update index.
PublicKeyRing.prototype.generateAddress = function(isChange) {

  var index = isChange ? this.indexes.getChangeIndex() : this.indexes.getReceiveIndex();
  var ret = this.getAddress(index, isChange);
  this.indexes.increment(isChange);
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
    for (var i=0; i<this.indexes.getChangeIndex(); i++) {
      ret.unshift({
        address: this.getAddress(i,true),
        isChange: true
      });
    }
  }

  if (!opts.excludeMain) {
    for (var i=0; i<this.indexes.getReceiveIndex(); i++) {
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

  for (var i=0; i<this.indexes.getChangeIndex(); i++) {
    this._addScriptMap(ret,i,true);
  }
  for (var i=0; i<this.indexes.getReceiveIndex(); i++) {
    this._addScriptMap(ret,i,false);
  }
  return ret;
};

PublicKeyRing.prototype._checkInPKR = function(inPKR, ignoreId) {

  if (!ignoreId  && this.walletId !== inPKR.walletId) {
    throw new Error('inPKR walletId mismatch');
  }

  if (this.network.name !== inPKR.network.name) {
    throw new Error('Network mismatch. Should be '+this.network.name +
        ' and found '+inPKR.network.name);
  }

  if (
    this.requiredCopayers && inPKR.requiredCopayers &&
    (this.requiredCopayers !== inPKR.requiredCopayers))
    throw new Error('inPKR requiredCopayers mismatch '+this.requiredCopayers+'!='+inPKR.requiredCopayers);

  if (
    this.totalCopayers && inPKR.totalCopayers &&
    (this.totalCopayers !== inPKR.totalCopayers))
    throw new Error('inPKR totalCopayers mismatch'+this.totalCopayers+'!='+inPKR.requiredCopayers);
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

  this._checkInPKR(inPKR, ignoreId);

  if (this.indexes.merge(inPKR.indexes))
    hasChanged = true;

  if (this._mergePubkeys(inPKR))
    hasChanged = true;

  return hasChanged;
};

module.exports = require('soop')(PublicKeyRing);
