
var FakeStorage = function(){
  this.storage = {};
}; 

FakeStorage.prototype.read = function (id) {
  return this.storage[id];
};

FakeStorage.prototype.save = function(id, payload) {
  this.storage[id] = payload;
}

module.exports = require('soop')(FakeStorage);
