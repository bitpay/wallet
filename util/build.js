#!/usr/bin/env node

'use strict';

var fs = require('fs');
var browserify = require('browserify');
var exec = require('child_process').exec;
var shell = require('shelljs');

var puts = function(error, stdout, stderr) {
  if (error) console.log(error);
};

var getCommitHash = function() {
  //exec git command to get the hash of the current commit
  //git rev-parse HEAD

  var hash = shell.exec('git rev-parse HEAD', {
    silent: true
  }).output.trim().substr(0, 7);
  return hash;
}

var createVersion = function() {
  var json = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  var content = 'module.exports.version="' + json.version + '";';

  content = content + '\nmodule.exports.commitHash="' + getCommitHash() + '";';
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
  b.require('browser-request', {
    expose: 'request'
  });
  b.require('underscore');
  b.require('assert');
  b.require('preconditions');

  b.require('./copay', {
    expose: 'copay'
  });
  b.require('./version');

  b.require('./js/log', {
    expose: '../js/log'
  });
  //  b.external('bitcore');
  b.require('./js/models/Identity', {
    expose: '../js/models/Identity'
  });
  b.require('./js/models/Wallet');
  b.require('./js/models/Wallet', {
    expose: '../../js/models/Wallet'
  });
  b.require('./js/models/WalletLock', {
    expose: '../js/models/WalletLock'
  });
  b.require('./js/models/Insight', {
    expose: '../js/models/Insight'
  });
  b.require('./js/models/PrivateKey', {
    expose: '../js/models/PrivateKey'
  });
  b.require('./js/models/PublicKeyRing', {
    expose: '../js/models/PublicKeyRing'
  });
  b.require('./js/models/Passphrase', {
    expose: '../js/models/Passphrase'
  });
  b.require('./js/models/HDPath', {
    expose: '../js/models/HDPath'
  });
  b.require('./js/models/PluginManager', {
    expose: '../js/models/PluginManager'
  });

  if (!opts.disablePlugins) {
    b.require('./plugins/GoogleDrive', {
      expose: '../plugins/GoogleDrive'
    });
    b.require('./plugins/LocalStorage', {
      expose: '../plugins/LocalStorage'
    });
  }

  b.require('./config', {
    expose: '../config'
  });

  if (opts.debug) {
    //include dev dependencies
    b.require('sinon');
    b.require('blanket');
    b.require('./test/mocks/FakeLocalStorage', {
      expose: './mocks/FakeLocalStorage'
    });
    b.require('./test/mocks/FakeBlockchain', {
      expose: './mocks/FakeBlockchain'
    });
    b.require('./test/mocks/FakeBlockchainSocket', {
      expose: './mocks/FakeBlockchainSocket'
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
