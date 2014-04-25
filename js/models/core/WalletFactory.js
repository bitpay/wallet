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
 *
 * var wallet = WF.read(config,walletId); -> always go to storage
 * var wallet = WF.create(config,walletId); -> create wallets, with the given ID (or random is not given)
 *
 * var wallet = WF.open(config,walletId); -> try to read walletId, if fails, create a new wallet with that id
 */

function WalletFactory(config) {
  var self = this;
  this.storage = new Storage(config.storage);
  this.network = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);

  this.networkName = config.networkName;
  this.verbose     = config.verbose;
  this.walletDefaults = config.wallet;
}

WalletFactory.prototype.log = function(){
  if (!this.verbose) return;
  if (console)
        console.log.apply(console, arguments);
};


WalletFactory.prototype._checkRead = function(walletId) {
  var s = this.storage;
  var ret = 
    (
      s.get(walletId, 'publicKeyRing') &&
      s.get(walletId, 'txProposals')   &&
      s.get(walletId, 'opts') &&
      s.get(walletId, 'privateKey')
    )?true:false;
  ;
  return ret?true:false;
};

WalletFactory.prototype.read = function(walletId) {
  if (! this._checkRead(walletId))
    return false;

  var s = this.storage;
  var opts = s.get(walletId, 'opts');
  opts.id = walletId;
  opts.publicKeyRing = new PublicKeyRing.fromObj(s.get(walletId, 'publicKeyRing'));
  opts.txProposals   = new TxProposals.fromObj(s.get(walletId, 'txProposals'));
  opts.privateKey    = new PrivateKey.fromObj(s.get(walletId, 'privateKey'));
  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;
  var w = new Wallet(opts);

  // JIC: Add our key
  try {
    w.publicKeyRing.addCopayer(
      w.privateKey.getExtendedPublicKeyString()
    );
  } catch (e) {
    // No really an error, just to be sure.
  }
  this.log('### WALLET OPENED:', w.id);
  return w;
};

WalletFactory.prototype.create = function(opts) {
  var s = WalletFactory.storage;
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
  opts.publicKeyRing.addCopayer(opts.privateKey.getExtendedPublicKeyString());
  this.log('\t### PublicKeyRing Initialized');

  opts.txProposals = opts.txProposals || new TxProposals({
    networkName: this.networkName,
  });
  this.log('\t### TxProposals Initialized');

  opts.storage = this.storage;
  opts.network = this.network;
  opts.blockchain = this.blockchain;
  opts.verbose = this.verbose;

  opts.spendUnconfirmed = opts.spendUnconfirmed || this.walletDefaults.spendUnconfirmed;
  opts.requiredCopayers = requiredCopayers;
  opts.totalCopayers = totalCopayers;
  var w = new Wallet(opts);
  w.store();
  return w;
};

WalletFactory.prototype.open = function(walletId, opts) {
  this.log('Opening walletId:' + walletId);
  opts = opts || {};
  opts.id = walletId;
  opts.verbose = this.verbose;
  var w = this.read(walletId) || this.create(opts);
  w.store();
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


WalletFactory.prototype.joinCreateSession = function(copayerId, cb) {
  var self = this;

  //Create our PrivateK
  var privateKey = new PrivateKey({ networkName: this.networkName });
  this.log('\t### PrivateKey Initialized');
  var opts = {
    copayerId: privateKey.getId(),
    signingKeyHex: privateKey.getSigningKey(),
  };
  self.network.cleanUp();
  self.network.start(opts, function() {
    self.network.connectTo(copayerId);
    self.network.on('onlyYou', function(sender, data) {
      return cb();
    });
    self.network.on('data', function(sender, data) {
      if (data.type ==='walletId') {
        data.opts.privateKey = privateKey;
        var w = self.open(data.walletId, data.opts);
        w.firstCopayerId = copayerId;
        return cb(w);
      }
    });
  });
};

module.exports = require('soop')(WalletFactory);
