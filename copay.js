// core
module.exports.PublicKeyRing = require('./js/models/core/PublicKeyRing');
module.exports.TxProposal = require('./js/models/core/TxProposal');
module.exports.TxProposals = require('./js/models/core/TxProposals');
module.exports.PrivateKey = require('./js/models/core/PrivateKey');
module.exports.Passphrase = require('./js/models/core/Passphrase');
module.exports.HDPath = require('./js/models/core/HDPath');
module.exports.HDParams = require('./js/models/core/HDParams');


// components
var Async = module.exports.Async = require('./js/models/network/Async');
var Insight = module.exports.Insight = require('./js/models/blockchain/Insight');
var StorageEncrypted = module.exports.StorageEncrypted = require('./js/models/storage/Encrypted');

module.exports.WalletFactory = require('./js/models/core/WalletFactory');
module.exports.Wallet = require('./js/models/core/Wallet');
module.exports.WalletLock = require('./js/models/core/WalletLock');
module.exports.version = require('./version').version;
module.exports.commitHash = require('./version').commitHash;

// test hack :s, will fix 
module.exports.FakePayProServer = require('./test/mocks/FakePayProServer');
