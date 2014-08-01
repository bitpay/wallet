'use strict';

var preconditions = require('preconditions').singleton();
var HDPath = require('./HDPath');

function HDParams(opts) {
  opts = opts || {};

  //opts.cosigner is for backwards compatibility only
  this.copayerIndex = typeof opts.copayerIndex === 'undefined' ?  opts.cosigner : opts.copayerIndex;
  this.changeIndex = opts.changeIndex || 0;
  this.receiveIndex = opts.receiveIndex || 0;

  if (typeof this.copayerIndex === 'undefined') {
    this.copayerIndex = HDPath.SHARED_INDEX;
  }
}

HDParams.init = function(totalCopayers) {
  preconditions.shouldBeNumber(totalCopayers);
  var ret = [new HDParams({receiveIndex: 1})];
  for (var i = 0 ; i < totalCopayers ; i++) {
    ret.push(new HDParams({copayerIndex: i}));
  }
  return ret;
}

HDParams.fromList = function(hdParams) {
  return hdParams.map(function(i) { return HDParams.fromObj(i); });
}

HDParams.fromObj = function(data) {
  if (data instanceof HDParams) {
    throw new Error('bad data format: Did you use .toObj()?');
  }
  return new HDParams(data);
};

HDParams.serialize = function(hdParams) {
  return hdParams.map(function(i) { return i.toObj(); });
}

HDParams.update = function(shared, totalCopayers) {
  var hdParams = this.init(totalCopayers);
  hdParams[0].changeIndex = shared.changeIndex;
  hdParams[0].receiveIndex = shared.receiveIndex;
  return this.serialize(hdParams);
};

HDParams.prototype.toObj = function() {
  return {
    copayerIndex: this.copayerIndex,
    changeIndex: this.changeIndex,
    receiveIndex: this.receiveIndex
  };
};

HDParams.prototype.checkRange = function(index, isChange) {
  if ((isChange && index > this.changeIndex) ||
      (!isChange && index > this.receiveIndex)) {
    throw new Error('Out of bounds at index ' + index + ' isChange: ' + isChange);
  }
};

HDParams.prototype.getChangeIndex = function() {
  return this.changeIndex;
};

HDParams.prototype.getReceiveIndex = function() {
  return this.receiveIndex;
};

HDParams.prototype.increment = function(isChange) {
  if (isChange) {
    this.changeIndex++;
  } else {
    this.receiveIndex++;
  }
};

HDParams.prototype.merge = function(inHDParams) {
  preconditions.shouldBeObject(inHDParams)
  .checkArgument(this.copayerIndex == inHDParams.copayerIndex);

  var hasChanged = false;

  if (inHDParams.changeIndex > this.changeIndex) {
    this.changeIndex = inHDParams.changeIndex;
    hasChanged = true;
  }

  if (inHDParams.receiveIndex > this.receiveIndex) {
    this.receiveIndex = inHDParams.receiveIndex;
    hasChanged = true;
  }
  return hasChanged;
};

module.exports = HDParams;
