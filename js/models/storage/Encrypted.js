'use strict';

var imports = require('soop').imports();

function Storage() {
  // TODO
}

// get value by key
Storage.prototype.get = function(k) {
  // TODO
};

// set value for key
Storage.prototype.set = function(k,v) {
  // TODO
};

// remove value for key
Storage.prototype.remove = function(k) {
  // TODO
};

// remove all values
Storage.prototype.clearAll = function() {
  // TODO
};     

module.exports = require('soop')(Storage);
