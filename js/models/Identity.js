var inherits = require('inherits'),
      events = require('events');

/**
 * Identity: Stores the user's private key and all of his wallets (1 for now)
 *
 * @extends {events.EventEmitter}
 * @param {Object} opts
 * @param {string} opts.xprivkey - the private key, a string, base58encoded as in BIP32
 * @param {Profile} opts.profile - this user's public profile
 * @param {string} opts.password - this user's selected password (used for encryption)
 * @param {Wallet[]} opts.wallets - this user's wallet
 *
 * @emits updated
 */
function Identity(opts) {
  events.EventEmitter.call(this);
  _.extend(this, opts);
  this.profile.on('updated', function() {
    this.trigger('updated', this);
  }, this);
}
inherits(Identity, events.EventEmitter);

/**
 * Synchronous method that returns this Identity's associated wallets.
 *
 * @returns {Wallet[]}
 */
Identity.prototype.getWallets = function() {
  return _.clone(this.wallets);
};

/**
 * Asynchronous method that creates a new Wallet
 */
Identity.prototype.createWallet = function(callback) {
};

/**
 * Asynchronous method that joins a new Wallet
 */
Identity.prototype.joinWallet = function(walletId, secret, opts, callback) {
};

