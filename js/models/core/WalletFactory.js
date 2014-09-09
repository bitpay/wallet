'use strict';

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');
var _ = require('underscore');
var log = require('../../log');
var Async = module.exports.Async = require('../network/Async');
var Insight = module.exports.Insight = require('../blockchain/Insight');
var StorageLocalEncrypted = module.exports.StorageLocalEncrypted = require('../storage/LocalEncrypted');

/**
 * @desc
 * WalletFactory - stores the state for a wallet in creation
 *
 * @param {Object} config - configuration for this wallet
 *
 * @TODO: Don't pass a class for these three components
 *        -- send a factory or instance, the 'new' call considered harmful for refactoring
 *        -- arguable, since all of them is called with an object as argument.
 *        -- Still, could it be hard to refactor? (for example, what if we want to fail hard if a network call gets interrupted?)
 * @param {Storage} config.Storage - the class to instantiate to store the wallet (StorageLocalEncrypted by default)
 * @param {Object} config.storage - the configuration to be sent to the Storage constructor
 * @param {Network} config.Network - the class to instantiate to make network requests to copayers (the Async module by default)
 * @param {Object} config.network - the configuration to be sent to the Network constructor
 * @param {Blockchain} config.Blockchain - the class to instantiate to get information about the blockchain (Insight by default)
 * @param {Object} config.blockchain - the configuration to be sent to the Blockchain constructor
 * @param {string} config.networkName - the name of the bitcoin network to use ('testnet' or 'livenet')
 * @TODO: Investigate what parameters go inside this object
 * @param {Object} config.wallet - default configuration for the wallet
 * @TODO: put `version` inside of the config object
 * @param {string} version - the version of copay for which this wallet was generated (for example, 0.4.7)
 */
function WalletFactory(config, version) {
  var self = this;
  config = config || {};

  this.Storage = config.Storage || StorageLocalEncrypted;
  this.Network = config.Network || Async;
  this.Blockchain = config.Blockchain || Insight;

  this.storage = new this.Storage(config.storage);
  this.network = new this.Network(config.network);
  this.blockchain = new this.Blockchain(config.blockchain);

  this.networkName = config.networkName;
  this.walletDefaults = config.wallet;
  this.version = version;
};

/**
 * @desc
 * Returns true if the storage instance can retrieve the following keys using a given walletId
 * <ul>
 * <li><tt>publicKeyRing</tt></li>
 * <li><tt>txProposals</tt></li>
 * <li><tt>opts</tt></li>
 * <li><tt>privateKey</tt></li>
 * </ul>
 * @param {string} walletId
 * @return {boolean} true if all the keys are present in the storage instance
 */
WalletFactory.prototype._checkRead = function(walletId) {
  var s = this.storage;
  var ret =
    s.get(walletId, 'publicKeyRing') &&
    s.get(walletId, 'txProposals') &&
    s.get(walletId, 'opts') &&
    s.get(walletId, 'privateKey');
  return !!ret;
};

/**
 * @desc Deserialize an object to a Wallet
 * @param {Object} obj
 * @param {string[]} skipFields - fields to skip when importing
 * @return {Wallet}
 */
WalletFactory.prototype.fromObj = function(obj, skipFields) {

  // not stored options
  obj.opts.reconnectDelay = this.walletDefaults.reconnectDelay;

  // this is only used if private key or public key ring is skipped
  obj.opts.networkName    = this.networkName;

  skipFields = skipFields || [];
  skipFields.forEach(function(k){
    if (obj[k]) {
      delete obj[k];
    } else 
      throw new Error('unknown field:' + k);
  });

  var w = Wallet.fromObj(obj, this.storage, this.network, this.blockchain);
  if (!w) return false;
  w.verbose = this.verbose;
  this._checkVersion(w.version);
  this._checkNetwork(w.getNetworkName());
  return w;
};

/**
 * @desc Imports a wallet from an encrypted base64 object
 * @param {string} base64 - the base64 encoded object
 * @param {string} password - password to decrypt it
 * @param {string[]} skipFields - fields to ignore when importing
 * @return {Wallet}
 */
WalletFactory.prototype.fromEncryptedObj = function(base64, password, skipFields) {
  this.storage._setPassphrase(password);
  var walletObj = this.storage.import(base64);
  if (!walletObj) return false;
  var w = this.fromObj(walletObj, skipFields);
  return w;
};

