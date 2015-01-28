'use strict';

var preconditions = require('preconditions').instance();
var _ = require('lodash');
var log = require('../util/log');
var bitcore = require('bitcore');
var HK = bitcore.HierarchicalKey;
var Address = bitcore.Address;
var Script = bitcore.Script;
var PrivateKey = require('./PrivateKey');
var HDPath = require('./HDPath');
var HDParams = require('./HDParams');

/**
 * @desc Represents a public key ring, the set of all public keys and the used indexes
 *
 * @constructor
 * @param {Object} opts
 * @param {string} opts.walletId
 * @param {string} opts.network 'livenet' to signal the bitcoin main network, all others are testnet
 * @param {number=} opts.requiredCopayers - defaults to 3
 * @param {number=} opts.totalCopayers - defaults to 5
 * @param {Object[]} [opts.indexes] - an array to be deserialized using {@link HDParams#fromList}
 *                                   (defaults to all indexes in zero)
 * @param {Object=} opts.nicknameFor - nicknames for other copayers
 */
function PublicKeyRing(opts) {
  opts = opts || {};

  this.walletId = opts.walletId;

  this.network = opts.networkName === 'livenet' ?
    bitcore.networks.livenet : bitcore.networks.testnet;

  this.requiredCopayers = opts.requiredCopayers || 3;
  this.totalCopayers = opts.totalCopayers || 5;

  this.copayersHK = [];

  this.indexes = opts.indexes ? HDParams.fromList(opts.indexes) : HDParams.init(this.totalCopayers);

  this.publicKeysCache = {};
  this.nicknameFor = opts.nicknameFor || {};
  this.copayerIds = [];

  this.resetCache();
};

PublicKeyRing.prototype.resetCache = function() {
  this.cache = {};
  this.cache.addressToPath = {};
  this.cache.pathToAddress = {};

  // Non persistent cache
  this._isChange = {};
};


/**
 * @desc Returns an object with only the keys needed to rebuild a PublicKeyRing
 *
 * @TODO: Figure out if this is the correct pattern
 * This is a static method and is probably used for serialization.
 *
 * @static
 * @param {Object} data
 * @param {string} data.walletId - a string to identify a wallet
 * @param {string} data.networkName - the name of the bitcoin network
 * @param {number} data.requiredCopayers - the number of required copayers
 * @param {number} data.totalCopayers - the number of copayers in the ring
 * @param {Object[]} data.indexes - an array of objects that can be turned into
 *                                  an array of HDParams
 * @param {Object} data.nicknameFor - a registry of nicknames for other copayers
 * @param {string[]} data.copayersExtPubKeys - the extended public keys of copayers
 * @returns {Object} a trimmed down version of PublicKeyRing that can be used
 *                   as a parameter
 */
PublicKeyRing.trim = function(data) {
  preconditions.checkArgument(data);
  var opts = {};
  ['walletId', 'networkName', 'requiredCopayers', 'totalCopayers',
    'indexes', 'nicknameFor', 'copayersExtPubKeys'
  ].forEach(function(k) {
    opts[k] = data[k];
  });
  return opts;
};

/**
 * @desc Deserializes a PublicKeyRing from a plain object
 *
 * If the <tt>data</tt> parameter is an instance of PublicKeyRing already,
 * it will fail, throwing an assertion error.
 *
 * @static
 * @param {object} data - a serialized version of PublicKeyRing {@see PublicKeyRing#trim}
 * @return {PublicKeyRing} - the deserialized object
 */
PublicKeyRing.fromObj = function(opts) {
  preconditions.checkArgument(!(opts instanceof PublicKeyRing), 'bad opts format: Did you use .toObj()?');

  // Support old indexes schema
  if (!Array.isArray(opts.indexes)) {
    opts.indexes = HDParams.update(opts.indexes, opts.totalCopayers);
  }

  var pkr = new PublicKeyRing(opts);

  for (var k in opts.copayersExtPubKeys) {
    pkr.addCopayer(opts.copayersExtPubKeys[k]);
  }

  if (opts.cache && opts.cache.addressToPath) {
    log.debug('PublicKeyRing: Using address cache');
    pkr.cache.addressToPath = opts.cache.addressToPath;
    pkr.rebuildCache();
  }

  return pkr;
};


