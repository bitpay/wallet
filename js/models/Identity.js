'use strict';
var preconditions = require('preconditions').singleton();

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');
var _ = require('underscore');
var log = require('../log');
var version = require('../../version').version;
var PluginManager = require('./PluginManager');
var Profile = require('./Profile');
var Insight = module.exports.Insight = require('./Insight');
var Async = module.exports.Async = require('./Async');
var preconditions = require('preconditions').singleton();
var Storage = module.exports.Storage = require('./Storage');

/**
 * @desc
 * Identity - stores the state for a wallet in creation
 *
 * @param {Object} config - configuration for this wallet
 * @param {Object} config.wallet - default configuration for the wallet
 * @constructor
 */

function Identity(email, password, opts) {
  preconditions.checkArgument(opts);
  var storageOpts = {};

  if (opts.pluginManager) {
    storageOpts = _.clone({
      db: opts.pluginManager.get('DB'),
      passphrase: opts.passphrase,
    });
    /*
     * TODO (plugins for other services)
     *
     * blockchainOpts = {
     *   provider: Insight...
     * }
     */
  }
  storageOpts.password = password;

  this.storage = Identity._newStorage(storageOpts);
  this.storage.setPassword(password);

  this.networks = {
    'livenet': Identity._newAsync(opts.network.livenet),
    'testnet': Identity._newAsync(opts.network.testnet),
  };
  this.blockchains = {
    'livenet': Identity._newInsight(opts.network.livenet),
    'testnet': Identity._newInsight(opts.network.testnet),
  };

  this.walletDefaults = opts.walletDefaults || {};
  this.version = opts.version || version;

  // open wallets
  this.openWallets = [];
};


/* for stubbing */
Identity._createProfile = function(email, password, storage, cb) {
  Profile.create(email, password, storage, cb);
};

Identity._newInsight = function(opts) {
  return new Insight(opts);
};

Identity._newAsync = function(opts) {
  return new Async(opts);
};



Identity._newStorage = function(opts) {
  return new Storage(opts);
};

Identity._newWallet = function(opts) {
  return new Wallet(opts);
};

Identity._walletFromObj = function(o, s, n, b, skip) {
  return Wallet.fromObj(o, s, n, b, skip);
};

Identity._walletRead = function(id, s, n, b, skip, cb) {
  return Wallet.read(id, s, n, b, skip, cb);
};

Identity._walletDelete = function(id, s, cb) {
  return Wallet.delete(id, s, cb);
};

/* for stubbing */
Identity._openProfile = function(email, password, storage, cb) {
  Profile.open(email, password, storage, cb);
};



/**
 * creates and Identity
 *
 * @param email
 * @param password
 * @param opts
 * @param cb
 * @return {undefined}
 */
Identity.create = function(email, password, opts, cb) {
  opts = opts || {};

  var iden = new Identity(email, password, opts);

  Identity._createProfile(email, password, iden.storage, function(err, profile) {
    if (err) return cb(err);
    iden.profile = profile;

    if (opts.noWallets)
      cb(null, iden);

    // default wallet
    var wopts = _.extend(opts.walletDefaults, {
      nickname: email,
      networkName: opts.networkName,
      requiredCopayers: 1,
      totalCopayers: 1,
      password: password,
      name: 'general',
    });
    iden.createWallet(wopts, function(err, w) {
      return cb(null, iden, w);
    });
  });
};


/**
 * validates Profile's email
 *
 * @param authcode
 * @param cb
 * @return {undefined}
 */
Identity.prototype.validate = function(authcode, cb) {
  // TODO
  console.log('[Identity.js.99] TODO: Should validate email thru authcode'); //TODO
  return cb();
};


/**
 * open's an Identity from storage
 *
 * @param email
 * @param password
 * @param opts
 * @param cb
 * @return {undefined}
 */
Identity.open = function(email, password, opts, cb) {
  var iden = new Identity(email, password, opts);

  Identity._openProfile(email, password, iden.storage, function(err, profile) {
    if (err) return cb(err);
    iden.profile = profile;

    var wids = _.pluck(iden.listWallets(), 'id');


    while (1) {
      var wid = wids.shift();
      if (!wid)
        return new Error('Could not open any wallet from profile');

      iden.openWallet(wid, password, function(err, w) {
        if (err)
          log.info('Cound not open wallet id:' + wid + '. Skipping')
        else
          return cb(err, iden, w);
      })
    }

  });
};

/**
 * isAvailable
 *
 * @param email
 * @param opts
 * @param cb
 * @return {undefined}
 */
Identity.isAvailable = function(email, opts, cb) {
  console.log('[Identity.js.127:isAvailable:] TODO'); //TODO
  return cb();
};


/**
 * store
 *
 * @param opts
 * @param cb
 * @return {undefined}
 */
Identity.prototype.store = function(opts, cb) {
  preconditions.checkState(this.profile);

  var self = this;
  self.profile.store(opts, function(err) {
    if (err) return cb(err);

    var l = self.openWallets.length,
      i = 0;
    if (!l) return cb();

    _.each(self.openWallets, function(w) {
      w.store(function(err) {
        if (err) return cb(err);

        if (++i == l)
          return cb();
      })
    });
  });
};


