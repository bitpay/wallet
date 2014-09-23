'use strict';


var bitcore = require('bitcore');
var Transaction = bitcore.Transaction;

function BuilderMockV0 (data) {
  this.vanilla = data;
  this.tx = new Transaction();
  this.tx.parse(new Buffer(data.tx, 'hex'));
};

BuilderMockV0.prototype.build = function() {
  return this.tx;
}; 


BuilderMockV0.prototype.getSelectedUnspent = function() {
  return [];
};

BuilderMockV0.prototype.toObj = function() {
  return this.vanilla;
};

module.exports = BuilderMockV0;