PublicKeyRing.prototype.rebuildCache = function() {
  if (!this.cache.addressToPath)
    return;

  var self = this;
  _.each(this.cache.addressToPath, function(path, address) {
    self.cache.pathToAddress[path] = address;
  });
};

PublicKeyRing.fromUntrustedObj = function(opts) {
  return PublicKeyRing.fromObj(PublicKeyRing.trim(opts));
};

/**
 * @desc Serialize this object to a plain object with all the data needed to
 * rebuild it
 *
 * @return {Object} a serialized version of a PublicKeyRing
 */
PublicKeyRing.prototype.toObj = function() {
  return {
    walletId: this.walletId,
    networkName: this.network.name,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,
    indexes: HDParams.serialize(this.indexes),

    copayersExtPubKeys: this.copayersHK.map(function(b) {
      return b.extendedPublicKeyString();
    }),
    nicknameFor: this.nicknameFor,

    // We only store addressToPath and derive the reset from it
    cache: {
      addressToPath: this.cache.addressToPath
    },
  };
};


PublicKeyRing.prototype.toTrimmedObj = function() {
  return PublicKeyRing.trim(this.toObj());
}


/**
 * @desc
 * Retrieve a copayer's public key as a hexadecimal encoded string
 *
 * @param {number} copayerId - the copayer id
 * @returns {string} the extended public key of the i-th copayer
 */
PublicKeyRing.prototype.getCopayerId = function(copayerId) {
  preconditions.checkArgument(!_.isUndefined(copayerId))
  preconditions.checkArgument(_.isNumber(copayerId));

  return this.copayerIds[copayerId];
};

/**
 * @desc
 * Get the amount of registered copayers in this PubKeyRing
 *
 * @returns {number} amount of copayers present
 */
PublicKeyRing.prototype.registeredCopayers = function() {
  return this.copayersHK.length;
};

/**
 * @desc
 * Returns true if all the needed copayers have joined the public key ring
 *
 * @returns {boolean}
 */
PublicKeyRing.prototype.isComplete = function() {
  return this.remainingCopayers() == 0;
};

/**
 * @desc
 * Returns the number of copayers yet to join to make the public key ring complete
 *
 * @returns {number}
 */
PublicKeyRing.prototype.remainingCopayers = function() {
  return this.totalCopayers - this.registeredCopayers();
};

/**
 * @desc
 * Returns an array of copayer's public keys
 *
 * @returns {string[]} a list of hexadecimal strings with the public keys for
 *                     the copayers in this ring
 */
PublicKeyRing.prototype.getAllCopayerIds = function() {
  return this.copayerIds;
};

/**
 * @desc
 * Gets the current user's copayerId
 *
 * @returns {string} the extended public key hexadecimal-encoded
 */
PublicKeyRing.prototype.myCopayerId = function() {
  return this.getCopayerId(0);
};

/**
 * @desc Throws an error if the public key ring isn't complete
 */
PublicKeyRing.prototype._checkKeys = function() {
  if (!this.isComplete()) throw new Error('dont have required keys yet');
};

/**
 * @desc
 * Updates the internal register of the public hex string for a copayer, based
 * on the value of the hierarchical key stored in copayersHK
 *
 * @private
 * @param {number} index - the index of the copayer to update
 */
PublicKeyRing.prototype._updateBip = function(index) {
  var hk = this.copayersHK[index].derive(HDPath.IdBranch);
  this.copayerIds[index] = hk.eckey.public.toString('hex');
};

/**
 * @desc
 * Sets a nickname for one of the copayers
 *
 * @private
 * @param {number} index - the index of the copayer to update
 * @param {string} nickname - the new nickname for that copayer
 */
PublicKeyRing.prototype._setNicknameForIndex = function(index, nickname) {
  this.nicknameFor[this.copayerIds[index]] = nickname;
};

