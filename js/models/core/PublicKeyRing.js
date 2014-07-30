'use strict';


var preconditions = require('preconditions').instance();
var bitcore = require('bitcore');
var HK = bitcore.HierarchicalKey;
var PrivateKey = require('./PrivateKey');
var HDPath = require('./HDPath');
var HDParams = require('./HDParams');
var Address = bitcore.Address;
var Script = bitcore.Script;

function PublicKeyRing(opts) {
  opts = opts || {};

  this.walletId = opts.walletId;

  this.network = opts.networkName === 'livenet' ?
    bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.copayersHK = opts.copayersHK || [];

  this.indexes = opts.indexes ? HDParams.fromList(opts.indexes) : HDParams.init(this.totalCopayers);

  this.publicKeysCache = opts.publicKeysCache || {};
  this.nicknameFor = opts.nicknameFor || {};
  this.copayerIds = [];
  this.copayersBackup = opts.copayersBackup || [];
  this.addressToPath = {};
}

PublicKeyRing.fromObj = function(data) {
  if (data instanceof PublicKeyRing) {
    throw new Error('bad data format: Did you use .toObj()?');
  }

  // Support old indexes schema
  if (!Array.isArray(data.indexes)) {
    data.indexes = HDParams.update(data.indexes, data.totalCopayers);
  }

  var ret = new PublicKeyRing(data);

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
    indexes: HDParams.serialize(this.indexes),
    copayersBackup: this.copayersBackup,

    copayersExtPubKeys: this.copayersHK.map(function(b) {
      return b.extendedPublicKeyString();
    }),
    nicknameFor: this.nicknameFor,
    publicKeysCache: this.publicKeysCache
  };
};

PublicKeyRing.prototype.getCopayerId = function(i) {
  preconditions.checkArgument(typeof i !== 'undefined');
  return this.copayerIds[i];
};

PublicKeyRing.prototype.registeredCopayers = function() {
  return this.copayersHK.length;
};

PublicKeyRing.prototype.isComplete = function() {
  return this.remainingCopayers() == 0;
};

