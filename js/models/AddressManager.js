var _ = require('lodash');
var events = require('events');
var inherits = require('inherits');
var preconditions = require('preconditions').singleton();

var ManagedAddress = require('./ManagedAddress');

/**
 * @param {Object} opts
 * @constructor
 *
 * @emits ready - no arguments
 * @emits address - argument is the new ManagedAddress created
 * @emits balance - argument is balance in satoshis
 * @emits available - argument is available balance in satoshis
 */
function AddressManager(opts) {
  /**
   * Maps from Address (a string, not the bitcore Address) to ManagedAddress
   */
  this.addresses = {};
  this._silentMode = false;
}
inherits(AddressManager, events.EventEmitter);

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

/**
 * @property AddressManager#balance
 * @returns {number} amount of satoshis in all managed addresses
 */
Object.defineProperty(AddressManager.prototype, 'balance', {
  enumerable: true, configurable: false, set: _.noop,
  get: function() {
    return retrieveSumAsCache.call(this, '_balanceCache', 'addresses', 'balance');
  }
});

/**
 * @property AddressManager#available
 * @returns {number} amount of satoshis safe to spend in all managed addresses
 */
Object.defineProperty(AddressManager.prototype, 'available', {
  enumerable: true, configurable: false, set: _.noop,
  get: function() {
    return retrieveSumAsCache.call(this, '_availableCache', 'addresses', 'available');
  }
});

AddressManager.prototype.processOutputs = function processOutputs(unspent, silent) {
  var self = this;
  _.each(unspent, function(unspent) {
    self.processOutput(unspent, silent);
  });
  self.emit('ready');
};

AddressManager.prototype.processOutput = function processOutput(output, silent) {
  var oldBalance = this.balance;
  var address = output.address;
  preconditions.checkState(address);

  if (!this.addresses[address]) {
    this.addresses[address] = this.createAddress(address);
  }
  this.invalidateCache();
  this.addresses[address].processOutput(output, silent);
};

AddressManager.prototype.createAddress = function createAddress(base58) {
  var address = new ManagedAddress({_base58: base58});
  var self = this;
  address.on('balance', function() {
    self.invalidateCache();
    self.emit('balance', self.balance);
  });
  address.on('available', function() {
    self.invalidateAvailableCache();
    self.emit('available', self.available);
  });
  return address;
};

function outputOperation(operationName) {
  return function(output, silent) {
    var address = output.address;
    preconditions.checkArgument(address);
    if (!this.addresses[address]) {
      this.addresses[address] = this.createAddress(address);
    }
    this.addresses[address][operationName](output, silent);
  };
}

AddressManager.prototype.removeOutput = outputOperation('removeOutput');

AddressManager.prototype.lockOutput = outputOperation('lockOutput');

AddressManager.prototype.unlockOutput = outputOperation('unlockOutput');

AddressManager.prototype.filter = function filter(filterParams) {
  var addresses = _.values(this.addresses);
  if (!_.size(filterParams)) {
    return addresses;
  }
  if (!_.isUndefined(filterParams.balance)) {
    addresses = _.filter(addresses, function(managedAddress) {
      return !(filterParams.balance ^ !!managedAddress.balance);
    });
  }
  if (!_.isUndefined(filterParams.available)) {
    addresses = _.filter(addresses, function(managedAddress) {
      return !(filterParams.available ^ !!managedAddress.available);
    });
  }
  return addresses;
};

AddressManager.prototype.invalidateCache = function() {
  this._balanceCache = null;
  this._availableCache = null;
};

AddressManager.prototype.invalidateAvailableCache = function() {
  this._availableCache = null;
};

module.exports = AddressManager;