/**
 * @desc
 * Fetch the name of a copayer
 *
 * @param {number} index - the index of the copayer
 * @return {string} the nickname of the index-th copayer
 */
PublicKeyRing.prototype.nicknameForIndex = function(index) {
  return this.nicknameFor[this.copayerIds[index]];
};

/**
 * @desc
 * Fetch the name of a copayer using its public key
 *
 * @param {string} copayerId - the public key ring of a copayer, hex encoded
 * @return {string} the nickname of the copayer with such pubkey
 */
PublicKeyRing.prototype.nicknameForCopayer = function(copayerId) {
  return this.nicknameFor[copayerId] || 'NN';
};

/**
 * @desc
 * Add a copayer into the public key ring.
 *
 * @param {string} newHexaExtendedPublicKey - an hex encoded string with the copayer's pubkey
 * @param {string} nickname - a nickname for this copayer
 * @return {string} the newHexaExtendedPublicKey parameter
 */
PublicKeyRing.prototype.addCopayer = function(newHexaExtendedPublicKey, nickname) {
  preconditions.checkArgument(newHexaExtendedPublicKey && _.isString(newHexaExtendedPublicKey));
  preconditions.checkArgument(!this.isComplete());
  preconditions.checkArgument(!nickname || _.isString(nickname));
  preconditions.checkArgument(!_.any(this.copayersHK,
    function(copayer) {
      return copayer.extendedPublicKeyString === newHexaExtendedPublicKey;
    }
  ));

  var newCopayerIndex = this.copayersHK.length;
  var hierarchicalKey = new HK(newHexaExtendedPublicKey);

  this.copayersHK.push(hierarchicalKey);
  this._updateBip(newCopayerIndex);

  if (nickname) {
    this._setNicknameForIndex(newCopayerIndex, nickname);
  }
  return newHexaExtendedPublicKey;
};

/**
 * @desc
 * Get all the public keys for the copayers in this ring, for a given branch of Copay
 *
 * @param {number} index - the index for the shared address
 * @param {boolean} isChange - whether to derive a change address o receive address
 * @param {number} copayerIndex - the index of the copayer that requested the derivation
 * @return {Buffer[]} an array of derived public keys in hexa format
 */
PublicKeyRing.prototype.getPubKeys = function(index, isChange, copayerIndex) {
  this._checkKeys();

  log.warn('Slow pubkey derivation...');
  var path = HDPath.Branch(index, isChange, copayerIndex);
  var pubKeys = _.map(this.copayersHK, function(hdKey) {
    return hdKey.derive(path).eckey.public;
  });

  return pubKeys;
};

/**
 * @desc
 * Generate a new Script for a copay address generated by index, isChange, and copayerIndex
 *
 * @TODO this could be cached
 *
 * @param {number} index - the index for the shared address
 * @param {boolean} isChange - whether to derive a change address o receive address
 * @param {number} copayerIndex - the index of the copayer that requested the derivation
 * @returns {bitcore.Script}
 */
PublicKeyRing.prototype.getRedeemScript = function(index, isChange, copayerIndex) {
  var pubKeys = this.getPubKeys(index, isChange, copayerIndex);
  var script = Script.createMultisig(this.requiredCopayers, pubKeys);
  return script;
};



/**
 * @desc
 * Get the address for a multisig based on the given params.
 *
 * Caches the address to the branch in the member addressToPath
 *
 * @param {number} index - the index for the shared address
 * @param {boolean} isChange - whether to derive a change address o receive address
 * @param {number} copayerIndex - the index of the copayer that requested the derivation
 * @returns {bitcore.Address}
 */
PublicKeyRing.prototype._getAddress = function(index, isChange, id) {
  var copayerIndex = this.getCosigner(id);
  var path = HDPath.FullBranch(index, isChange, copayerIndex);
  if (this.cache.pathToAddress[path])
    return this.cache.pathToAddress[path];

  log.info('Generating Address:', index, isChange, copayerIndex);
  var script = this.getRedeemScript(index, isChange, copayerIndex);
  var address = Address.fromScript(script, this.network.name).toString();

  this._cacheAddress(address, path, isChange);
  return address;
};

