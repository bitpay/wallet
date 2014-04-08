
var FakeStorage = function(){
  this.storage = {};
}; 

FakeStorage.prototype.set = function (id) {
  return this.storage[id];
};

FakeStorage.prototype.get = function(id, payload) {
  this.storage[id] = payload;
}

module.exports = require('soop')(FakeStorage);
