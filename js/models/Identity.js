'use strict';
var _ = require('lodash');
var preconditions = require('preconditions').singleton();
var inherits = require('inherits');
var events = require('events');
var async = require('async');

var bitcore = require('bitcore');

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');
var PluginManager = require('./PluginManager');
var Async = require('./Async');
var cryptoUtil = require('../util/crypto');
var log = require('../util/log');
var version = require('../../version').version;

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

  this.walletIds = opts.walletIds || [];
  this.wallets = opts.wallets || {};
  this.focusedTimestamps = opts.focusedTimestamps || {};
  this.backupNeeded = opts.backupNeeded || false;

};


inherits(Identity, events.EventEmitter);

Identity.getStoragePrefix = function() {
  return 'profile::';
};

Identity.getKeyForEmail = function(email) {
  return Identity.getStoragePrefix() + bitcore.util.sha256ripe160(email).toString('hex');
};

Identity.prototype.getChecksumForStorage = function() {
  return JSON.stringify(_.sortBy(this.walletIds));
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
Identity.create = function(opts, cb) {
  opts = _.extend({
    backupNeeded: true
  }, opts);

  var iden = new Identity(opts);
  iden.store(_.extend(opts, {
    failIfExists: true
  }), function(err) {
    if (err) return cb(err);
    return cb(null, iden);
  });
};

Identity.prototype.resendVerificationEmail = function (cb) {
  var self = this;

  preconditions.checkArgument(_.isFunction(cb));
  preconditions.checkState(_.isFunction(self.storage.resendVerificationEmail));

  self.storage.resendVerificationEmail(cb);
};


/**
 * Open an Identity from the given storage.
 *
 * After opening a profile, and setting its wallet event handlers,
 * the client must run .netStart on each
 * (probably on iden's newWallet handler
 *
 * @param {Object} opts
 * @param {Object} opts.storage
 * @param {string} opts.email
 * @param {string} opts.password
 * @param {Function} cb
 */
Identity.open = function(opts, cb) {
  preconditions.checkArgument(_.isObject(opts));
  preconditions.checkArgument(_.isFunction(cb));

  var storage = opts.storage || opts.pluginManager.get('DB');
  storage.setCredentials(opts.email, opts.password, opts);
  storage.getItem(Identity.getKeyForEmail(opts.email), function(err, data, headers) {
    var exported;
    if (err) {
      return cb(err);
    }
    try {
      exported = JSON.parse(data);
    } catch (e) {
      return cb(e);
    }
    return cb(null, new Identity(_.extend(opts, exported)), headers);
  });
};

Identity.prototype.verifyChecksum = function (cb) {
  var self = this;

  self.storage.getItem(Identity.getKeyForEmail(self.email), function(err, data, headers) {
    var iden;
    if (err) return cb(err);
    try {
      iden = JSON.parse(data);
    } catch (e) {
      return cb(e);
    }
    return cb(null, self.getChecksumForStorage() == self.getChecksumForStorage.call(iden));
  });
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
Identity.prototype.getWallets = function() {
  return _.values(this.wallets);
};

/**
 * addWallet
 *
 * @param w
 */
Identity.prototype.addWallet = function(w) {
  this.wallets[w.getId()] = w;
  this.walletIds = _.union(this.walletIds, [w.getId()]);
};

/**
 * @desc Deletes a wallet. This involves removing it from the storage instance
 *
 * @param {string} walletId
 * @callback cb
 * @return {err}
 */
Identity.prototype.deleteWallet = function(walletId, cb) {
  preconditions.checkArgument(_.isString(walletId));

  var self = this;


  self.verifyChecksum(function (err, match) {
    if (err) return cb(err);
    if (!match) return cb('The profile is out of sync. Please re-login to get the latest changes.');

    var w = self.getWalletById(walletId);
    w.close();

    delete self.wallets[walletId];
    delete self.focusedTimestamps[walletId];
    self.walletIds = _.without(self.walletIds, walletId);

    self.storage.removeItem(Wallet.getStorageKey(walletId), function(err) {
      if (err) return cb(err);
      self.emitAndKeepAlive('walletDeleted', walletId);
      self.store(null, cb);
    });
  });
};


/**
 * readAndBindWallet
 *
 * @param {string} wid walletId to be readed
 * @param {function} cb
 *
 */
Identity.prototype.readAndBindWallet = function(walletId, cb) {
  var self = this;
  self.retrieveWalletFromStorage(walletId, {}, function(error, wallet) {
    if (!error) {
      self.addWallet(wallet);
      self.bindWallet(wallet);
    }
    return cb(error);
  });
};


Identity.prototype.emitAndKeepAlive = function(args) {
  var args = Array.prototype.slice.call(arguments);
  log.debug('Ident Emitting:', args);
  //this.keepAlive(); // TODO
  this.emit.apply(this, arguments);
};


/**
 * @desc open profile's wallets. Call it AFTER setting
 * the proper even listeners. no callback.
 *
 */
Identity.prototype.openWallets = function() {
  var self = this;


  if (_.isEmpty(self.walletIds)) {
    self.emitAndKeepAlive('noWallets')
    return;
  }

  // First read the lastFocused wallet
  self.walletIds.sort(function(a, b) {
    var va = self.focusedTimestamps[a] || 0;
    var vb = self.focusedTimestamps[b] || 0;

    return va < vb ? 1 : (va === vb ? 0 : -1);
  });

  // opens the wallets, in the order they were last accessed. Emits open events (newWallet)
  async.eachSeries(self.walletIds, function(walletId, a_cb) {
    self.readAndBindWallet(walletId, a_cb);
  });
};

/**
 * @param {string} walletId
 * @param {} opts
 *           opts.importWallet
 * @param {Function} cb
 */
Identity.prototype.retrieveWalletFromStorage = function(walletId, opts, cb) {
  var self = this;

  var importFunction = opts.importWallet || Wallet.fromUntrustedObj;

  this.storage.getItem(Wallet.getStorageKey(walletId), function(error, walletData) {
    if (error) {
      return cb(error);
    }
    try {
      log.info('## OPENING Wallet:', walletId);
      if (_.isString(walletData)) {
        walletData = JSON.parse(walletData);
      }
      var readOpts = {
        networkOpts: self.networkOpts,
        blockchainOpts: self.blockchainOpts,
        skipFields: []
      };
    } catch (e) {
      log.debug("ERROR: ", e.message);
      if (e && e.message && e.message.indexOf('MISSOPTS') !== -1) {
        return cb(new Error('WERROR: Could not read: ' + walletId + ': ' + e.message));
      } else {
        return cb(e);
      }
    }
    return cb(null, importFunction(walletData, readOpts));
  });
};

/**
 * @param {Wallet} wallet
 * @param {Function} cb
 */
Identity.prototype.storeWallet = function(wallet, cb) {
  var self = this;

  preconditions.checkArgument(wallet && _.isObject(wallet));

  wallet.setVersion(this.version);
  var val = wallet.toObj();
  var key = wallet.getStorageKey();
  log.debug('Storing wallet:' + wallet.getName());

  this.storage.setItem(key, val, function(err) {
    if (err) {
      log.error('Wallet:' + wallet.getName() + ' could not be stored:', err);
      log.error('Wallet:' + wallet.getName() + ' Size:', JSON.stringify(wallet.sizes()));

      if (err.match('OVERQUOTA')) {
        self.emitAndKeepAlive('walletStorageError', wallet.getId(), 'Storage limits on remote server exceeded');
      } else {
        self.emitAndKeepAlive('walletStorageError', wallet.getId(), err);
      }
    }
    if (cb)
      return cb(err);
  });
};


/**
 * @param {Identity} identity
 * @param {Wallet} wallet
 * @param {Function} cb
 */
Identity.storeWalletDebounced = _.debounce(function(identity, wallet, cb) {
  identity.storeWallet(wallet, cb);
}, 3000);



Identity.prototype.toObj = function() {
  return _.pick(this, 'walletIds', 'version', 'fullName', 'password', 'email', 'backupNeeded', 'focusedTimestamps');
};

Identity.prototype.exportEncryptedWithWalletInfo = function(opts) {
  var crypto = opts.cryptoUtil || cryptoUtil;

  return crypto.encrypt(this.password, this.exportWithWalletInfo(opts));
};

Identity.prototype.setBackupNeeded = function(backupNeeded) {
  var self = this;

  self.backupNeeded = !!backupNeeded;

  self.verifyChecksum(function (err, match) {
    if (err) return cb(err);
    if (!match) return cb('The profile is out of sync. Please re-login to get the latest changes.');

    self.store({
      noWallets: true
    }, function() {});
  });
}

Identity.prototype.exportWithWalletInfo = function(opts) {
  return _.extend({
      wallets: _.map(this.getWallets(), function(wallet) {
        return wallet.toObj();
      })
    },
    _.pick(this, 'version', 'fullName', 'password', 'email', 'backupNeeded')
  );
};

/**
 * @param {Object} opts
 * @param {Function} cb
 */
Identity.prototype.store = function(opts, cb) {
  var self = this;
  opts = opts || {};

  var storeFunction = opts.failIfExists ? self.storage.createItem : self.storage.setItem;

  storeFunction.call(self.storage, this.getId(), this.toObj(), function(err) {
    if (err) return cb(err);

    if (opts.noWallets) return cb();

    async.each(self.getWallets(), function(wallet, in_cb) {
      self.storeWallet(wallet, in_cb);
    }, cb);
  });
};

/**
 * @param {Object} opts
 * @param {Function} cb
 */
Identity.prototype.remove = function(opts, cb) {
  log.debug('Deleting profile');

  var self = this;
  opts = opts || {};

  async.each(self.getWallets(), function(w, cb) {
    w.close();
    self.storage.removeItem(Wallet.getStorageKey(w.getId()), function(err) {
      if (err) return cb(err);
      cb();
    });
  }, function(err) {
    if (err) return cb(err);

    self.storage.removeItem(self.getId(), function(err) {
      if (err) return cb(err);

      self.storage.clear(function(err) {
        if (err) return cb(err);

        self.emitAndKeepAlive('closed');
        return cb();
      });
    });
  });
};

Identity.prototype._cleanUp = function() {
  _.each(this.getWallets(), function(w) {
    w.close();
  });
};

/**
 * @desc Closes the wallet and disconnects all services
 */
Identity.prototype.close = function() {

  this._cleanUp();
  this.emitAndKeepAlive('closed');
};


Identity.prototype.importWalletFromObj = function(obj, opts, cb) {
  var self = this;
  preconditions.checkArgument(cb);
  var importFunction = opts.importWallet || Wallet.fromUntrustedObj;

  var readOpts = {
    networkOpts: this.networkOpts,
    blockchainOpts: this.blockchainOpts,
    skipFields: opts.skipFields,
  };

  var w = importFunction(obj, readOpts);
  if (!w) return cb(new Error('Could not decrypt'));
  log.debug('Wallet decrypted:' + w.getName());

  self._checkVersion(w.version);
  log.debug('Updating Indexes for wallet:' + w.getName());
  w.updateIndexes(function(err) {
    log.debug('Adding wallet to profile:' + w.getName());
    self.addWallet(w);
    self.updateFocusedTimestamp(w.getId());
    self.bindWallet(w);
    self.storeWallet(w, cb);
  });
};


Identity.prototype.importMultipleWalletsFromObj = function(objs, opts) {
  var self = this;
  opts = opts || {};

  async.eachSeries(objs, function(walletData, cb) {
    if (!walletData)
      return cb();
    self.importWalletFromObj(walletData, opts, cb);
  });
};


/**
 * @param {Wallet} wallet
 * @param {Function} cb
 */
Identity.prototype.closeWallet = function(wallet, cb) {
  preconditions.checkState(wallet, 'Wallet not found');

  var self = this;
  wallet.close(function(err) {
    return cb(err);
  });
};

Identity.importFromEncryptedFullJson = function(ejson, password, opts, cb) {
  var crypto = opts.cryptoUtil || cryptoUtil;

  var str = crypto.decrypt(password, ejson);
  if (!str) {
    // 0.7.3 broken KDF
    log.debug('Trying legacy encryption...');
    var passphrase = crypto.kdf(password, 'mjuBtGybi/4=', 100);
    str = crypto.decrypt(passphrase, ejson);
  }

  if (!str)
    return cb('BADSTR');

  return Identity.importFromFullJson(str, password, opts, cb);
};

Identity.importFromFullJson = function(str, password, opts, cb) {
  preconditions.checkArgument(str);
  var json;
  try {
    json = JSON.parse(str);
  } catch (e) {
    return cb('BADSTR: Unable to retrieve json from string', str);
  }

  var email = json.email;

  opts.email = email;
  opts.password = password;

  if (!email)
    return cb('BADSTR');

  var iden = new Identity(opts);

  opts.failIfExists = true;

  json.wallets = json.wallets || {};

  iden.store(opts, function(err) {
    if (err) return cb(err); //profile already exists

    return cb(null, iden, json.wallets);
  });
};


/**
 * @desc binds a wallet's events and emits 'newWallet'
 * @param {string} walletId Wallet id to be binded
 * @emits newWallet  (walletId)
 */
Identity.prototype.bindWallet = function(w) {
  preconditions.checkArgument(w && this.getWalletById(w.getId()));

  var self = this;
  log.debug('Binding wallet:' + w.getName());

  w.on('txProposalsUpdated', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('paymentAck', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('newAddresses', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('settingsUpdated', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('txProposalEvent', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('addressBookUpdated', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('publicKeyRingUpdated', function() {
    Identity.storeWalletDebounced(self, w);
  });
  w.on('ready', function() {
    Identity.storeWalletDebounced(self, w);
  });

  this.emitAndKeepAlive('newWallet', w.getId());
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
 * @param {boolean} opts.spendUnconfirmed this.walletDefaults.spendUnconfirmed
 * @param {number} opts.reconnectDelay time in milliseconds
 * @param {number=} opts.version
 * @param {callback} opts.version
 * @return {Wallet}
 */
Identity.prototype.createWallet = function(opts, cb) {
  preconditions.checkArgument(cb);
  
  var self = this;

  self.verifyChecksum(function (err, match) {
    if (err) return cb(err);
    if (!match) return cb('The profile is out of sync. Please re-login to get the latest changes.');

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

    var requiredCopayers = opts.requiredCopayers || self.walletDefaults.requiredCopayers;
    var totalCopayers = opts.totalCopayers || self.walletDefaults.totalCopayers;
    opts.lockTimeoutMin = self.walletDefaults.idleDurationMin;

    opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
      networkName: opts.networkName,
      requiredCopayers: requiredCopayers,
      totalCopayers: totalCopayers,
    });
    opts.publicKeyRing.addCopayer(
      opts.privateKey.deriveBIP45Branch().extendedPublicKeyString(),
      opts.nickname || self.getName()
    );
    log.debug('\t### PublicKeyRing Initialized');

    opts.txProposals = opts.txProposals || new TxProposals({
      networkName: opts.networkName,
    });
    var walletClass = opts.walletClass || Wallet;

    log.debug('\t### TxProposals Initialized');


    opts.networkOpts = self.networkOpts;
    opts.blockchainOpts = self.blockchainOpts;

    opts.spendUnconfirmed = opts.spendUnconfirmed || self.walletDefaults.spendUnconfirmed;
    opts.reconnectDelay = opts.reconnectDelay || self.walletDefaults.reconnectDelay;
    opts.requiredCopayers = requiredCopayers;
    opts.totalCopayers = totalCopayers;
    opts.version = opts.version || self.version;

    var w = new walletClass(opts);

    if (self.getWalletById(w.getId())) {
      return cb('walletAlreadyExists');
    }
    self.addWallet(w);
    self.updateFocusedTimestamp(w.getId());
    self.bindWallet(w);
    self.storeWallet(w, function(err) {
      if (err) return cb(err);

      self.backupNeeded = true;
      self.store({
        noWallets: true,
      }, function(err) {
        return cb(err, w);
      });
    });
  });
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
 * @desc Pass through to {@link Wallet#secret}
 */
Identity.prototype.decodeSecret = function(secret) {
  try {
    return Wallet.decodeSecret(secret);
  } catch (e) {
    return false;
  }
};

/**
 * getLastFocusedWalletId
 *
 * @return {string} walletId
 */
Identity.prototype.getLastFocusedWalletId = function() {
  if (this.walletIds.length == 0) return undefined;

  var max = _.max(this.focusedTimestamps);

  if (!max)
    return this.walletIds[0];

  return _.findKey(this.focusedTimestamps, function(ts) {
    return ts == max;
  }) || this.walletIds[0];
};

Identity.prototype.updateFocusedTimestamp = function(wid) {
  preconditions.checkArgument(wid && this.getWalletById(wid));
  this.focusedTimestamps[wid] = Date.now();
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
