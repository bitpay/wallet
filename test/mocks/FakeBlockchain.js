'use strict';

var bitcore = require('bitcore');

function FakeBlockchain(opts) {
  opts = opts || {};
}

FakeBlockchain.prototype.getTransaction = function(txid, cb) {
  return cb(null, {txid: txid});
};

FakeBlockchain.prototype.getTransactions = function(addresses, cb) {
  cb(null, []);
};

FakeBlockchain.prototype.subscribe = function() {
};

FakeBlockchain.prototype.fixUnspent = function(u) {
  this.u = u;
};

FakeBlockchain.prototype.destroy = function() {
};

FakeBlockchain.prototype.getUnspent = function(addresses, cb) {
  return cb(null, this.u || [{
    'address': 'mji7zocy8QzYywQakwWf99w9bCT6orY1C1',
    'txid': '0be0fb4579911be829e3077202e1ab47fcc12cf3ab8f8487ccceae768e1f95fa',
    'vout': 0,
    'ts': 1402323949,
    'scriptPubKey': '21032ca453c1d9a93b7de8cf3d44d7bb8d52a45dbdf8fff63f69de4e51b740bb1da3ac',
    'amount': 25.0001,
    'confirmations': 0,
    'confirmationsFromCache': false
  }]);
};

FakeBlockchain.prototype.getUnspent2 = function(addresses, cb) {
  return cb(null, this.u || [{
    'address': 'mji7zocy8QzYywQakwWf99w9bCT6orY1C1',
    'txid': '0be0fb4579911be829e3077202e1ab47fcc12cf3ab8f8487ccceae768e1f95fa',
    'vout': 0,
    'ts': 1402323949,
    'scriptPubKey': '21032ca453c1d9a93b7de8cf3d44d7bb8d52a45dbdf8fff63f69de4e51b740bb1da3ac',
    'amount': 25.0001,
    'confirmations': 1,
    'confirmationsFromCache': false
  }]);
};

FakeBlockchain.prototype.broadcast = function(rawtx, cb) {
  var txid = '0be0fb4579911be829e3077202e1ab47fcc12cf3ab8f8487ccceae768e1f95fa';
  return cb(null, txid);
};

FakeBlockchain.prototype.checkSentTx = function (tx, cb) {
  var txid = '0be0fb4579911be829e3077202e1ab47fcc12cf3ab8f8487ccceae768e1f95fa';
  return cb(null, txid);  
};

module.exports = FakeBlockchain;