Identity.prototype._cleanUp = function() {
  log.info('Cleaning Network connections')
  var self = this;

  _.each(['livenet', 'testnet'], function(n) {
    self.networks[n].cleanUp();
    self.blockchains[n].destroy();
  });
};

/**
 * @desc Closes the wallet and disconnects all services
 */
Identity.prototype.close = function(cb) {
  preconditions.checkState(this.profile);

  var l = this.openWallets.length,
    i = 0;
  if (!l) {
    return cb ? cb() : null;
  }

  var self = this;
  _.each(this.openWallets, function(w) {
    w.close(function(err) {
      console.log('[Identity.js.239:err:]', err); //TODO
      if (err) return cb(err);

      console.log('[Identity.js.241]', i, l); //TODO
      if (++i == l) {
        self._cleanUp();
        if (cb) return cb();
      }
    })
  });
};


/**
 * @desc Imports a wallet from an encrypted base64 object
 * @param {string} base64 - the base64 encoded object
 * @param {string} passphrase - passphrase to decrypt it
 * @param {string[]} skipFields - fields to ignore when importing
 * @return {Wallet}
 */
Identity.prototype.importWallet = function(base64, password, skipFields, cb) {
  preconditions.checkArgument(cb);

  this.storage.setPassword(password);

  var obj = this.storage.decrypt(base64);
  if (!obj) return false;

  var networkName = Wallet.obtainNetworkName(obj);
  var w = Identity._walletFromObj(obj, this.storage, this.networks[networkName], this.blockchains[networkName]);
  this._checkVersion(w.version);
  this.addWallet(w, function(err) {
    if (err) return cb(err);
    w.store(cb);
  });
};

Identity.prototype.closeWallet = function(wid, cb) {
  var w = _.findWhere(this.openWallets, function(w) {
    w.id === wid;
  });
  preconditions.checkState(w);

  var self = this;
  w.close(function(err) {
    self.openWallets = _.without(self.openWallets, function(id) {
      id === wid
    });
    return cb(err);
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
  preconditions.checkState(this.profile);

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
    opts.nickname
  );
  log.debug('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: opts.networkName,
  });
  log.debug('\t### TxProposals Initialized');


  opts.storage = this.storage;
  opts.network = this.networks[opts.networkName];
  opts.blockchain = this.blockchains[opts.networkName];

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.reconnectDelay = opts.reconnectDelay || this.walletDefaults.reconnectDelay;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  opts.version = opts.version || this.version;

  if (opts.password)
    this.storage.setPassword(opts.password);

  var self = this;
  var w = Identity._newWallet(opts);
  this.addWallet(w, function(err) {
    if (err) return cb(err);
    self.openWallets.push(w);

    self.profile.setLastOpenedTs(w.id, function(err) {
      return cb(err, w);
    });
  });
};

// add wallet (import)
Identity.prototype.addWallet = function(wallet, cb) {
  preconditions.checkArgument(wallet);
  preconditions.checkArgument(wallet.getId);
  preconditions.checkArgument(cb);
  preconditions.checkState(this.profile);

  var self = this;
  self.profile.addWallet(wallet.getId(), {
    name: wallet.name
  }, function(err) {

    if (err) return cb(err);
    wallet.store(function(err) {
      return cb(err);
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
 * @desc Retrieve a wallet from the storage
 * @param {string} walletId - the id of the wallet
 * @param {string} password - the password  to decode it
 * @param {function} callback (err, {Wallet})
 * @return
 */
Identity.prototype.openWallet = function(walletId, password, cb) {
  console.log('[Identity.js.434:openWallet:]', walletId); //TODO
  preconditions.checkArgument(cb);
  var self = this;

  if (password)
    self.storage.setPassword(password);

  // TODO
  //  self.migrateWallet(walletId, password, function() {

  Identity._walletRead(walletId, self.storage, self.networks, self.blockchains, [], function(err, w) {
    if (err) return cb(err);
    self.openWallets.push(w);

    w.store(function(err) {
      self.profile.setLastOpenedTs(walletId, function() {
        return cb(err, w);
      });
    });
  });
  //  });
};


Identity.prototype.listWallets = function(a) {
  var ret = this.profile.listWallets();
  return ret;
};

/**
 * @desc Deletes this wallet. This involves removing it from the storage instance
 * @param {string} walletId
 * @callback cb
 * @return {err}
 */
Identity.prototype.deleteWallet = function(walletId, cb) {
  var self = this;

  Identity._walletDelete(walletId, this.storage, function(err) {
    if (err) return cb(err);
    self.profile.deleteWallet(walletId, function(err) {
      return cb(err);
    });
  })
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

  var joinNetwork = this.networks[decodedSecret.networkName];
  joinNetwork.cleanUp();

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

        walletOpts.privateKey = privateKey;
        walletOpts.nickname = opts.nickname || self.profile.name;

        if (opts.password)
          walletOpts.password = opts.password;

        self.createWallet(walletOpts, function(err, w) {

          if (w) {
            w.sendWalletReady(decodedSecret.pubKey);
          } else {
            if (!err) err = 'walletFull';
            log.info(err);
          }
          return cb(err, w);
        });
      }
    });
  });
};


module.exports = Identity;