PublicKeyRing.prototype._cacheAddress = function(address, path, isChange) {
  this.cache.addressToPath[address] = path;
  this.cache.pathToAddress[path] = address;
};

/**
 * @desc
 * Get the parameters used to derive a pubkey or a cosigner index
 *
 * Overloaded to receive a PubkeyString or a consigner index
 *
 * @param {number|string} id public key in hex format, or the copayer's index
 * @return ????
 */
PublicKeyRing.prototype.getHDParams = function(id) {
  var copayerIndex = this.getCosigner(id);
  var index = this.indexes.filter(function(i) {
    return i.copayerIndex == copayerIndex
  });
  if (index.length != 1) throw new Error('no index for copayerIndex');

  return index[0];
};

/**
 * @desc
 * Get the path used to derive a pubkey or a cosigner index for an address
 *
 * @param {string} address a multisig p2sh address
 * @return {HDPath}
 */
PublicKeyRing.prototype.pathForAddress = function(address) {
  this._checkCache();
  var path = this.cache.addressToPath[address];
  if (!path) throw new Error('Couldn\'t find path for address ' + address);
  return path;
};

/**
 * @desc
 * Generates a new address and updates the last index used
 *
 * @param {truthy} isChange - generate a change address if true, otherwise
 *                             generates a receive
 * @param {number|string} pubkey - the pubkey for the copayer that generates the
 *                                 address (or index in the keyring)
 * @returns {bitpay.Address}
 */
PublicKeyRing.prototype.generateAddress = function(isChange, pubkey) {
  isChange = !!isChange;
  var hdParams = this.getHDParams(pubkey);
  var index = isChange ? hdParams.getChangeIndex() : hdParams.getReceiveIndex();
  var ret = this._getAddress(index, isChange, hdParams.copayerIndex);
  hdParams.increment(isChange);
  return ret;
};

/**
 * @desc Is an address is from this wallet?
 *
 * @param {string} address
 * @return {boolean}
 */
PublicKeyRing.prototype.addressIsOwn = function(address) {
  return !!this.cache.addressToPath[address];
};

/**
 * @desc Is an address is a change address?
 *
 * @param {string} address
 * @return {boolean}
 */
PublicKeyRing.prototype.addressIsChange = function(address) {
  this._checkCache();

  var path = this.cache.addressToPath[address];
  if (!path)
    return null;

  var p = HDPath.indexesForPath(path);

  //Memoization Only, never stored.
  this._isChange[address] = p.isChange;
  return !!this._isChange[address];
};


/**
 * @desc
 * Maps a copayer's public key to his index in the keyring
 *
 * @param {number|string|undefined} pubKey - if undefined, returns the SHARED_INDEX
 *                                         - if a number, just return it
 *                                         - if a string, assume is the hex encoded public key
 * @returns {number} the index of the copayer with the given pubkey
 */
PublicKeyRing.prototype.getCosigner = function(pubKey) {
  if (_.isUndefined(pubKey)) return HDPath.SHARED_INDEX;
  if (_.isNumber(pubKey)) return pubKey;

  var sorted = this.copayersHK.map(function(h, i) {
    return h.eckey.public.toString('hex');
  }).sort(function(h1, h2) {
    return h1.localeCompare(h2);
  });

  var index = sorted.indexOf(pubKey);
  if (index == -1) throw new Error('public key is not on the ring');

  return index;
};



PublicKeyRing.prototype.buildAddressCache = function() {
  var ret = [];
  var self = this;

  _.each(this.indexes, function(index) {
    for (var i = 0; i < index.receiveIndex; i++) {
      self._getAddress(i, false, index.copayerIndex);
    }
    for (var i = 0; i < index.changeIndex; i++) {
      self._getAddress(i, true, index.copayerIndex);
    }
  });
};


PublicKeyRing.prototype.size = function(opts) {
  var self = this;
  return _.reduce(this.indexes, function(sum, index) {
    return sum + index.receiveIndex + index.changeIndex
  }, 0);
};