/**
 * @TODO: import is a reserved keyword! DONT USE IT
 * @TODO: this is essentialy the same method as {@link WalletFactory#fromEncryptedObj}!
 * @desc Imports a wallet from an encrypted base64 object
 * @param {string} base64 - the base64 encoded object
 * @param {string} password - password to decrypt it
 * @param {string[]} skipFields - fields to ignore when importing
 * @return {Wallet}
 */
WalletFactory.prototype.import = function(base64, password, skipFields) {
  var self = this;
  var w = self.fromEncryptedObj(base64, password, skipFields);

  if (!w) throw new Error('Wrong password');
  return w;
};

/**
 * @desc Retrieve a wallet from storage
 * @param {string} walletId - the wallet id
 * @param {string[]} skipFields - parameters to ignore when importing
 * @return {Wallet}
 */
WalletFactory.prototype.read = function(walletId, skipFields) {
  if (!this._checkRead(walletId))
    return false;

  var obj = {};
  var s = this.storage;

  obj.id = walletId;
  obj.opts = s.get(walletId, 'opts');
  obj.publicKeyRing = s.get(walletId, 'publicKeyRing');
  obj.txProposals = s.get(walletId, 'txProposals');
  obj.privateKey = s.get(walletId, 'privateKey');
  obj.addressBook = s.get(walletId, 'addressBook');
  obj.backupOffered = s.get(walletId, 'backupOffered');
  obj.lastTimestamp = s.get(walletId, 'lastTimestamp');

  var w = this.fromObj(obj, skipFields);
  return w;
};

/**
 * @desc This method instantiates a wallet
 *
 * @param {Object} opts
 * @param {string} opts.id
 * @param {PrivateKey=} opts.privateKey
 * @param {string=} opts.privateKeyHex
 * @param {number} opts.requiredCopayers
 * @param {number} opts.totalCopayers
 * @param {PublicKeyRing=} opts.publicKeyRing
 * @param {string} opts.nickname
 * @param {string} opts.passphrase
 * @TODO: Figure out what is this parameter
 * @param {?} opts.spendUnconfirmed this.walletDefaults.spendUnconfirmed ??
 * @TODO: Figure out in what unit is this reconnect delay.
 * @param {number} opts.reconnectDelay milliseconds?
 * @param {number=} opts.version
 * @return {Wallet}
 */
WalletFactory.prototype.create = function(opts) {
  opts = opts || {};
  log.debug('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID') + (opts.privateKey ? ' USING PrivateKey: ' + opts.privateKey.getId() : ' NEW PrivateKey'));

  var privOpts = {
    networkName: this.networkName,
  };

  if (opts.privateKeyHex && opts.privateKeyHex.length>1) {
    privOpts.extendedPrivateKeyString = opts.privateKeyHex;
  }

  opts.privateKey = opts.privateKey || new PrivateKey(privOpts);

  var requiredCopayers = opts.requiredCopayers || this.walletDefaults.requiredCopayers;
  var totalCopayers = opts.totalCopayers || this.walletDefaults.totalCopayers;
  opts.lockTimeoutMin = this.walletDefaults.idleDurationMin;

  opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
    networkName: this.networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });
  opts.publicKeyRing.addCopayer(
    opts.privateKey.deriveBIP45Branch().extendedPublicKeyString(),
    opts.nickname
  );
  log.debug('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: this.networkName,
  });
  log.debug('\t### TxProposals Initialized');

  this.storage._setPassphrase(opts.passphrase);

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.reconnectDelay = opts.reconnectDelay || this.walletDefaults.reconnectDelay;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  opts.version = opts.version || this.version;

  var w = new Wallet(opts);
  w.store();
  this.storage.setLastOpened(w.id);
  return w;
};

/**
 * @desc Checks if a version is compatible with the current version
 * @param {string} inVersion - a version, with major, minor, and revision, period-separated (x.y.z)
 * @throws {Error} if there's a major version difference
 */
WalletFactory.prototype._checkVersion = function(inVersion) {
  var thisV = this.version.split('.');
  var thisV0 = parseInt(thisV[0]);
  var inV = inVersion.split('.');
  var inV0 = parseInt(inV[0]);

  //We only check for major version differences
  if (thisV0 < inV0) {
    throw new Error('Major difference in software versions' +
                    '. Received:' + inVersion +
                    '. Current version:' + this.version +
                    '. Aborting.');
  }
};

