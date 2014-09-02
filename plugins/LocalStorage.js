'use strict';

function LocalStorage() {
  this.type = 'STORAGE';
};

LocalStorage.prototype.init = function() {
  console.log(' init LocalStorage'); //TODO
};


LocalStorage.prototype.getItem = function(k) {
  return localStorage.getItem(k);
};

LocalStorage.prototype.setItem = function(k,v) {
  localStorage.setItem(k,v);
};

LocalStorage.prototype.removeItem = function(k) { 
  localStorage.removeItem(k);
};

LocalStorage.prototype.clear = function() { 
  localStorage.clear();
};

delete LocalStorage.prototype.length;

Object.defineProperty(LocalStorage.prototype, 'length', {
  get: function() {
    return localStorage.length;
  }
});

LocalStorage.prototype.key = function(k) {
  var v = localStorage.key(k);
  return v;
};


module.exports = LocalStorage;
