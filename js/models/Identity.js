'use strict';
var preconditions = require('preconditions').singleton();

var _ = require('lodash');
var bitcore = require('bitcore');
var log = require('../log');
var async = require('async');

var version = require('../../version').version;
var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');
var PluginManager = require('./PluginManager');
var Async = module.exports.Async = require('./Async');

/**
 * @desc
 * Identity - stores the state for a wallet in creation
 *
 * @param {Object} opts - configuration for this wallet
 * @param {string} opts.fullName
 * @param {string} opts.email
 * @param {string} opts.password
 * @param {string} opts.storage
 * @param {string} opts.pluginManager
 * @param {Object} opts.walletDefaults
 * @param {string} opts.version
 * @param {Object} opts.wallets
 * @param {Object} opts.network
 * @param {string} opts.network.testnet
 * @param {string} opts.network.livenet
 * @constructor
 */
function Identity(opts) {
  preconditions.checkArgument(opts);

  opts = _.extend({}, opts);
  this.networkOpts = {
    'livenet': opts.network.livenet,
    'testnet': opts.network.testnet,
  };
  this.blockchainOpts = {
    'livenet': opts.network.livenet,
    'testnet': opts.network.testnet,
  };

  this.fullName = opts.fullName || opts.email;
  this.email = opts.email;
  this.password = opts.password;

  this.storage = opts.storage || opts.pluginManager.get('DB');
  this.storage.setCredentials(this.email, this.password, {});

  this.walletDefaults = opts.walletDefaults || {};
  this.version = opts.version || version;

  this.wallets = opts.wallets || {};
};

Identity.getKeyForEmail = function(email) {
  return 'profile::' + bitcore.util.sha256ripe160(email).toString('hex');
};

Identity.prototype.getId = function() {
  return Identity.getKeyForEmail(this.email);
};

Identity.prototype.getName = function() {
  return this.fullName || this.email;
};

/**
 * Creates an Identity
 *
 * @param opts
 * @param cb
 * @return {undefined}
 */
Identity.create = function(opts) {
  opts = _.extend({}, opts);

  return new Identity(opts);
};


/**
 * Open an Identity from the given storage
 *
 * @param {Object} opts
 * @param {Object} opts.storage
 * @param {string} opts.email
 * @param {string} opts.password
 * @param {Function} cb
 */
Identity.open = function(opts, cb) {
  var storage = opts.storage || opts.pluginManager.get('DB');
  storage.setCredentials(opts.email, opts.password, opts);
  storage.getItem(Identity.getKeyForEmail(opts.email), function(err, data) {
    if (err) {
      return cb(err);
    }
    return Identity.createFromPartialJson(data, opts, cb);
  });
};

/**
 * Creates an Identity, retrieves all Wallets remotely, and activates network
 *
 * @param {string} jsonString - a string containing a json object with options to rebuild the identity
 * @param {Object} opts
 * @param {Function} cb
 */
Identity.createFromPartialJson = function(jsonString, opts, callback) {
  var exported;
  try {
    exported = JSON.parse(jsonString);
  } catch (e) {
    return callback('Invalid JSON');
  }
  var identity = new Identity(_.extend(opts, exported));
  async.map(exported.walletIds, function(walletId, callback) {
    identity.retrieveWalletFromStorage(walletId, {}, function(error, wallet) {
      if (!error) {
        identity.wallets[wallet.getId()] = wallet;
        identity.bindWallet(wallet);
        wallet.netStart();
      }
      callback(error, wallet);
    });
  }, function(err) {
    return callback(err, identity);
  });
};

/**
 * @param {string} walletId
 * @param {} opts
 *           opts.importWallet
 * @param {Function} callback
 */
Identity.prototype.retrieveWalletFromStorage = function(walletId, opts, callback) {
  var self = this;

  var importFunction = opts.importWallet || Wallet.fromUntrustedObj;

  this.storage.getItem(Wallet.getStorageKey(walletId), function(error, walletData) {
    if (error) {
      return callback(error);
    }
    try {
      log.debug('## OPENING Wallet: ' + walletId);
      if (_.isString(walletData)) {
        walletData = JSON.parse(walletData);
      }
      var readOpts = {
        networkOpts: self.networkOpts,
        blockchainOpts: self.blockchainOpts,
        skipFields: []
      };

      return callback(null, importFunction(walletData, readOpts));

    } catch (e) {

      log.debug("ERROR: ", e.message);
      if (e && e.message && e.message.indexOf('MISSOPTS') !== -1) {
        return callback(new Error('WERROR: Could not read: ' + walletId + ': ' + e.message));
      } else {
        return callback(e);
      }
    }
  });
};