/**
 * @desc Throw an error if the network name is different to {@link WalletFactory#networkName}
 * @param {string} inNetworkName - the network name to check
 * @throws {Error}
 */
WalletFactory.prototype._checkNetwork = function(inNetworkName) {
  if (this.networkName !== inNetworkName) {
    throw new Error('This Wallet is configured for ' + inNetworkName + ' while currently Copay is configured for: ' + this.networkName + '. Check your settings.');
  }
};

/**
 * @desc Retrieve a wallet from the storage
 * @param {string} walletId - the id of the wallet
 * @param {string} passphrase - the passphrase to decode it
 * @return {Wallet}
 */
WalletFactory.prototype.open = function(walletId, passphrase) {
  this.storage._setPassphrase(passphrase);
  var w = this.read(walletId);
  if (w) 
    w.store();

  this.storage.setLastOpened(walletId);
  return w;
};

/**
 * @desc Retrieve all wallets stored without encription in the storage instance
 * @returns {Wallet[]}
 */
WalletFactory.prototype.getWallets = function() {
  var ret = this.storage.getWallets();
  ret.forEach(function(i) {
    i.show = i.name ? ((i.name + ' <' + i.id + '>')) : i.id;
  });
  return ret;
};

/**
 * @desc Deletes this wallet. This involves removing it from the storage instance
 * @TODO: delete is a reserved javascript keyword. NEVER USE IT.
 * @param {string} walletId
 * @TODO: Why is there a callback?
 * @callback cb
 * @return {?} the result of the callback
 */
WalletFactory.prototype.delete = function(walletId, cb) {
  var s = this.storage;
  s.deleteWallet(walletId);
  s.setLastOpened(undefined);
  return cb();
};

/**
 * @desc Pass through to {@link Wallet#secret}
 */
WalletFactory.prototype.decodeSecret = function(secret) {
  try {
    return Wallet.decodeSecret(secret);
  } catch (e) {
    return false;
  }
};

/**
 * @callback walletCreationCallback
 * @param {?=} err - an error, if any, that happened during the wallet creation
 * @param {Wallet=} wallet - the wallet created
 */

/**
 * @desc Start the network functionality.
 *
 * Start up the Network instance and try to join a wallet defined by the
 * parameter <tt>secret</tt> using the parameter <tt>nickname</tt>. Encode
 * information locally using <tt>passphrase</tt>. <tt>privateHex</tt> is the
 * private extended master key. <tt>cb</tt> has two params: error and wallet.
 *
 * @param {string} secret - the wallet secret
 * @param {string} nickname - a nickname for the current user
 * @param {string} passphrase - a passphrase to use to encrypt the wallet for persistance
 * @param {string} privateHex - the private extended master key
 * @param {walletCreationCallback} cb - a callback
 */
WalletFactory.prototype.joinCreateSession = function(secret, nickname, passphrase, privateHex, cb) {
  var self = this;
  var s = self.decodeSecret(secret);
  if (!s) return cb('badSecret');

  var privOpts = {
    networkName: this.networkName,
  };

  if (privateHex && privateHex.length>1) {
    privOpts.extendedPrivateKeyString = privateHex;
  }

  //Create our PrivateK
  var privateKey = new PrivateKey(privOpts);
  log.debug('\t### PrivateKey Initialized');
  var opts = {
    copayerId: privateKey.getId(),
    privkey: privateKey.getIdPriv(),
    key: privateKey.getIdKey(),
    secretNumber : s.secretNumber,
  };
  self.network.cleanUp();

  // This is a hack to reconize if the connection was rejected or the peer wasn't there.
  var connectedOnce = false;
  self.network.on('connected', function(sender, data) {
    connectedOnce = true;
  });

  self.network.on('serverError', function() { 
    return cb('joinError');
  });

  self.network.start(opts, function() {
    self.network.greet(s.pubKey,opts.secretNumber);
    self.network.on('data', function(sender, data) {
      if (data.type === 'walletId') {
        if (data.networkName !== self.networkName) {
          return cb('badNetwork');
        }

        data.opts.privateKey = privateKey;
        data.opts.nickname = nickname;
        data.opts.passphrase = passphrase;
        data.opts.id = data.walletId;
        var w = self.create(data.opts);
        w.sendWalletReady(s.pubKey);
        //w.seedCopayer(s.pubKey);
        return cb(null, w);
      } else {
        return cb('walletFull', w);
      }
    });
  });
};

module.exports = WalletFactory;