PublicKeyRing.prototype._checkCache = function(opts) {
  if (_.isEmpty(this.cache.addressToPath)) {
    this.buildAddressCache();
  }
  if (_.size(this.cache.addressToPath) !== this.size()) {
    this.buildAddressCache();
  }
};


/**
 * @desc
 * Gets information about addresses for a copayer
 *
 * @param {Object} opts
 * @returns {AddressInfo[]}
 */
PublicKeyRing.prototype.getAddresses = function() {
  this._checkCache();
  return _.keys(this.cache.addressToPath);
};

/**
 * getAddressesOrdered
 *  {@link Wallet#getAddressesOrdered}
 *
 * @param pubkey
 * @return {string[]}
 */
PublicKeyRing.prototype.getAddressesOrdered = function(pubkey) {
  this._checkCache();

  var info = _.map(this.cache.addressToPath, function(path, addr) {
    var p = HDPath.indexesForPath(path);
    p.address = addr;
    return p;
  });

  var copayerIndex = this.getCosigner(pubkey);
  var l = info.length;

  var sortedInfo = _.sortBy(info, function(i) {
    var goodness = ((i.copayerIndex !== copayerIndex) ? 2 * l : 0) + (i.isChange ? l : 0) + l - i.addressIndex;
    return goodness;
  });

  return _.pluck(sortedInfo, 'address');
};



/**
 * @desc
 * Gets information about addresses for a copayer
 *
 * @param {Object} opts
 * @returns {AddressInfo[]}
 */
PublicKeyRing.prototype.getReceiveAddresses = function() {
  this._checkCache();

  var self = this;
  return _.filter(this.getAddresses(), function(addr) {
    return !self.addressIsChange(addr);
  });
};



/**
 * @desc
 * Retrieve the public keys for all cosigners for a given path
 *
 * @param {string} path - the BIP32 path
 * @return {Buffer[]} the public keys, in buffer format
 */
PublicKeyRing.prototype._getForPath = function(path) {
  var p = HDPath.indexesForPath(path);
  return this.getPubKeys(p.addressIndex, p.isChange, p.copayerIndex);
};


/**
 * @desc
 * Retrieve the public keys for derived addresses and the public keys for copayers
 *
 * @TODO: Should this exist? A user should just call _getForPath(paths)
 *
 * @param {string[]} paths - the paths to be derived
 * @return {Object} with keys pubKeys and copayerIds
 */
PublicKeyRing.prototype.forPaths = function(paths) {
  return {
    pubKeys: paths.map(this._getForPath.bind(this)),
    copayerIds: this.copayerIds,
  }
};

/**
 * @desc
 * Retrieve the public keys for all cosigners for multiple paths
 *
 * @param {string[]} paths - the BIP32 paths
 * @return {Array[]} the public keys, in buffer format (matrix of Buffer, Buffer[][])
 */
PublicKeyRing.prototype._getForPaths = function(paths) {
  preconditions.checkArgument(!_.isUndefined(paths));
  preconditions.checkArgument(_.isArray(paths));
  preconditions.checkArgument(_.all(paths, _.isString));

  return paths.map(this._getForPath.bind(this));
};

/**
 * @desc
 * Returns a map from a pubkey of an address to the id that generated it
 *
 * @param {string[]} pubkeys - the pubkeys to query
 * @param {string[]} paths - the paths to query
 */
PublicKeyRing.prototype.copayersForPubkeys = function(pubkeys, paths) {
  preconditions.checkArgument(pubkeys);
  preconditions.checkArgument(paths);

  var inKeyMap = {},
    ret = {};
  for (var i in pubkeys) {
    inKeyMap[pubkeys[i]] = 1;
  };

  var keys = this._getForPaths(paths);
  for (var i in keys) {
    for (var copayerIndex in keys[i]) {
      var kHex = keys[i][copayerIndex].toString('hex');
      if (inKeyMap[kHex]) {
        ret[kHex] = this.copayerIds[copayerIndex];
        delete inKeyMap[kHex];
      }
    }
  }

  if (_.size(inKeyMap)) {
    for (var i in inKeyMap) {
      log.error('Pubkey ' + i + ' not identified');
    }
    throw new Error('Pubkeys not identified');
  }

  return ret;
};