/**
 * TODO (matiu): What is this supposed to do?
 */
Identity.isAvailable = function(email, opts, cb) {
  return cb();
};

/**
 * @param {Wallet} wallet
 * @param {Function} cb
 */
Identity.prototype.storeWallet = function(wallet, cb) {
  preconditions.checkArgument(wallet && _.isObject(wallet));

  var val = wallet.toObj();
  var key = wallet.getStorageKey();

  this.storage.setItem(key, val, function(err) {
    if (err) {
      log.debug('Wallet:' + wallet.getName() + ' couldnt be stored');
    }
    if (cb)
      return cb(err);
  });
};

Identity.prototype.toObj = function() {
  return _.extend({
      walletIds: _.keys(this.wallets)
    },
    _.pick(this, 'version', 'fullName', 'password', 'email'));
};

Identity.prototype.exportWithWalletInfo = function() {
  return _.extend({
      wallets: _.map(this.wallets, function(wallet) {
        return wallet.toObj();
      })
    },
    _.pick(this, 'version', 'fullName', 'password', 'email'));
};

/**
 * @param {Object} opts
 * @param {Function} cb
 */
Identity.prototype.store = function(opts, cb) {
  var self = this;
  self.storage.setItem(this.getId(), this.toObj(), function(err) {
    if (err) return cb(err);

    if (opts.noWallets)
      return cb();

    async.map(self.wallets, self.storeWallet, cb);
  });
};

Identity.prototype._cleanUp = function() {
  // NOP
};

/**
 * @desc Closes the wallet and disconnects all services
 */
Identity.prototype.close = function(cb) {
  async.map(this.wallets, function(wallet, callback) {
    wallet.close(callback);
  }, cb);
};

/**
 * @desc Imports a wallet from an encrypted base64 object
 * @param {string} base64 - the base64 encoded object
 * @param {string} passphrase - passphrase to decrypt it
 * @param {string[]} skipFields - fields to ignore when importing
 * @return {Wallet}
 */
Identity.prototype.importWallet = function(base64, password, skipFields, cb) {
  var self = this;
  preconditions.checkArgument(password);
  preconditions.checkArgument(cb);

  var obj = this.storage.decrypt(base64, password);

  var readOpts = {
    networkOpts: this.networkOpts,
    blockchainOpts: this.blockchainOpts,
    skipFields: skipFields
  };

  if (!obj) return cb(null);
  var w = Identity._walletFromObj(obj, readOpts);
  this._checkVersion(w.version);
  this.addWallet(w, function(err) {
    if (err) return cb(err, null);
    self.wallets[w.getId()] = w;
    self.bindWallet(w);
    self.store(null, function(err) {
      return cb(err, w);
    });
  });
};

/**
 * @param {Wallet} wallet
 * @param {Function} cb
 */
Identity.prototype.closeWallet = function(wallet, cb) {
  preconditions.checkState(wallet, 'Wallet not found');

  wallet.close(function(err) {
    delete self.wallets[wid];
    return cb(err);
  });
};

Identity.importFromFullJson = function(str, password, opts, cb) {
  preconditions.checkArgument(str);
  var json;
  try {
    json = JSON.parse(str);
  } catch (e) {
    return cb('Unable to retrieve json from string', str);
  }

  if (!_.isNumber(json.iterations))
    return cb('BADSTR: Missing iterations');

  var email = json.email;
  var iden = new Identity(email, password, opts);

  json.wallets = json.wallets || {};
  async.map(json.wallets, function(walletData, callback) {
    iden.importWallet(wstr, password, opts.skipFields, function(err, w) {
      if (err) return callback(err);
      log.debug('Wallet ' + w.getId() + ' imported');
      callback();
    });
  }, function(err, results) {
    if (err) {
      return cb(err);
    }
    iden.store(function(err) {
      if (err) {
        return cb(err);
      }
      return cb(null, iden);
    });
  });
};

