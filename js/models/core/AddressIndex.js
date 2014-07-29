'use strict';

var preconditions = require('preconditions').singleton();
var Structure = require('./Structure');

function AddressIndex(opts) {
  opts = opts || {};
  this.cosigner = opts.cosigner
  this.changeIndex = opts.changeIndex || 0;
  this.receiveIndex = opts.receiveIndex || 0;

  if (typeof this.cosigner === 'undefined') {
    this.cosigner = Structure.SHARED_INDEX;
  }
}

AddressIndex.init = function(totalCopayers) {
  preconditions.shouldBeNumber(totalCopayers);
  var indexes = [new AddressIndex()];
  for (var i = 0 ; i < totalCopayers ; i++) {
    indexes.push(new AddressIndex({cosigner: i}));
  }
  return indexes;
}

AddressIndex.fromList = function(indexes) {
  return indexes.map(function(i) { return AddressIndex.fromObj(i); });
}

AddressIndex.fromObj = function(data) {
  if (data instanceof AddressIndex) {
    throw new Error('bad data format: Did you use .toObj()?');
  }
  return new AddressIndex(data);
};

AddressIndex.serialize = function(indexes) {
  return indexes.map(function(i) { return i.toObj(); });
}

AddressIndex.update = function(shared, totalCopayers) {
  var indexes = this.init(totalCopayers);
  indexes[0].changeIndex = shared.changeIndex;
  indexes[0].receiveIndex = shared.receiveIndex;
  return this.serialize(indexes);
};

AddressIndex.prototype.toObj = function() {
  return {
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

module.exports = AddressIndex;
