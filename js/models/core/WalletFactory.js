'use strict';

var imports     = require('soop').imports();
var Storage     = imports.Storage;
var Network     = imports.Network;
var Blockchain  = imports.Blockchain;

var TxProposals = require('./TxProposals');
var PublicKeyRing = require('./PublicKeyRing');
var PrivateKey = require('./PrivateKey');
var Wallet = require('./Wallet');

/*
 * WalletFactory
 *
 */

function WalletFactory(config, version) {
  var self = this;
  config = config || {};
  console.log('asd');

  this.storage = new Storage(config.storage);
  this.network = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);

  this.networkName = config.networkName;
  this.verbose     = config.verbose;
  this.walletDefaults = config.wallet;
  this.version     = version;
}

WalletFactory.prototype.log = function(){
  if (!this.verbose) return;
  if (console) {
    console.log.apply(console, arguments);
  }
};


WalletFactory.prototype._checkRead = function(walletId) {
  var s = this.storage;
  var ret = 
      s.get(walletId, 'publicKeyRing') &&
      s.get(walletId, 'txProposals')   &&
      s.get(walletId, 'opts') &&
      s.get(walletId, 'privateKey');
  return !!ret;
};

WalletFactory.prototype.fromObj = function(obj) {
  var w = Wallet.fromObj(obj, this.storage, this.network, this.blockchain);
  w.verbose = this.verbose;
  return w;
};

WalletFactory.prototype.fromEncryptedObj = function(base64, password) {
  this.storage._setPassphrase(password);
  var walletObj = this.storage.import(base64);
  if (!walletObj) return false;
  var w = this.fromObj(walletObj);
  if (!w) return false;
  return w;
};

WalletFactory.prototype.read = function(walletId) {
  if (! this._checkRead(walletId))
    return false;

  var obj = {};
  var s = this.storage;

  obj.id = walletId;
  obj.opts = s.get(walletId, 'opts');
  obj.publicKeyRing = s.get(walletId, 'publicKeyRing');
  obj.txProposals   = s.get(walletId, 'txProposals');
  obj.privateKey    = s.get(walletId, 'privateKey');

  var w = this.fromObj(obj);
  return w;
};

WalletFactory.prototype.create = function(opts) {
  opts    = opts || {};
  this.log('### CREATING NEW WALLET.' + 
           (opts.id ? ' USING ID: ' + opts.id : ' NEW ID') + 
           (opts.privateKey ? ' USING PrivateKey: ' + opts.privateKey.getId() : ' NEW PrivateKey')
          );

  opts.privateKey = opts.privateKey ||  new PrivateKey({ networkName: this.networkName });

  var requiredCopayers = opts.requiredCopayers || this.walletDefaults.requiredCopayers;
  var totalCopayers =  opts.totalCopayers || this.walletDefaults.totalCopayers;

  opts.publicKeyRing = opts.publicKeyRing || new PublicKeyRing({
    networkName: this.networkName,
    requiredCopayers: requiredCopayers,
    totalCopayers: totalCopayers,
  });
  opts.publicKeyRing.addCopayer(
    opts.privateKey.deriveBIP45Branch().extendedPublicKeyString(),
    opts.nickname);
  this.log('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: this.networkName,
  });
  this.log('\t### TxProposals Initialized');

  this.storage._setPassphrase(opts.passphrase);

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.reconnectDelay = opts.reconnectDelay || this.walletDefaults.reconnectDelay;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  opts.version       = opts.version || this.version;
  var w = new Wallet(opts);
  w.store();
  return w;
};


WalletFactory.prototype._checkVersion = function(inVersion) {
  var thisV = this.version.split('.');
  var thisV0 = parseInt(thisV[0]);
  var inV   = inVersion.split('.');
  var inV0  = parseInt(inV[0]);

  //We only check for major version differences
  if( thisV0 < inV0 ) {
    throw new Error('Major difference in software versions' +
                    '. Received:' + inVersion +
                    '. Current version:' + this.version +
                    '. Aborting.');
  }
};

WalletFactory.prototype.open = function(walletId, opts) {
  opts = opts || {};
  opts.id = walletId;
  opts.verbose = this.verbose;
  this.storage._setPassphrase(opts.passphrase);

  var w = this.read(walletId);
  if (w) {
    this._checkVersion(w.version);
    w.store();
  }
  return w;
};

WalletFactory.prototype.getWallets = function() {
  var ret = this.storage.getWallets();
  ret.forEach(function(i) {
    i.show = i.name ? ( (i.name + ' <'+i.id+'>') ) : i.id;
  });
  return ret;
};

WalletFactory.prototype.remove = function(walletId) {
  // TODO remove wallet contents
  this.log('TODO: remove wallet contents');
};

WalletFactory.prototype.decodeSecret = function(secret) {
  try {
    return Wallet.decodeSecret(secret);
  } catch (e) {
    return false;
  }
}


WalletFactory.prototype.joinCreateSession = function(secret, nickname, passphrase, cb) {
  var self = this;

  var s = self.decodeSecret(secret);
  if (!s) return cb('badSecret');
  
  //Create our PrivateK
  var privateKey = new PrivateKey({ networkName: this.networkName });
  this.log('\t### PrivateKey Initialized');
  var opts = {
    copayerId: privateKey.getId(),
    netKey: s.netKey,
  };
  self.network.cleanUp();
  self.network.start(opts, function() {
    self.network.connectTo(s.pubKey);

    // This is a hack to reconize if the connection was rejected or the peer wasn't there.
    var connectedOnce = false;
    self.network.on('connected', function(sender, data) {
      connectedOnce = true;
    });
    self.network.on('onlyYou', function(sender, data) {
      return cb(connectedOnce ? 'walletFull' : 'joinError');
    });
    self.network.on('data', function(sender, data) {
      if (data.type ==='walletId') {
        data.opts.privateKey = privateKey;
        data.opts.nickname =  nickname;
        data.opts.passphrase = passphrase;
        data.opts.id = data.walletId;
        var w = self.create(data.opts);
        w.seedCopayer(s.pubKey);
        return cb(null, w);
      }
    });
  });
};

module.exports = require('soop')(WalletFactory);
