var _ = require('lodash');
var bitcore = require('bitcore');
var events = require('events');
var inherits = require('inherits');
var preconditions = require('preconditions').singleton();

function ManagedAddress(opts) {
  preconditions.checkArgument(opts._base58);
  this._base58 = opts._base58;

  // TODO: preconditions.checkArgument(opts._derivationPath);
  // this._derivationPath = opts._derivationPath;

  /**
   * Stores all available unspent outputs associated with this address
   * Keys are "txid:index"
   * Values are unspent outputs, as received from Insight
   */
  this._outputs = {};

  /**
   * Signals that some outputs are being used in a transaction proposal
   * Keys are "txid:index"
   * Values are booleans (whether the output is locked).
   */
  this._proposalLocks = {};
}
inherits(ManagedAddress, events.EventEmitter);

function verifyHasAmountSat(output) {
  if (!output.amountSat) {
    output.amountSat = Math.round(output.amount * bitcore.util.COIN);
  }
}

function keyForOutput(output) {
  return output.txid + ':' + output.vout;
};

ManagedAddress.prototype.invalidateCache = function() {
  this._balanceCache = undefined;
  this._availableCache = undefined;
};

ManagedAddress.prototype.invalidateAvailableCache = function() {
  this._availableCache = undefined;
};

ManagedAddress.prototype.processOutput = function processOutput(output, silent) {
  preconditions.checkArgument(output.address === this._base58);
  verifyHasAmountSat(output);

  var key = keyForOutput(output);
  if (!this._outputs[key]) {
    this.invalidateCache();
    this._outputs[key] = output;
    if (!silent) {
      this.emit('balance', this.balance);
    }
  }
};

ManagedAddress.prototype.lockOutput = function lockOutput(output, silent) {
  var key = keyForOutput(output);
  if (!this._proposalLocks[key]) {
    this._proposalLocks[key] = true;
    this.invalidateAvailableCache();
    if (!silent) {
      this.emit('available', this.available);
    }
  }
};

ManagedAddress.prototype.unlockOutput = function unlockOutput(output, silent) {
  var key = keyForOutput(output);
  if (this._proposalLocks[key]) {
    this._proposalLocks[key] = undefined;
    this.invalidateAvailableCache();
    if (!silent) {
      this.emit('available', this.available);
    }
  }
};

ManagedAddress.prototype.removeOutput = function removeOutput(output, silent) {
  preconditions.checkArgument(output.address === this._base58);
  var key = keyForOutput(output);
  if (this._outputs[key]) {
    this._outputs[key] = undefined;
    this._proposalLocks[key] = undefined;
    this.invalidateCache();
    if (!silent) {
      this.emit('balance', this.balance);
    }
  }
};

// TODO: This is copied from Balance, maybe refactor
function retrieveSumAsCache(cachedName, elements, property) {
  if (!this[cachedName]) {
    var self = this;
    this[cachedName] = 0;
    _.each(this[elements], function(element) {
      if (!element) return;
      self[cachedName] += element[property];
    });
  }
  return this[cachedName];
}

/*
 * TODO: Out of scope for now
 * Object.defineProperty(ManagedAddress.prototype, owner);
 * Object.defineProperty(ManagedAddress.prototype, index);
 * Object.defineProperty(ManagedAddress.prototype, isChange);
 */

// FIXME: Keep a list of transaction ids and allow the user to ask if an address has been used (address.used -> boolean)

/**
 * @property ManagedAddress#balance
 * @returns {number} amount of satoshis in this address
 */
Object.defineProperty(ManagedAddress.prototype, 'balance', {
  enumerable: true, configurable: false,
  get: function() {
    return retrieveSumAsCache.call(this, '_balanceCache', '_outputs', 'amountSat');
  },
  set: _.noop
});

/**
 * @property ManagedAddress#available
 * @returns {number} amount of satoshis safe to spend in this address
 */
Object.defineProperty(ManagedAddress.prototype, 'available', {
  enumerable: true, configurable: false,
  get: function() {
    if (!this._availableCache) {
      var self = this;
      this._availableCache = 0;
      _.each(this._outputs, function(output) {
        if (!output) return;
        if (!self._proposalLocks[keyForOutput(output)]) {
          self._availableCache += output.amountSat;
        }
      });
    }
    return this._availableCache;
  },
  set: _.noop
});

module.exports = ManagedAddress;