/**
 * @desc
 * Returns a map from address -> public key needed
 *
 * @param {HDPath[]} paths - paths to be solved
 * @returns {Object} a map from addresses to Buffer with the hex pubkeys
 */
PublicKeyRing.prototype.getRedeemScriptMap = function(paths) {
  var ret = {};
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var p = HDPath.indexesForPath(path);
    var script = this.getRedeemScript(p.addressIndex, p.isChange, p.copayerIndex);
    ret[Address.fromScript(script, this.network.name).toString()] = script.getBuffer().toString('hex');
  }
  return ret;
};

/**
 * @desc
 * Check if another PubKeyRing is similar to this one (checks network name,
 * requiredCopayers, and totalCopayers). If ignoreId is falsy, also check that
 * both walletIds match.
 *
 * @private
 * @param {PubKeyRing} inPKR - the other PubKeyRing
 * @param {boolean} ignoreId - whether to ignore checking for equal walletId
 * @throws {Error} if the wallets mismatch
 * @return true
 */

PublicKeyRing.prototype._checkInPKR = function(inPKR, ignoreId) {
  preconditions.checkArgument(_.isObject(inPKR));

  if (!ignoreId && this.walletId !== inPKR.walletId)
    throw new Error('inPKR walletId mismatch');

  if (this.network.name !== inPKR.network.name)
    throw new Error('Network mismatch. Should be ' + this.network.name +
      ' and found ' + inPKR.network.name);

  if (this.requiredCopayers && inPKR.requiredCopayers &&
    (this.requiredCopayers !== inPKR.requiredCopayers))
    throw new Error('inPKR requiredCopayers mismatch ' + this.requiredCopayers +
      '!=' + inPKR.requiredCopayers);

  if (this.totalCopayers && inPKR.totalCopayers &&
    this.totalCopayers !== inPKR.totalCopayers)
    throw new Error('inPKR totalCopayers mismatch' + this.totalCopayers +
      '!=' + inPKR.requiredCopayers);

  return true;
};

/**
 * @desc
 * Merges the public keys of the wallet passed in as a parameter with ours.
 *
 * @param {PublicKeyRing} inPKR
 * @return {boolean} true if there where changes in our internal state
 */
PublicKeyRing.prototype._mergePubkeys = function(inPKR) {
  var self = this;
  var hasChanged = false;

  if (self.isComplete())
    return;

  inPKR.copayersHK.forEach(function(b) {
    var epk = b.extendedPublicKeyString();
    var haveIt = _.any(self.copayersHK, function(hk) {
      return hk.extendedPublicKeyString() === epk;
    });

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


/**
 * @desc
 * Merges the indexes for addresses generated with another copy of a list of
 * HDParams
 *
 * @param {HDParams[]} indexes - indexes as received from another sources
 * @return {boolean} true if the internal state has changed
 */
PublicKeyRing.prototype.mergeIndexes = function(indexes) {
  var self = this;
  var hasChanged = false;

  indexes.forEach(function(theirs) {
    var mine = self.getHDParams(theirs.copayerIndex);
    hasChanged |= mine.merge(theirs);
  });

  return !!hasChanged
}


/**
 * @desc
 * Merges this public key ring with another one, optionally ignoring the
 * wallet id
 *
 * @param {PublicKeyRing} inPkr
 * @param {boolean} ignoreId
 * @return {boolean} true if the internal state has changed
 */
PublicKeyRing.prototype.merge = function(inPKR, ignoreId) {

  this._checkInPKR(inPKR, ignoreId);
  var hasChanged = false;
  hasChanged |= this.mergeIndexes(inPKR.indexes);
  hasChanged |= this._mergePubkeys(inPKR);

  return !!hasChanged;
};



module.exports = PublicKeyRing;
