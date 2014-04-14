'use strict';

var imports = require('soop').imports();

function Storage() {
  this.data = {};
}

// get value by key
Storage.prototype.get = function(k) {
  return JSON.parse(localStorage.getItem(k));
};

// set value for key
Storage.prototype.set = function(k,v) {
  localStorage.setItem(k, JSON.stringify(v));
};

// remove value for key
Storage.prototype.remove = function(k) {
  localStorage.removeItem(k);
};

// remove all values
Storage.prototype.clearAll = function() {
  localStorage.clear();
};     

module.exports = require('soop')(Storage);
