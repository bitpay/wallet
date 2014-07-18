// core
module.exports.PublicKeyRing = require('./js/models/core/PublicKeyRing');
module.exports.TxProposals = require('./js/models/core/TxProposals');
module.exports.PrivateKey = require('./js/models/core/PrivateKey');
module.exports.Passphrase = require('./js/models/core/Passphrase');
module.exports.Structure = require('./js/models/core/Structure');
module.exports.AddressIndex = require('./js/models/core/AddressIndex');


// components
var STOMP = module.exports.STOMP = require('./js/models/network/STOMP');
var Insight = module.exports.Insight = require('./js/models/blockchain/Insight');
var StorageLocalEncrypted = module.exports.StorageLocalEncrypted = require('./js/models/storage/LocalEncrypted');

module.exports.WalletFactory = require('./js/models/core/WalletFactory');
module.exports.version = require('./version');
//module.exports.API = require('./API');
