
var FakeStorage = function(){
  this.storage = {};
}; 

FakeStorage.prototype.set = function (id, payload) {
  this.storage[id] = payload;
};

FakeStorage.prototype.get = function(id) {
  return this.storage[id];
}

module.exports = require('soop')(FakeStorage);
