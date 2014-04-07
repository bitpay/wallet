'use strict';

var imports = require('soop').imports();

function Storage() {
  this.data = {};
}

Storage.prototype.read = function(k) {
  return this.data[k];
};

Storage.prototype.save = function(k,v) {
  this.data[k]=v;
};


module.exports = require('soop')(Storage);
