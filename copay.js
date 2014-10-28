// core
module.exports.PublicKeyRing = require('./js/models/PublicKeyRing');
module.exports.TxProposal = require('./js/models/TxProposal');
module.exports.TxProposals = require('./js/models/TxProposals');
module.exports.PrivateKey = require('./js/models/PrivateKey');
module.exports.HDPath = require('./js/models/HDPath');
module.exports.HDParams = require('./js/models/HDParams');


// components
var Async = module.exports.Async = require('./js/models/Async');
var Insight = module.exports.Insight = require('./js/models/Insight');

module.exports.Identity = require('./js/models/Identity');
module.exports.Wallet = require('./js/models/Wallet');
module.exports.Compatibility = require('./js/models/Compatibility');
module.exports.PluginManager = require('./js/models/PluginManager');
module.exports.version = require('./version').version;
module.exports.commitHash = require('./version').commitHash;

// test hack :s, will fix 
module.exports.FakePayProServer = require('./test/mocks/FakePayProServer');
