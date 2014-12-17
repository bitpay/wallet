#!/usr/bin/env node

var modules = [
  'lib/Address',
  'lib/AuthMessage',
  'lib/Base58',
  'lib/HierarchicalKey',
  'lib/BIP21',
  'lib/Deserialize',
  'lib/ECIES',
  'lib/Message',
  'lib/Opcode',
  'lib/PayPro',
  'lib/PrivateKey',
  'lib/Key',
  'lib/Point',
  'lib/SIN',
  'lib/SINKey',
  'lib/Script',
  'lib/SecureRandom',
  'lib/sjcl',
  'lib/Transaction',
  'lib/TransactionBuilder',
  'lib/Wallet',
  'lib/WalletKey',
  'patches/Buffers.monkey',
  'patches/Number.monkey',
  'config',
  'const',
  'networks',
  'util/log',
  'util/util',
  'util/EncodedData',
  'util/VersionedData',
];


var cmd = 'node browser/build.js -s '
cmd = cmd + modules.join(',');

console.log(cmd);
