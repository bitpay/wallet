// core
module.exports.PublicKeyRing = require('./js/models/core/PublicKeyRing');
module.exports.TxProposal = require('./js/models/core/TxProposal');
module.exports.TxProposalsSet = require('./js/models/core/TxProposalsSet');
module.exports.PrivateKey = require('./js/models/core/PrivateKey');
module.exports.Passphrase = require('./js/models/core/Passphrase');
module.exports.HDPath = require('./js/models/core/HDPath');
module.exports.HDParams = require('./js/models/core/HDParams');


// components
var WebRTC = module.exports.WebRTC = require('./js/models/network/WebRTC');
var Insight = module.exports.Insight = require('./js/models/blockchain/Insight');
var StorageLocalEncrypted = module.exports.StorageLocalEncrypted = require('./js/models/storage/LocalEncrypted');

module.exports.WalletFactory = require('./js/models/core/WalletFactory');
module.exports.version = require('./version');
module.exports.API = require('./API');
