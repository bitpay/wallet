
// core
module.exports.PublicKeyRing = require('./js/models/core/PublicKeyRing');
module.exports.TxProposals = require('./js/models/core/TxProposals');
module.exports.PrivateKey = require('./js/models/core/PrivateKey');

// components
var WebRTC = module.exports.WebRTC = require('./js/models/network/WebRTC');
var Insight = module.exports.Insight = require('./js/models/blockchain/Insight');
var StoragePlain = module.exports.StoragePlain = require('./js/models/storage/Plain');

module.exports.Wallet = require('soop').load('./js/models/core/Wallet',{
  Network: WebRTC,
  Blockchain: Insight,
  Storage: StoragePlain,
});

