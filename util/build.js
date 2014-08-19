#!/usr/bin/env node

'use strict';

var fs = require('fs');
var browserify = require('browserify');
var exec = require('child_process').exec;
var puts = function(error, stdout, stderr) {
  if (error) console.log(error);
};

var createVersion = function() {
  var json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  var content = 'module.exports="' + json.version + '";';
  fs.writeFileSync("./version.js", content);
};

var createBundle = function(opts) {
  opts.dir = opts.dir || 'js/';

  var bopts = {
    debug: true,
    standalone: 'copay',
    insertGlobals: true
  };
  var b = browserify(bopts);

  b.require('bitcore/node_modules/browserify-buffertools/buffertools.js', {
    expose: 'buffertools'
  });

  b.require('./copay', {
    expose: 'copay'
  });
  b.require('./version');
  //  b.external('bitcore');
  b.require('./js/models/core/WalletFactory', {
    expose: '../js/models/core/WalletFactory'
  });
  b.require('./js/models/core/Wallet');
  b.require('./js/models/core/Wallet', {
    expose: '../../js/models/core/Wallet'
  });
  b.require('./js/models/core/WalletLock', {
    expose: '../js/models/core/WalletLock'
  });
  b.require('./js/models/network/WebRTC', {
    expose: '../js/models/network/WebRTC'
  });
  b.require('./js/models/blockchain/Insight', {
    expose: '../js/models/blockchain/Insight'
  });
  b.require('./js/models/core/PrivateKey', {
    expose: '../js/models/core/PrivateKey'
  });
  b.require('./js/models/core/PublicKeyRing', {
    expose: '../js/models/core/PublicKeyRing'
  });
  b.require('./js/models/core/Passphrase', {
    expose: '../js/models/core/Passphrase'
  });
  b.require('./js/models/core/HDPath', {
    expose: '../js/models/core/HDPath'
  });
  b.require('./js/models/storage/File', {
    expose: '../js/models/storage/File'
  });
  b.require('./config', {
    expose: '../config'
  });

  if (opts.debug) {
    //include dev dependencies
    b.require('sinon');
    b.require('blanket');
    b.require('./test/mocks/FakeStorage', {
      expose: './mocks/FakeStorage'
    });
    b.require('./test/mocks/FakeLocalStorage', {
      expose: './mocks/FakeLocalStorage'
    });
    b.require('./js/models/core/Message', {
      expose: '../js/models/core/Message'
    });
    b.require('./test/mocks/FakeBlockchain', {
      expose: './mocks/FakeBlockchain'
    });
    b.require('./test/mocks/FakeNetwork', {
      expose: './mocks/FakeNetwork'
    });
    b.require('./test/mocks/FakePayProServer', {
      expose: './mocks/FakePayProServer'
    });
    b.require('./test/mocks/FakePayProServer', {
      expose: '../../mocks/FakePayProServer'
    });
    b.require('./test/mocks/FakeBuilder', {
      expose: './mocks/FakeBuilder'
    });
  }

  if (!opts.debug) {
    b.transform({
      global: true
    }, 'uglifyify');
  }
  var bundle = b.bundle();
  return bundle;
};

if (require.main === module) {
  var list = function(val) {
    return val.split(',');
  };
  var program = require('commander');
  program
  .version('0.0.1')
  .option('-d, --debug', 'Development. Don\'t minify the codem and include debug packages.')
  .option('-o, --stdout', 'Specify output as stdout')
  .parse(process.argv);

  createVersion();
  var copayBundle = createBundle(program);
  copayBundle.pipe(program.stdout ? process.stdout : fs.createWriteStream('js/copayBundle.js'));
}

module.exports.createBundle = createBundle;
