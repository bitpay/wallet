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
      db: opts.pluginManager.get('DB')
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

  this.networks = {
    'livenet': Identity._newInsight(opts.network.livenet),
    'testnet': Identity._newInsight(opts.network.testnet),
  };
  this.blockchains = {
    'livenet': Identity._newInsight(opts.network.livenet),
    'testnet': Identity._newInsight(opts.network.testnet),
  };

  this.walletDefaults = opts.wallet || {};
  this.version = opts.version || version;

  this.wallets = [];
  this.profile = Identity._newProfile({
    email: email,
  }, password, this.storage);
};


/* for stubbing */
Identity._newProfile = function(info, password, storage) {
  return new Profile(info, password, storage);
};

/* for stubbing */
Identity._newInsight = function(opts) {
  return new Insight(opts);
};


/* for stubbing */
Identity._newStorage = function(opts) {
  return new Storage(opts);
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
  var iden = new Identity(email, password, opts);
  iden.store({
    overwrite: false,
  }, function(err) {
    return cb(err, iden);
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
  iden.read(function(err) {
    return cb(err, iden);
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
  var self = this;
  self.profile.store(opts, function(err) {
    if (err) return cb(err);

    var l = self.wallets.length,
      i = 0;
    if (!l) return cb();

    _.each(self.wallets, function(w) {
      w.store(function(err) {
        if (err) return cb(err);

        if (++i == l)
          return cb();
      })
    });
  });
};


/**
 * @desc obtain network name from serialized wallet
 * @param {Object} wallet object
 * @return {string} network name
 */
Identity.prototype.obtainNetworkName = function(obj) {
  return obj.networkName ||
    (obj.opts ? obj.opts.networkName : null) ||
    (obj.publicKeyRing ? obj.publicKeyRing.networkName : null) ||
    obj.privateKey.networkName;
};

/**
 * @desc Deserialize an object to a Wallet
 * @param {Object} wallet object
 * @param {string[]} skipFields - fields to skip when importing
 * @return {Wallet}
 */
Identity.prototype._fromObj = function(inObj, skipFields) {
  var networkName = this.obtainNetworkName(inObj);
  preconditions.checkState(networkName);
  preconditions.checkArgument(inObj);

  var obj = JSON.parse(JSON.stringify(inObj));

  // not stored options
  obj.opts = obj.opts || {};
  obj.opts.reconnectDelay = this.walletDefaults.reconnectDelay;

  skipFields = skipFields || [];
  skipFields.forEach(function(k) {
    if (obj[k]) {
      delete obj[k];
    } else
      throw new Error('unknown field:' + k);
  });

  var w = Wallet.fromObj(obj, this.storage, this.networks[networkName], this.blockchains[networkName]);
  if (!w) return false;
  this._checkVersion(w.version);
  return w;
};

/**
 * @desc Imports a wallet from an encrypted base64 object
 * @param {string} base64 - the base64 encoded object
 * @param {string} passphrase - passphrase to decrypt it
 * @param {string[]} skipFields - fields to ignore when importing
 * @return {Wallet}
 */
Identity.prototype.importWallet = function(base64, passphrase, skipFields) {
  this.storage.setPassphrase(passphrase);
  var walletObj = this.storage.import(base64);
  if (!walletObj) return false;
  return this.fromObj(walletObj, skipFields);
};

Identity.prototype.migrateWallet = function(walletId, passphrase, cb) {
  var self = this;

  self.storage.setPassphrase(passphrase);
  self.read_Old(walletId, null, function(err, wallet) {
    if (err) return cb(err);

    wallet.store(function(err) {
      if (err) return cb(err);

      self.storage.deleteWallet_Old(walletId, function(err) {
        if (err) return cb(err);

        self.storage.removeGlobal('nameFor::' + walletId, function() {
          return cb();
        });
      });
    });
  });

};


/**
 * @desc Retrieve a wallet from storage
 * @param {string} walletId - the wallet id
 * @param {string[]} skipFields - parameters to ignore when importing
 * @param {function} callback - {err, Wallet}
 */
Identity.prototype._readWallet = function(walletId, skipFields, cb) {
  var self = this,
    err;
  var obj = {};

  this.storage.getFirst('wallet::' + walletId, function(err, ret) {
    if (err) return cb(err);

    _.each(Wallet.PERSISTED_PROPERTIES, function(p) {
      obj[p] = ret[p];
    });

    if (!_.any(_.values(obj)))
      return cb(new Error('Wallet not found'));

    var w, err;
    obj.id = walletId;
    try {
      w = self.fromObj(obj, skipFields);
    } catch (e) {
      if (e && e.message && e.message.indexOf('MISSOPTS')) {
        err = new Error('Could not read: ' + walletId);
      } else {
        err = e;
      }
      w = null;
    }
    return cb(err, w);
  });
};

Identity.prototype.read_Old = function(walletId, skipFields, cb) {
  var self = this,
    err;
  var obj = {};

  this.storage.readWallet_Old(walletId, function(err, ret) {
    if (err) return cb(err);

    _.each(Wallet.PERSISTED_PROPERTIES, function(p) {
      obj[p] = ret[p];
    });

    if (!_.any(_.values(obj)))
      return cb(new Error('Wallet not found'));

    var w, err;
    obj.id = walletId;
    try {
      w = self.fromObj(obj, skipFields);
    } catch (e) {
      if (e && e.message && e.message.indexOf('MISSOPTS')) {
        err = new Error('Could not read: ' + walletId);
      } else {
        err = e;
      }
      w = null;
    }
    return cb(err, w);
  });
};

/**
 * @desc This method instantiates a wallet. Usefull for stubbing.
 *
 * @param {opts} opts, ready for new Wallet(opts)
 *
 */


Identity.prototype._newWallet = function(opts) {
  return new Wallet(opts);
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
 * @param {string} opts.passphrase
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

  this.storage.setPassphrase(opts.passphrase);


  var self = this;
  var w = this._newWallet(opts);
  this.profile.addWallet(w.id, function(err) {
    if (err) return cb(err);
    w.store(function(err) {
      if (err) return cb(err);
      self.profile.setLastOpenedTs(w.id, function(err) {
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
 * @desc Retrieve a wallet from the storage
 * @param {string} walletId - the id of the wallet
 * @param {string} passphrase - the passphrase to decode it
 * @param {function} callback (err, {Wallet})
 * @return
 */
Identity.prototype.openWallet = function(walletId, passphrase, cb) {
  preconditions.checkArgument(cb);
  var self = this;
  self.storage.setPassphrase(passphrase);

  self.migrateWallet(walletId, passphrase, function() {
    self._readWallet(walletId, null, function(err, w) {
      if (err) return cb(err);

      w.store(function(err) {
        self.profile.setLastOpenedTs(walletId, function() {
          return cb(err, w);
        });
      });
    });
  });
};


Identity.prototype.listWallets = function() {
  return this.profile.listWallets();
};

/**
 * @desc Deletes this wallet. This involves removing it from the storage instance
 * @param {string} walletId
 * @callback cb
 * @return {err}
 */
Identity.prototype.deleteWallet = function(walletId, cb) {
  var self = this;

  Wallet.delete(walletId, this.storage, function(err) {
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
 * @param {string} opts.passphrase - a passphrase to use to encrypt the wallet for persistance
 * @param {string} opts.nickname - a nickname for the current user
 * @param {string} opts.privateHex - the private extended master key
 * @param {walletCreationCallback} cb - a callback
 */
Identity.prototype.joinWallet = function(opts, cb) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.secret);
  preconditions.checkArgument(opts.passphrase);
  preconditions.checkArgument(opts.nickname);
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
        walletOpts.nickname = opts.nickname;
        walletOpts.passphrase = opts.passphrase;

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
