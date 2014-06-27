'use strict';

var imports = require('soop').imports();
var preconditions = require('preconditions').singleton();

function AddressIndex(opts) {
  opts = opts || {};
  this.walletId = opts.walletId;
  this.cosigner = opts.cosigner || 0;

  this.changeIndex = opts.changeIndex || 0;
  this.receiveIndex = opts.receiveIndex || 0;
}

AddressIndex.fromObj = function(data) {
  if (data instanceof AddressIndex) {
    throw new Error('bad data format: Did you use .toObj()?');
  }
  var ret = new AddressIndex(data);
  return ret;
};

AddressIndex.prototype.toObj = function() {
  return {
    walletId: this.walletId,
    cosigner: this.cosigner,
    changeIndex: this.changeIndex,
    receiveIndex: this.receiveIndex
  };
};

AddressIndex.prototype.checkRange = function(index, isChange) {
  if ((isChange && index > this.changeIndex) ||
    (!isChange && index > this.receiveIndex)) {
    throw new Error('Out of bounds at index ' + index + ' isChange: ' + isChange);
  }
};

AddressIndex.prototype.getChangeIndex = function() {
  return this.changeIndex;
};

AddressIndex.prototype.getReceiveIndex = function() {
  return this.receiveIndex;
};

AddressIndex.prototype.increment = function(isChange) {
  if (isChange) {
    this.changeIndex++;
  } else {
    this.receiveIndex++;
  }
};

AddressIndex.prototype.merge = function(inAddressIndex) {
  preconditions.shouldBeObject(inAddressIndex)
    .checkArgument(this.walletId == inAddressIndex.walletId)
    .checkArgument(this.cosigner == inAddressIndex.cosigner);

  var hasChanged = false;

  // Indexes
  if (inAddressIndex.changeIndex > this.changeIndex) {
    this.changeIndex = inAddressIndex.changeIndex;
    hasChanged = true;
  }

  if (inAddressIndex.receiveIndex > this.receiveIndex) {
    this.receiveIndex = inAddressIndex.receiveIndex;
    hasChanged = true;
  }
  return hasChanged;
};

module.exports = require('soop')(AddressIndex);
