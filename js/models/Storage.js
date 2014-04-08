'use strict';

var imports = require('soop').imports();

function Storage() {
  this.data = {};
}

Storage.prototype.get = function(k) {
  return this.data[k];
};

Storage.prototype.set = function(k,v) {
  this.data[k]=v;
};


module.exports = require('soop')(Storage);