Identity.prototype.bindWallet = function(w) {
  var self = this;

  self.wallets[w.getId()] = w;
  log.debug('Binding wallet ' + w.getName());

  w.on('txProposalsUpdated', function() {
    log.debug('<txProposalsUpdated>> Wallet' + w.getName());
    self.storeWallet(w);
  });
  w.on('newAddresses', function() {
    log.debug('<newAddresses> Wallet' + w.getName());
    self.storeWallet(w);
  });
  w.on('settingsUpdated', function() {
    log.debug('<newAddresses> Wallet' + w.getName());
    self.storeWallet(w);
  });
  w.on('txProposalEvent', function() {
    log.debug('<txProposalEvent> Wallet' + w.getName());
    self.storeWallet(w);
  });
  w.on('ready', function() {
    log.debug('<ready> Wallet' + w.getName());
    self.storeWallet(w);
  });
  w.on('addressBookUpdated', function() {
    log.debug('<addressBookUpdated> Wallet' + w.getName());
    self.storeWallet(w);
  });
};

/**
 * @desc This method prepares options for a new Wallet
 *
 * @param {Object} opts
 * @param {string} opts.id
 * @param {PrivateKey=} opts.privateKey
 * @param {string=} opts.privateKeyHex
 * @param {number} opts.requiredCopayers
 * @param {number} opts.totalCopayers
 * @param {PublicKeyRing=} opts.publicKeyRing
 * @param {string} opts.nickname
 * @param {string} opts.password
 * @TODO: Figure out what is this parameter
 * @param {?} opts.spendUnconfirmed this.walletDefaults.spendUnconfirmed ??
 * @TODO: Figure out in what unit is this reconnect delay.
 * @param {number} opts.reconnectDelay milliseconds?
 * @param {number=} opts.version
 * @param {callback} opts.version
 * @return {Wallet}
 */
Identity.prototype.createWallet = function(opts, cb) {
  preconditions.checkArgument(cb);

  opts = opts || {};
  opts.networkName = opts.networkName || 'testnet';

  log.debug('### CREATING NEW WALLET.' + (opts.id ? ' USING ID: ' + opts.id : ' NEW ID') + (opts.privateKey ? ' USING PrivateKey: ' + opts.privateKey.getId() : ' NEW PrivateKey'));

  var privOpts = {
    networkName: opts.networkName,
  };

  if (opts.privateKeyHex && opts.privateKeyHex.length > 1) {
    privOpts.extendedPrivateKeyString = opts.privateKeyHex;
  }

  opts.privateKey = opts.privateKey || new PrivateKey(privOpts);

  var requiredCopayers = opts.requiredCopayers || this.walletDefaults.requiredCopayers;
  var totalCopayers = opts.totalCopayers || this.walletDefaults.totalCopayers;
  opts.lockTimeoutMin = this.walletDefaults.idleDurationMin;

  opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
    networkName: opts.networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });
  opts.publicKeyRing.addCopayer(
    opts.privateKey.deriveBIP45Branch().extendedPublicKeyString(),
    opts.nickname || this.getName()
  );
  log.debug('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: opts.networkName,
  });
  var walletClass = opts.walletClass || Wallet;

  log.debug('\t### TxProposals Initialized');


  opts.networkOpts = this.networkOpts;
  opts.blockchainOpts = this.blockchainOpts;

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.reconnectDelay = opts.reconnectDelay || this.walletDefaults.reconnectDelay;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  opts.version = opts.version || this.version;

  var self = this;

  var w = new walletClass(opts);
  this.addWallet(w, function(err) {
    if (err) return cb(err);
    self.bindWallet(w);
    w.netStart();
    self.store({
      noWallets: true
    }, function(err) {
      return cb(err, w);
    });
  });
};

Identity.prototype.addWallet = function(wallet, cb) {
  preconditions.checkArgument(wallet);
  preconditions.checkArgument(wallet.getId);
  preconditions.checkArgument(cb);

  this.wallets[wallet.getId()] = wallet;

  // TODO (eordano): Consider not saving automatically after this
  this.storage.setItem(wallet.getStorageKey(), wallet.toObj(), cb);
};


/**
 * @desc Checks if a version is compatible with the current version
 * @param {string} inVersion - a version, with major, minor, and revision, period-separated (x.y.z)
 * @throws {Error} if there's a major version difference
 */