PublicKeyRing.prototype.remainingCopayers = function() {
  return this.totalCopayers - this.registeredCopayers();
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

PublicKeyRing.prototype._newExtendedPublicKey = function() {
  return new PrivateKey({
    networkName: this.network.name
  })
  .deriveBIP45Branch()
  .extendedPublicKeyString();
};

PublicKeyRing.prototype._updateBip = function(index) {
  var hk = this.copayersHK[index].derive(HDPath.IdBranch);
  this.copayerIds[index] = hk.eckey.public.toString('hex');
};

PublicKeyRing.prototype._setNicknameForIndex = function(index, nickname) {
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

  this.copayersHK.forEach(function(b) {
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

PublicKeyRing.prototype.getPubKeys = function(index, isChange, copayerIndex) {
  this._checkKeys();

  var path = HDPath.Branch(index, isChange, copayerIndex);
  var pubKeys = this.publicKeysCache[path];
  if (!pubKeys) {
    pubKeys = [];
    var l = this.copayersHK.length;
    for (var i = 0; i < l; i++) {
      var hk = this.copayersHK[i].derive(path);
      pubKeys[i] = hk.eckey.public;
    }
    this.publicKeysCache[path] = pubKeys.map(function(pk) {
      return pk.toString('hex');
    });
  } else {
    pubKeys = pubKeys.map(function(s) {
      return new Buffer(s, 'hex');
    });
  }


  return pubKeys;
};

// TODO this could be cached
PublicKeyRing.prototype.getRedeemScript = function(index, isChange, copayerIndex) {
  var pubKeys = this.getPubKeys(index, isChange, copayerIndex);
  var script = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};

// TODO this could be cached
PublicKeyRing.prototype.getAddress = function(index, isChange, id) {
  var copayerIndex = this.getCosigner(id);
  var script = this.getRedeemScript(index, isChange, copayerIndex);
  var address = Address.fromScript(script, this.network.name);
  this.addressToPath[address.toString()] = HDPath.FullBranch(index, isChange, copayerIndex);
  return address;
};

// Overloaded to receive a PubkeyString or a consigner index
PublicKeyRing.prototype.getHDParams = function(id) {
  var copayerIndex = this.getCosigner(id);
  var index = this.indexes.filter(function(i) {
    return i.copayerIndex == copayerIndex
  });
  if (index.length != 1) throw new Error('no index for copayerIndex');

  return index[0];
};

PublicKeyRing.prototype.pathForAddress = function(address) {
  var path = this.addressToPath[address];
  if (!path) throw new Error('Couldn\'t find path for address ' + address);
  return path;
};

// TODO this could be cached
PublicKeyRing.prototype.getScriptPubKeyHex = function(index, isChange, pubkey) {
  var copayerIndex = this.getCosigner(pubkey);
  var addr = this.getAddress(index, isChange, copayerIndex);
  return Script.createP2SH(addr.payload()).getBuffer().toString('hex');
};

//generate a new address, update index.
PublicKeyRing.prototype.generateAddress = function(isChange, pubkey) {
  isChange = !!isChange;
  var HDParams = this.getHDParams(pubkey);
  var index = isChange ? HDParams.getChangeIndex() : HDParams.getReceiveIndex();
  var ret = this.getAddress(index, isChange, HDParams.copayerIndex);
  HDParams.increment(isChange);
  return ret;
};

PublicKeyRing.prototype.getAddresses = function(opts) {
  return this.getAddressesInfo(opts).map(function(info) {
    return info.address;
  });
};

PublicKeyRing.prototype.getCosigner = function(pubKey) {
  if (typeof pubKey == 'undefined') return HDPath.SHARED_INDEX;
  if (typeof pubKey == 'number') return pubKey;

  var sorted = this.copayersHK.map(function(h, i) {
    return h.eckey.public.toString('hex');
  }).sort(function(h1, h2) {
    return h1.localeCompare(h2);
  });

  var index = sorted.indexOf(pubKey);
  if (index == -1) throw new Error('no public key in ring');

  return index;
}


PublicKeyRing.prototype.getAddressesInfo = function(opts, pubkey) {
  var ret = [];
  var self = this;
  var copayerIndex = pubkey && this.getCosigner(pubkey);
  this.indexes.forEach(function(index) {
    ret = ret.concat(self.getAddressesInfoForIndex(index, opts, copayerIndex));
  });
  return ret;
}

PublicKeyRing.prototype.getAddressesInfoForIndex = function(index, opts, copayerIndex) {
  opts = opts || {};

  var isOwned = index.copayerIndex == HDPath.SHARED_INDEX || index.copayerIndex == copayerIndex;

  var ret = [];
  if (!opts.excludeChange) {
    for (var i = 0; i < index.changeIndex; i++) {
      var a = this.getAddress(i, true, index.copayerIndex);
      ret.unshift({
        address: a,
        addressStr: a.toString(),
        isChange: true,
        owned: isOwned
      });
    }
  }

  if (!opts.excludeMain) {
    for (var i = 0; i < index.receiveIndex; i++) {
      var a = this.getAddress(i, false, index.copayerIndex);
      ret.unshift({
        address: a,
        addressStr: a.toString(),
        isChange: false,
        owned: isOwned
      });
    }
  }

  return ret;
};

PublicKeyRing.prototype.getForPaths = function(paths) {
  return paths.map(this.getForPath.bind(this));
};

PublicKeyRing.prototype.getForPath = function(path) {
  var p = HDPath.indexesForPath(path);
  var pubKeys = this.getPubKeys(p.addressIndex, p.isChange, p.copayerIndex);
  return pubKeys;
};


// TODO this could be cached
PublicKeyRing.prototype._addScriptMap = function(map, path) {
  var p = HDPath.indexesForPath(path);
  var script = this.getRedeemScript(p.addressIndex, p.isChange, p.copayerIndex);
  map[Address.fromScript(script, this.network.name).toString()] = script.getBuffer().toString('hex');
};

PublicKeyRing.prototype.getRedeemScriptMap = function(paths) {
  var ret = {};
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    this._addScriptMap(ret, path);
  }
  return ret;
};

PublicKeyRing.prototype._checkInPKR = function(inPKR, ignoreId) {

  if (!ignoreId && this.walletId !== inPKR.walletId) {
    throw new Error('inPKR walletId mismatch');
  }

  if (this.network.name !== inPKR.network.name) {
    throw new Error('Network mismatch. Should be ' + this.network.name +
                    ' and found ' + inPKR.network.name);
  }

  if (
    this.requiredCopayers && inPKR.requiredCopayers &&
      (this.requiredCopayers !== inPKR.requiredCopayers))
        throw new Error('inPKR requiredCopayers mismatch ' + this.requiredCopayers + '!=' + inPKR.requiredCopayers);

      if (
        this.totalCopayers && inPKR.totalCopayers &&
          (this.totalCopayers !== inPKR.totalCopayers))
            throw new Error('inPKR totalCopayers mismatch' + this.totalCopayers + '!=' + inPKR.requiredCopayers);
};


PublicKeyRing.prototype._mergePubkeys = function(inPKR) {
  var self = this;
  var hasChanged = false;
  var l = self.copayersHK.length;
  if (self.isComplete())
    return;

  inPKR.copayersHK.forEach(function(b) {
    var haveIt = false;
    var epk = b.extendedPublicKeyString();
    for (var j = 0; j < l; j++) {
      if (self.copayersHK[j].extendedPublicKeyString() === epk) {
        haveIt = true;
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
        self._setNicknameForIndex(l2, inPKR.nicknameFor[self.getCopayerId(l2)]);
      hasChanged = true;
    }
  });
  return hasChanged;
};

PublicKeyRing.prototype.setBackupReady = function(copayerId) {
  if (this.isBackupReady()) return false;

  var cid = this.myCopayerId();
  this.copayersBackup.push(cid);
  return true;
}

PublicKeyRing.prototype.isBackupReady = function(copayerId) {
  var cid = copayerId || this.myCopayerId();
  return this.copayersBackup.indexOf(cid) != -1;
}

PublicKeyRing.prototype.isFullyBackup = function(copayerId) {
  return this.remainingBackups() == 0;
}

PublicKeyRing.prototype.remainingBackups = function() {
  return this.totalCopayers - this.copayersBackup.length;
};

PublicKeyRing.prototype.merge = function(inPKR, ignoreId) {
  this._checkInPKR(inPKR, ignoreId);

  var hasChanged = false;
  hasChanged |= this.mergeIndexes(inPKR.indexes);
  hasChanged |= this._mergePubkeys(inPKR);
  hasChanged |= this.mergeBackups(inPKR.copayersBackup);

  return !!hasChanged;
};

PublicKeyRing.prototype.mergeIndexes = function(indexes) {
  var self = this;
  var hasChanged = false;

  indexes.forEach(function(theirs) {
    var mine = self.getHDParams(theirs.copayerIndex);
    hasChanged |= mine.merge(theirs);
  });

  return !!hasChanged
}

PublicKeyRing.prototype.mergeBackups = function(backups) {
  var self = this;
  var hasChanged = false;

  backups.forEach(function(cid) {
    var isNew = self.copayersBackup.indexOf(cid) == -1;
    if (isNew) self.copayersBackup.push(cid);
    hasChanged |= isNew;
  });

  return !!hasChanged
}


module.exports = PublicKeyRing;
