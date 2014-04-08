'use strict';

var imports = require('soop').imports();

function Storage() {
  this.data = {};
}

Storage.prototype.get = function(k) {
  return JSON.parse(localStorage.getItem(k));
};

Storage.prototype.set = function(k,v) {
  localStorage.setItem(k, JSON.stringify(v));
};
 
Storage.prototype.remove = function(k) {
  localStorage.removeItem(k);
};


Storage.prototype.clearAll = function() {
  localStorage.clear();
};     

module.exports = require('soop')(Storage);