Identity.prototype._checkVersion = function(inVersion) {
  if (inVersion) {
    var thisV = this.version.split('.');
    var thisV0 = parseInt(thisV[0]);
    var inV = inVersion.split('.');
    var inV0 = parseInt(inV[0]);
  }

  //We only check for major version differences
  if (thisV0 < inV0) {
    throw new Error('Major difference in software versions' +
      '. Received:' + inVersion +
      '. Current version:' + this.version +
      '. Aborting.');
  }
};

/**
 * @param {string} walletId
 * @returns {Wallet}
 */
Identity.prototype.getWalletById = function(walletId) {
  return this.wallets[walletId];
};

/**
 * @returns {Wallet[]}
 */
Identity.prototype.listWallets = function() {
  return _.values(this.wallets);
};

/**
 * @desc Deletes a wallet. This involves removing it from the storage instance
 *
 * @param {string} walletId
 * @callback cb
 * @return {err}
 */
Identity.prototype.deleteWallet = function(walletId, cb) {
  var self = this;

  delete this.wallets[walletId];
  this.storage.removeItem(Wallet.getStorageKey(walletId), function(err) {
    if (err) {
      return cb(err);
    }
    self.store(cb);
  });
};

/**
 * @desc Pass through to {@link Wallet#secret}
 */
Identity.prototype.decodeSecret = function(secret) {
  try {
    return Wallet.decodeSecret(secret);
  } catch (e) {
    return false;
  }
};

Identity.prototype.getLastFocusedWallet = function() {
  if (_.keys(this.wallets).length == 0) return;
  return _.max(this.wallets, function(wallet) {
    return wallet.lastTimestamp || 0;
  });
};

/**
 * @callback walletCreationCallback
 * @param {?} err - an error, if any, that happened during the wallet creation
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
 * @param {object} opts
 * @param {string} opts.secret - the wallet secret
 * @param {string} opts.nickname - a nickname for the current user
 * @param {string} opts.privateHex - the private extended master key
 * @param {walletCreationCallback} cb - a callback
 */
Identity.prototype.joinWallet = function(opts, cb) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.secret);
  preconditions.checkArgument(cb);
  var self = this;
  var decodedSecret = this.decodeSecret(opts.secret);
  if (!decodedSecret || !decodedSecret.networkName || !decodedSecret.pubKey) {
    return cb('badSecret');
  }

  var privOpts = {
    networkName: decodedSecret.networkName,
  };

  if (opts.privateHex && opts.privateHex.length > 1) {
    privOpts.extendedPrivateKeyString = opts.privateHex;
  }

  //Create our PrivateK
  var privateKey = new PrivateKey(privOpts);
  log.debug('\t### PrivateKey Initialized');
  var joinOpts = {
    copayerId: privateKey.getId(),
    privkey: privateKey.getIdPriv(),
    key: privateKey.getIdKey(),
    secretNumber: decodedSecret.secretNumber,
  };


  var joinNetwork = opts.Async || new Async(this.networkOpts[decodedSecret.networkName]);

  // This is a hack to reconize if the connection was rejected or the peer wasn't there.
  var connectedOnce = false;
  joinNetwork.on('connected', function(sender, data) {
    connectedOnce = true;
  });

  joinNetwork.on('connect_error', function() {
    return cb('connectionError');
  });

  joinNetwork.on('serverError', function() {
    return cb('joinError');
  });

  joinNetwork.start(joinOpts, function() {

    joinNetwork.greet(decodedSecret.pubKey, joinOpts.secretNumber);
    joinNetwork.on('data', function(sender, data) {
      if (data.type === 'walletId' && data.opts) {
        if (!data.networkName || data.networkName !== decodedSecret.networkName) {
          return cb('badNetwork');
        }
        data.opts.networkName = data.networkName;

        var walletOpts = _.clone(data.opts);
        walletOpts.id = data.walletId;
        walletOpts.network = joinNetwork;

        walletOpts.privateKey = privateKey;
        walletOpts.nickname = opts.nickname || self.getName();

        if (opts.password)
          walletOpts.password = opts.password;

        self.createWallet(walletOpts, function(err, w) {
          if (w) {
            w.sendWalletReady(decodedSecret.pubKey);
          } else {
            if (!err) {
              err = 'walletFull';
            }
          }
          return cb(err, w);
        });
      }
    });
  });
};


module.exports = Identity;
