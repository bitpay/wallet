'use strict';

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');

var log = require('../../log');

var Async = module.exports.Async = require('../network/Async');
var Insight = module.exports.Insight = require('../blockchain/Insight');
var StorageLocalEncrypted = module.exports.StorageLocalEncrypted = require('../storage/LocalEncrypted');

/*
 * WalletFactory
 *
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
}

WalletFactory.prototype._checkRead = function(walletId) {
  var s = this.storage;
  var ret =
    s.get(walletId, 'publicKeyRing') &&
    s.get(walletId, 'txProposals') &&
    s.get(walletId, 'opts') &&
    s.get(walletId, 'privateKey');
  return !!ret;
};

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

WalletFactory.prototype.fromEncryptedObj = function(base64, password, skipFields) {
  this.storage._setPassphrase(password);
  var walletObj = this.storage.import(base64);
  if (!walletObj) return false;
  var w = this.fromObj(walletObj, skipFields);
  return w;
};

WalletFactory.prototype.import = function(base64, password, skipFields) {
  var self = this;
  var w = self.fromEncryptedObj(base64, password, skipFields);

  if (!w) throw new Error('Wrong password');
  return w;
}

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


WalletFactory.prototype._checkNetwork = function(inNetworkName) {
  if (this.networkName !== inNetworkName) {
    throw new Error('This Wallet is configured for ' + inNetworkName + ' while currently Copay is configured for: ' + this.networkName + '. Check your settings.');
  }
};


WalletFactory.prototype.open = function(walletId, passphrase) {
  this.storage._setPassphrase(passphrase);
  var w = this.read(walletId);
  if (w) 
    w.store();

  this.storage.setLastOpened(walletId);
  return w;
};

WalletFactory.prototype.getWallets = function() {
  var ret = this.storage.getWallets();
  ret.forEach(function(i) {
    i.show = i.name ? ((i.name + ' <' + i.id + '>')) : i.id;
  });
  return ret;
};

WalletFactory.prototype.delete = function(walletId, cb) {
  var s = this.storage;
  s.deleteWallet(walletId);
  s.setLastOpened(undefined);
  return cb();
};

WalletFactory.prototype.decodeSecret = function(secret) {
  try {
    return Wallet.decodeSecret(secret);
  } catch (e) {
    return false;
  }
};


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
    key: privateKey.getIdKey()
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
    self.network.greet(s.pubKey);
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
      }
    });
  });
};

module.exports = WalletFactory;
