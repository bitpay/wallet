
// core
module.exports.PublicKeyRing = require('./js/models/core/PublicKeyRing');
module.exports.TxProposals = require('./js/models/core/TxProposals');
module.exports.PrivateKey = require('./js/models/core/PrivateKey');

// components
var WebRTC = require('./js/models/network/WebRTC');
var Plain = require('./js/models/storage/Plain');
var Insight = require('./js/models/blockchain/Insight');

module.exports.Wallet = require('soop').load('./js/models/core/Wallet',{
  Network: WebRTC,
  Storage: Plain,
  Blockchain: Insight,
});


