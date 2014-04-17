
var FakeStorage = function(){
  this.storage = {};
}; 

FakeStorage.prototype.setGlobal = function (id, payload) {
  this.storage[id] = payload;
};

FakeStorage.prototype.getGlobal = function(id) {
  return this.storage[id];
}

FakeStorage.prototype.set = function (wid, id, payload) {
  this.storage[wid + '-' + id] = payload;
};

FakeStorage.prototype.get = function(wid, id) {
  return this.storage[wid + '-' +id];
}

FakeStorage.prototype.clear = function() {
  delete this['storage'];
}

FakeStorage.prototype.getWalletIds = function() {
  return [];
};

FakeStorage.prototype.setFromObj = function(walletId, obj) {
  for (var i in obj) {
    this.storage[walletId + '-' + i] = obj[i];
  };
};

module.exports = require('soop')(FakeStorage);
